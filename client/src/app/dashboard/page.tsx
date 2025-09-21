'use client';

import StudentHeader from '@/components/StudentHeader';
import LeftColumn from '@/components/LeftColumn';
import MiddleColumn from '@/components/MiddleColumn';
import RightColumn from '@/components/RightColumn';
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

  useEffect(() => {
    fetchUserData();
    fetchNewUsers();
    fetchEvents();
  }, []);

  const fetchUserData = async () => {
    try {
      const userData = localStorage.getItem('user');
      if (userData) {
        setUser(JSON.parse(userData));
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
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

  return (
    <div className="min-h-screen bg-gray-100">
      <StudentHeader />
      
      <div className="pt-0">
        <div className="w-full">
          <div className="grid grid-cols-1 lg:grid-cols-12">
            <LeftColumn user={user} />
            <MiddleColumn user={user} events={events} loading={loading} />
            <RightColumn newUsers={newUsers} />
          </div>
        </div>
      </div>
    </div>
  );
}