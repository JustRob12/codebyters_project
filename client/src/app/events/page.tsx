'use client';

import StudentHeader from '@/components/StudentHeader';
import Header from '@/components/Header';
import ViewEventsStudent from '@/components/ViewEventsStudent';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

interface Event {
  id: number;
  title: string;
  description: string;
  event_date: string;
  status: string;
  created_at: string;
  pictures: Array<{
    id: number;
    picture_url: string;
    picture_order: number;
  }>;
}

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();

  useEffect(() => {
    checkAuthentication();
  }, []);

  const checkAuthentication = async () => {
    try {
      const userData = localStorage.getItem('user');
      if (userData) {
        setIsAuthenticated(true);
        fetchEvents();
      } else {
        setIsAuthenticated(false);
        router.push('/login');
      }
    } catch (error) {
      console.error('Error checking authentication:', error);
      setIsAuthenticated(false);
      router.push('/login');
    }
  };

  const fetchEvents = async () => {
    try {
      const { data: eventsData, error: eventsError } = await supabase
        .from('events')
        .select(`
          *,
          event_pictures (
            id,
            picture_url,
            picture_order
          )
        `)
        .eq('status', 'active')
        .order('event_date', { ascending: true });

      if (eventsError) throw eventsError;

      const eventsWithPictures = eventsData?.map(event => ({
        ...event,
        pictures: event.event_pictures || []
      })) || [];

      setEvents(eventsWithPictures);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  // Show loading or redirect if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Header />
        <div className="pt-16 flex items-center justify-center min-h-[calc(100vh-4rem)]">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
            <p className="text-gray-600 mb-6">Please log in to view events.</p>
            <button
              onClick={() => router.push('/login')}
              className="bg-[#20B2AA] text-white px-6 py-2 rounded-lg hover:opacity-90 transition-opacity"
            >
              Go to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <StudentHeader />
      
      <div className="pt-0">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <ViewEventsStudent events={events} loading={loading} />
        </div>
      </div>
    </div>
  );
}
