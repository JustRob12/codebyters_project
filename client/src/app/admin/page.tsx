'use client';

import AdminDashboardHeader from "@/components/AdminDashboardHeader";
import AdminLeftColumn from "@/components/AdminLeftColumn";
import MiddleColumn from "@/components/MiddleColumn";
import AdminRightColumn from "@/components/AdminRightColumn";
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useGlobalLoading } from '@/contexts/LoadingContext';

export default function AdminDashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [newUsers, setNewUsers] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { startLoading, stopLoading } = useGlobalLoading();

  useEffect(() => {
    checkAuthentication();
  }, []);

  const checkAuthentication = async () => {
    try {
      startLoading('Loading admin dashboard...');
      const userData = localStorage.getItem('user');
      if (userData) {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        // Fetch other data only if authenticated
        await fetchNewUsers();
        await fetchEvents();
      }
    } catch (error) {
      console.error('Error checking authentication:', error);
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
          event_pictures (id, picture_url, picture_order)
        `)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (eventsError) throw eventsError;

      // Transform data to include pictures array
      const transformedEvents = eventsData?.map(event => ({
        ...event,
        pictures: event.event_pictures
          ?.sort((a: any, b: any) => a.picture_order - b.picture_order)
          .map((pic: any) => ({
            id: pic.id || Math.random(),
            picture_url: pic.picture_url
          })) || []
      })) || [];

      setEvents(transformedEvents);
    } catch (error) {
      console.error('Error fetching events:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AdminDashboardHeader />
        <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#20B2AA] mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading admin dashboard...</p>
                  </div>
                </div>
              </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminDashboardHeader />
      
      <div className="pt-0">
        <div className="w-full">
          {/* Mobile View - Only Middle Column */}
          <div className="block lg:hidden">
            <MiddleColumn user={user} events={events} loading={loading} />
        </div>

          {/* Desktop View - All Columns */}
                  <div className="hidden lg:grid grid-cols-12">
                    <AdminLeftColumn user={user} />
                    <MiddleColumn user={user} events={events} loading={loading} />
                    <AdminRightColumn newUsers={newUsers} />
                  </div>
        </div>
      </div>
    </div>
  );
}
