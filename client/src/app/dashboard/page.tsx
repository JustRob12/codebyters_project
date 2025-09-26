'use client';

import StudentHeader from '@/components/StudentHeader';
import Header from '@/components/Header';
import LeftColumn from '@/components/LeftColumn';
import MiddleColumn from '@/components/MiddleColumn';
import RightColumn from '@/components/RightColumn';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useGlobalLoading } from '@/contexts/LoadingContext';
import AuthGuard from '@/components/AuthGuard';

interface User {
  id: number;
  first_name: string;
  last_name: string;
  middle_initial: string;
  profile_picture: string;
  created_at: string;
}

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

export default function Dashboard() {
  const [user, setUser] = useState<any>(null);
  const [newUsers, setNewUsers] = useState<User[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();
  const { startLoading, stopLoading } = useGlobalLoading();

  useEffect(() => {
    checkAuthentication();
  }, []);

  const checkAuthentication = async () => {
    try {
      startLoading('Loading dashboard...');
      const userData = localStorage.getItem('user');
      if (userData) {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        setIsAuthenticated(true);
        // Fetch other data only if authenticated
        await fetchNewUsers();
        await fetchEvents();
      } else {
        setIsAuthenticated(false);
        router.push('/login');
      }
    } catch (error) {
      console.error('Error checking authentication:', error);
      setIsAuthenticated(false);
      router.push('/login');
    } finally {
      setLoading(false);
      stopLoading();
    }
  };


  const fetchNewUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, first_name, last_name, middle_initial, profile_picture, created_at')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setNewUsers(data || []);
    } catch (error) {
      console.error('Error fetching new users:', error);
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
        .order('created_at', { ascending: false })
        .limit(10);

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
        <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#20B2AA] mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <AuthGuard requireAuth={true} allowedRoles={[2]}>
      <div className="min-h-screen bg-gray-100">
        <StudentHeader />
        
        <div className="pt-0">
          <div className="w-full">
            {/* Mobile View - Only Middle Column */}
            <div className="block lg:hidden">
              <MiddleColumn user={user} events={events} loading={loading} />
            </div>
            
            {/* Desktop View - All Columns */}
            <div className="hidden lg:grid grid-cols-12">
              <LeftColumn user={user} />
              <MiddleColumn user={user} events={events} loading={loading} />
              <RightColumn newUsers={newUsers} />
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}