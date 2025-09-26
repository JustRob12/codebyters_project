'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface AdminLeftColumnProps {
  user: any;
}

interface Event {
  id: number;
  title: string;
  event_date: string;
  status: string;
}

export default function AdminLeftColumn({ user }: AdminLeftColumnProps) {
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
        <Link href="/admin" className="block hover:bg-gray-50 rounded-lg p-3 transition-colors">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 truncate">
                {user ? `${user.first_name} ${user.last_name}` : 'Loading...'}
              </h3>
              <p className="text-sm text-red-600 font-medium">Admin</p>
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
            href="/admin/events" 
            className="text-sm text-[#20B2AA] hover:text-[#1a9b9b] transition-colors"
          >
            Manage Events
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

      {/* Admin Quick Actions */}
      <div className="p-3">
        <h4 className="font-semibold text-black mb-3">Admin Actions</h4>
        <div className="space-y-2">
          <Link 
            href="/admin/events"
            className="w-full text-left p-2 hover:bg-gray-50 rounded-lg flex items-center text-black"
          >
            <svg className="w-5 h-5 mr-3 text-[#20B2AA]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Manage Events
          </Link>
          <Link 
            href="/admin/committees"
            className="w-full text-left p-2 hover:bg-gray-50 rounded-lg flex items-center text-black"
          >
            <svg className="w-5 h-5 mr-3 text-[#20B2AA]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            Manage Committees
          </Link>
          <Link 
            href="/admin/users"
            className="w-full text-left p-2 hover:bg-gray-50 rounded-lg flex items-center text-black"
          >
            <svg className="w-5 h-5 mr-3 text-[#20B2AA]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
            </svg>
            Manage Users
          </Link>
        </div>
      </div>
    </div>
  );
}






