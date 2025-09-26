'use client';

import StudentHeader from '@/components/StudentHeader';
import FloatingNavigation from '@/components/FloatingNavigation';
import Header from '@/components/Header';
import ViewEventsStudent from '@/components/ViewEventsStudent';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import AuthGuard from '@/components/AuthGuard';

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

  // Show loading while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100">
        <StudentHeader />
        <FloatingNavigation user={null} />
        <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#20B2AA] mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading events...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <AuthGuard requireAuth={true} allowedRoles={[2]}>
      <div className="min-h-screen bg-gray-100">
        <StudentHeader />
        <FloatingNavigation user={null} />
        
        <div className="pt-0">
          <div className="max-w-7xl mx-auto px-4 py-8">
            <ViewEventsStudent events={events} loading={loading} />
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
