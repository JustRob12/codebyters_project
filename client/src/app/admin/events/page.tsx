'use client';

import { useState, useEffect } from 'react';
import AdminDashboardHeader from "@/components/AdminDashboardHeader";
import CloudinaryUpload from "@/components/CloudinaryUpload";
import { supabase } from "@/lib/supabase";
import Image from 'next/image';
import { useGlobalLoading } from '@/contexts/LoadingContext';

interface Event {
  id: number;
  title: string;
  description: string;
  event_date: string;
  status: 'active' | 'inactive';
  created_at: string;
  pictures: string[];
}

export default function AdminEventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    event_date: '',
    status: 'active' as 'active' | 'inactive',
    pictures: [] as string[]
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [showEditForm, setShowEditForm] = useState(false);
  const { startLoading, stopLoading } = useGlobalLoading();

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const { data: eventsData, error: eventsError } = await supabase
        .from('events')
        .select(`
          *,
          event_pictures (picture_url, picture_order)
        `)
        .order('created_at', { ascending: false });

      if (eventsError) throw eventsError;

      // Transform data to include pictures array
      const transformedEvents = eventsData?.map(event => ({
        ...event,
        pictures: event.event_pictures
          ?.sort((a: any, b: any) => a.picture_order - b.picture_order)
          .map((pic: any) => pic.picture_url) || []
      })) || [];

      setEvents(transformedEvents);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    startLoading('Creating event...');

    try {
      // Insert event
      const { data: eventData, error: eventError } = await supabase
        .from('events')
        .insert([{
          title: newEvent.title,
          description: newEvent.description,
          event_date: newEvent.event_date,
          status: newEvent.status,
          created_by: 1 // This should be the actual admin user ID
        }])
        .select()
        .single();

      if (eventError) throw eventError;

      // Insert pictures if any
      if (newEvent.pictures.length > 0) {
        const pictureData = newEvent.pictures.map((url, index) => ({
          event_id: eventData.id,
          picture_url: url,
          picture_order: index + 1
        }));

        const { error: picturesError } = await supabase
          .from('event_pictures')
          .insert(pictureData);

        if (picturesError) throw picturesError;
      }

      // Reset form and refresh events
      setNewEvent({
        title: '',
        description: '',
        event_date: '',
        status: 'active',
        pictures: []
      });
      setShowAddForm(false);
      fetchEvents();
    } catch (error) {
      console.error('Error adding event:', error);
    } finally {
      setIsSubmitting(false);
      stopLoading();
    }
  };

  const handleEditEvent = (event: Event) => {
    setEditingEvent(event);
    setNewEvent({
      title: event.title,
      description: event.description,
      event_date: new Date(event.event_date).toISOString().slice(0, 16),
      status: event.status,
      pictures: event.pictures
    });
    setShowEditForm(true);
  };

  const handleUpdateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEvent) return;

    setIsSubmitting(true);
    startLoading('Updating event...');

    try {
      // Update event
      const { error: eventError } = await supabase
        .from('events')
        .update({
          title: newEvent.title,
          description: newEvent.description,
          event_date: newEvent.event_date,
          status: newEvent.status
        })
        .eq('id', editingEvent.id);

      if (eventError) throw eventError;

      // Delete existing pictures
      const { error: deleteError } = await supabase
        .from('event_pictures')
        .delete()
        .eq('event_id', editingEvent.id);

      if (deleteError) throw deleteError;

      // Insert new pictures
      if (newEvent.pictures.length > 0) {
        const pictureData = newEvent.pictures.map((url, index) => ({
          event_id: editingEvent.id,
          picture_url: url,
          picture_order: index + 1
        }));

        const { error: picturesError } = await supabase
          .from('event_pictures')
          .insert(pictureData);

        if (picturesError) throw picturesError;
      }

      // Reset form and refresh events
      setEditingEvent(null);
      setNewEvent({
        title: '',
        description: '',
        event_date: '',
        status: 'active',
        pictures: []
      });
      setShowEditForm(false);
      fetchEvents();
    } catch (error) {
      console.error('Error updating event:', error);
    } finally {
      setIsSubmitting(false);
      stopLoading();
    }
  };

  const handleDeleteEvent = async (eventId: number) => {
    if (!confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
      return;
    }

    startLoading('Deleting event...');

    try {
      // Delete event (pictures will be deleted automatically due to CASCADE)
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', eventId);

      if (error) throw error;

      fetchEvents();
    } catch (error) {
      console.error('Error deleting event:', error);
    } finally {
      stopLoading();
    }
  };

  const addPictureUrl = () => {
    if (newEvent.pictures.length < 8) {
      setNewEvent({
        ...newEvent,
        pictures: [...newEvent.pictures, '']
      });
    }
  };

  const removePictureUrl = (index: number) => {
    setNewEvent({
      ...newEvent,
      pictures: newEvent.pictures.filter((_, i) => i !== index)
    });
  };

  const updatePictureUrl = (index: number, url: string) => {
    const updatedPictures = [...newEvent.pictures];
    updatedPictures[index] = url;
    setNewEvent({
      ...newEvent,
      pictures: updatedPictures
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AdminDashboardHeader />
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
    <div className="min-h-screen bg-gray-50">
      <AdminDashboardHeader />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Events Management</h1>
            <p className="mt-2 text-gray-600">Manage your Codebyters events</p>
          </div>
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-[#20B2AA] text-white px-4 py-2 rounded-lg hover:opacity-90 transition-opacity flex items-center"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add Event
          </button>
        </div>

        {/* Add Event Form Modal */}
        {showAddForm && (
          <div className="fixed inset-0 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto border-2 border-gray-200 shadow-2xl">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-2xl font-bold text-gray-900">Add New Event</h2>
                  <button
                    onClick={() => setShowAddForm(false)}
                    className="text-gray-500 hover:text-gray-700 text-2xl"
                  >
                    ×
                  </button>
                </div>

                <form onSubmit={handleAddEvent} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Event Title
                    </label>
                    <input
                      type="text"
                      value={newEvent.title}
                      onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#20B2AA] focus:border-transparent text-black"
                      placeholder="Enter event title"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      value={newEvent.description}
                      onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                      required
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#20B2AA] focus:border-transparent text-black"
                      placeholder="Enter event description"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Event Date & Time
                      </label>
                      <input
                        type="datetime-local"
                        value={newEvent.event_date}
                        onChange={(e) => setNewEvent({ ...newEvent, event_date: e.target.value })}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#20B2AA] focus:border-transparent text-black"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Status
                      </label>
                      <select
                        value={newEvent.status}
                        onChange={(e) => setNewEvent({ ...newEvent, status: e.target.value as 'active' | 'inactive' })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#20B2AA] focus:border-transparent text-black"
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                      </select>
                    </div>
                  </div>

                  {/* Pictures Section */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Event Pictures - Max 8
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {newEvent.pictures.map((url, index) => (
                        <div key={index} className="space-y-2">
                          <CloudinaryUpload
                            onUpload={(uploadedUrl) => updatePictureUrl(index, uploadedUrl)}
                            onRemove={() => removePictureUrl(index)}
                            currentUrl={url}
                          />
                        </div>
                      ))}
                    </div>
                    {newEvent.pictures.length < 8 && (
                      <button
                        type="button"
                        onClick={addPictureUrl}
                        className="mt-4 text-[#20B2AA] hover:text-[#1a9b9b] flex items-center"
                      >
                        <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        Add Picture
                      </button>
                    )}
                  </div>

                  <div className="flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => setShowAddForm(false)}
                      className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-4 py-2 bg-[#20B2AA] text-white rounded-lg hover:opacity-90 disabled:opacity-50 flex items-center"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      {isSubmitting ? 'Adding...' : 'Add Event'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Edit Event Form Modal */}
        {showEditForm && editingEvent && (
          <div className="fixed inset-0 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto border-2 border-gray-200 shadow-2xl">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-2xl font-bold text-gray-900">Edit Event</h2>
                  <button
                    onClick={() => {
                      setShowEditForm(false);
                      setEditingEvent(null);
                      setNewEvent({
                        title: '',
                        description: '',
                        event_date: '',
                        status: 'active',
                        pictures: []
                      });
                    }}
                    className="text-gray-500 hover:text-gray-700 text-2xl"
                  >
                    ×
                  </button>
                </div>

                <form onSubmit={handleUpdateEvent} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Event Title
                    </label>
                    <input
                      type="text"
                      value={newEvent.title}
                      onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#20B2AA] focus:border-transparent text-black"
                      placeholder="Enter event title"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      value={newEvent.description}
                      onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                      required
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#20B2AA] focus:border-transparent text-black"
                      placeholder="Enter event description"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Event Date & Time
                      </label>
                      <input
                        type="datetime-local"
                        value={newEvent.event_date}
                        onChange={(e) => setNewEvent({ ...newEvent, event_date: e.target.value })}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#20B2AA] focus:border-transparent text-black"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Status
                      </label>
                      <select
                        value={newEvent.status}
                        onChange={(e) => setNewEvent({ ...newEvent, status: e.target.value as 'active' | 'inactive' })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#20B2AA] focus:border-transparent text-black"
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                      </select>
                    </div>
                  </div>

                  {/* Pictures Section */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Event Pictures - Max 8
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {newEvent.pictures.map((url, index) => (
                        <div key={index} className="space-y-2">
                          <CloudinaryUpload
                            onUpload={(uploadedUrl) => updatePictureUrl(index, uploadedUrl)}
                            onRemove={() => removePictureUrl(index)}
                            currentUrl={url}
                          />
                        </div>
                      ))}
                    </div>
                    {newEvent.pictures.length < 8 && (
                      <button
                        type="button"
                        onClick={addPictureUrl}
                        className="mt-4 text-[#20B2AA] hover:text-[#1a9b9b] flex items-center"
                      >
                        <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        Add Picture
                      </button>
                    )}
                  </div>

                  <div className="flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => {
                        setShowEditForm(false);
                        setEditingEvent(null);
                        setNewEvent({
                          title: '',
                          description: '',
                          event_date: '',
                          status: 'active',
                          pictures: []
                        });
                      }}
                      className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-4 py-2 bg-[#20B2AA] text-white rounded-lg hover:opacity-90 disabled:opacity-50 flex items-center"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      {isSubmitting ? 'Updating...' : 'Update Event'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Events Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => (
            <div key={event.id} className="bg-white rounded-lg shadow-md overflow-hidden">
              {/* Event Image */}
              {event.pictures.length > 0 && (
                <div className="h-48 relative">
                  <Image
                    src={event.pictures[0]}
                    alt={event.title}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
              )}
              
              {/* Event Content */}
              <div className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-semibold text-gray-900">{event.title}</h3>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    event.status === 'active' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {event.status}
                  </span>
                </div>
                
                <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                  {event.description}
                </p>
                
                <div className="flex items-center text-sm text-gray-500">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {new Date(event.event_date).toLocaleDateString()}
                </div>
                
                {event.pictures.length > 1 && (
                  <div className="mt-3 text-sm text-gray-500">
                    +{event.pictures.length - 1} more image{event.pictures.length - 1 !== 1 ? 's' : ''}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="mt-4 flex space-x-2">
                  <button
                    onClick={() => handleEditEvent(event)}
                    className="flex-1 bg-[#20B2AA] text-white px-3 py-2 rounded-lg hover:opacity-90 transition-opacity text-sm flex items-center justify-center"
                    title="Edit Event"
                  >
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteEvent(event.id)}
                    className="flex-1 bg-red-500 text-white px-3 py-2 rounded-lg hover:opacity-90 transition-opacity text-sm flex items-center justify-center"
                    title="Delete Event"
                  >
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {events.length === 0 && (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No events</h3>
            <p className="mt-1 text-sm text-gray-500">Get started by creating a new event.</p>
          </div>
        )}
      </div>
    </div>
  );
}
