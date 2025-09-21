'use client';

import Image from 'next/image';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface User {
  id: number;
  first_name: string;
  last_name: string;
  middle_initial: string;
  profile_picture: string;
  created_at: string;
}

interface Activity {
  id: number;
  type: 'event' | 'user';
  title: string;
  description: string;
  created_at: string;
  user_name?: string;
  event_title?: string;
}

interface RightColumnProps {
  newUsers: User[];
}

export default function RightColumn({ newUsers }: RightColumnProps) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecentActivity();
  }, []);

  const fetchRecentActivity = async () => {
    try {
      setLoading(true);
      
      // Fetch recent events
      const { data: eventsData, error: eventsError } = await supabase
        .from('events')
        .select('id, title, created_at')
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(3);

      if (eventsError) throw eventsError;

      // Fetch recent users
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('id, first_name, last_name, created_at')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(3);

      if (usersError) throw usersError;

      // Combine and format activities
      const eventActivities = eventsData?.map(event => ({
        id: event.id,
        type: 'event' as const,
        title: 'New event posted',
        description: event.title,
        created_at: event.created_at,
        event_title: event.title
      })) || [];

      const userActivities = usersData?.map(user => ({
        id: user.id,
        type: 'user' as const,
        title: 'New member joined',
        description: `${user.first_name} ${user.last_name}`,
        created_at: user.created_at,
        user_name: `${user.first_name} ${user.last_name}`
      })) || [];

      // Combine and sort by date
      const allActivities = [...eventActivities, ...userActivities]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 5);

      setActivities(allActivities);
    } catch (error) {
      console.error('Error fetching recent activity:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTimeAgo = (dateString: string) => {
    const now = new Date();
    const postDate = new Date(dateString);
    const diffInSeconds = Math.floor((now.getTime() - postDate.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return 'Just now';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else if (diffInSeconds < 604800) {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} day${days > 1 ? 's' : ''} ago`;
    } else {
      const weeks = Math.floor(diffInSeconds / 604800);
      return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
    }
  };

  return (
    <div className="lg:col-span-3 h-[calc(100vh-4rem)] overflow-hidden bg-white">
      <div className="p-3">
        <h4 className="font-semibold text-gray-900 mb-4">New Members</h4>
        <div className="space-y-3">
          {newUsers.map((newUser) => (
            <div key={newUser.id} className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                {newUser.profile_picture ? (
                  <Image
                    src={newUser.profile_picture}
                    alt={`${newUser.first_name} ${newUser.last_name}`}
                    width={40}
                    height={40}
                    className="rounded-full object-cover w-full h-full"
                    style={{ borderRadius: '50%' }}
                    unoptimized
                  />
                ) : (
                  <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900">
                  {newUser.first_name} {newUser.last_name}
                </p>
                <p className="text-sm text-gray-500">
                  Joined {formatDate(newUser.created_at)}
                </p>
              </div>
              <button className="text-[#20B2AA] hover:text-[#1a9b9b]">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="p-3 mt-4">
        <h4 className="font-semibold text-gray-900 mb-4">Recent Activity</h4>
        {loading ? (
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded animate-pulse mb-1"></div>
                <div className="h-3 bg-gray-200 rounded animate-pulse w-20"></div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded animate-pulse mb-1"></div>
                <div className="h-3 bg-gray-200 rounded animate-pulse w-16"></div>
              </div>
            </div>
          </div>
        ) : activities.length > 0 ? (
          <div className="space-y-3">
            {activities.map((activity) => (
              <div key={`${activity.type}-${activity.id}`} className="flex items-center space-x-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  activity.type === 'event' ? 'bg-[#20B2AA]' : 'bg-green-500'
                }`}>
                  {activity.type === 'event' ? (
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-900">{activity.title}</p>
                  <p className="text-xs text-gray-500">{activity.description}</p>
                  <p className="text-xs text-gray-400">{getTimeAgo(activity.created_at)}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-sm text-gray-500">No recent activity</p>
          </div>
        )}
      </div>
    </div>
  );
}
