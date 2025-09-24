'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

interface Event {
  id: number;
  title: string;
  event_date: string;
  status: string;
}

interface AdminRightColumnProps {
  newUsers: any[];
}

export default function AdminRightColumn({ newUsers }: AdminRightColumnProps) {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const router = useRouter();

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('events')
        .select('id, title, event_date, status')
        .eq('status', 'active')
        .order('event_date', { ascending: true });

      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const isToday = (day: number) => {
    const today = new Date();
    return (
      today.getDate() === day &&
      today.getMonth() === currentDate.getMonth() &&
      today.getFullYear() === currentDate.getFullYear()
    );
  };

  const hasEvent = (day: number) => {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return events.some(event => event.event_date.startsWith(dateStr));
  };

  const handleDateClick = () => {
    router.push('/admin/events');
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const days = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-8"></div>);
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const isTodayDate = isToday(day);
      const hasEventOnDay = hasEvent(day);
      
      days.push(
        <button
          key={day}
          onClick={handleDateClick}
          className={`h-8 w-8 rounded-full text-sm font-medium transition-colors hover:bg-gray-100 ${
            isTodayDate
              ? 'bg-[#20B2AA] text-white'
              : hasEventOnDay
              ? 'bg-[#20B2AA]/20 text-[#20B2AA] border border-[#20B2AA]'
              : 'text-gray-700 hover:text-gray-900'
          }`}
        >
          {day}
        </button>
      );
    }

    return days;
  };

  return (
    <div className="lg:col-span-3 h-[calc(100vh-4rem)] overflow-hidden bg-white">
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-semibold text-gray-900">Admin Calendar</h4>
          <button
            onClick={handleDateClick}
            className="text-sm text-[#20B2AA] hover:text-[#1a9b9b] transition-colors"
          >
            Manage Events
          </button>
        </div>

        {loading ? (
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded mb-4"></div>
            <div className="grid grid-cols-7 gap-1 mb-2">
              {[...Array(7)].map((_, i) => (
                <div key={i} className="h-6 bg-gray-200 rounded"></div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {[...Array(28)].map((_, i) => (
                <div key={i} className="h-8 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        ) : (
          <div className="calendar">
            {/* Month and Year Header */}
            <div className="text-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
              </h3>
            </div>

            {/* Day Names Header */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {dayNames.map((day) => (
                <div key={day} className="text-center text-xs font-medium text-gray-500 py-1">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1">
              {renderCalendar()}
            </div>

            {/* Legend */}
            <div className="mt-4 space-y-2">
              <div className="flex items-center space-x-2 text-xs">
                <div className="w-3 h-3 bg-[#20B2AA] rounded-full"></div>
                <span className="text-gray-600">Today</span>
              </div>
              <div className="flex items-center space-x-2 text-xs">
                <div className="w-3 h-3 bg-[#20B2AA]/20 border border-[#20B2AA] rounded-full"></div>
                <span className="text-gray-600">Event Day</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Admin Stats */}
      <div className="p-4 border-t border-gray-200">
        <h4 className="font-semibold text-gray-900 mb-3">Admin Stats</h4>
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Total Users</span>
            <span className="text-sm font-medium text-gray-900">{newUsers.length}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Active Events</span>
            <span className="text-sm font-medium text-gray-900">{events.length}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">New Users Today</span>
            <span className="text-sm font-medium text-gray-900">
              {newUsers.filter(user => {
                const today = new Date();
                const userDate = new Date(user.created_at);
                return userDate.toDateString() === today.toDateString();
              }).length}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}


