'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface LeftColumnProps {
  user: any;
}

interface Event {
  id: number;
  title: string;
  event_date: string;
  status: string;
}

export default function LeftColumn({ user }: LeftColumnProps) {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('id, title, event_date, status')
        .eq('status', 'active')
        .order('event_date', { ascending: true })
        .limit(5);

      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="lg:col-span-3 h-[calc(100vh-4rem)] overflow-hidden bg-white">
      <div className="p-3 mb-4">
        <Link href="/profile" className="block hover:bg-gray-50 rounded-lg p-3 transition-colors">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
              {user?.profile_picture ? (
                <Image
                  src={user.profile_picture}
                  alt="Profile"
                  width={48}
                  height={48}
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
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 truncate">
                {user ? `${user.first_name} ${user.last_name}` : 'Loading...'}
              </h3>
              <p className="text-sm text-gray-500">Student</p>
            </div>
            <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </Link>
      </div>

      {/* Events Section */}
      <div className="p-3">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-semibold text-black">Events</h4>
          <Link 
            href="/events" 
            className="text-sm text-[#20B2AA] hover:text-[#1a9b9b] transition-colors"
          >
            View All
          </Link>
        </div>
        
        {loading ? (
          <div className="space-y-2">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              <div className="h-3 bg-gray-200 rounded w-1/3"></div>
            </div>
          </div>
        ) : events.length > 0 ? (
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {events.map((event) => (
              <div key={event.id} className="bg-gray-50 rounded-lg p-3 hover:bg-gray-100 transition-colors border border-[#20B2AA]">
                <h5 className="font-medium text-gray-900 text-sm truncate">{event.title}</h5>
                <p className="text-xs text-gray-500 mt-1">{formatDate(event.event_date)}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500">No upcoming events</p>
        )}
      </div>

      {/* Quick Actions */}
      <div className="p-3">
        <h4 className="font-semibold text-black mb-3">Quick Actions</h4>
        <div className="space-y-2">
          <button className="w-full text-left p-2 hover:bg-gray-50 rounded-lg flex items-center text-black">
            <svg className="w-5 h-5 mr-3 text-[#20B2AA]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            Committees
          </button>
        </div>
      </div>
    </div>
  );
}
