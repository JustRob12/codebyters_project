'use client';

import StudentHeader from '@/components/StudentHeader';
import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';

interface Student {
  id: number;
  first_name: string;
  last_name: string;
  student_id: string;
  profile_picture: string;
  year: string;
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

interface SearchResults {
  students: Student[];
  events: Event[];
}

export default function SearchPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<SearchResults>({ students: [], events: [] });
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'students' | 'events'>('all');
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const query = searchParams.get('q');
    if (query) {
      setSearchQuery(query);
      performSearch(query);
    }
  }, [searchParams]);

  const performSearch = async (query: string) => {
    if (query.length < 2) {
      setResults({ students: [], events: [] });
      return;
    }

    setLoading(true);
    try {
      // Search students
      const { data: studentsData, error: studentsError } = await supabase
        .from('users')
        .select('id, first_name, last_name, student_id, profile_picture, year, created_at')
        .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%,student_id.ilike.%${query}%`)
        .eq('is_active', true)
        .limit(10);

      if (studentsError) throw studentsError;

      // Search events
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
        .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
        .eq('status', 'active')
        .limit(10);

      if (eventsError) throw eventsError;

      const eventsWithPictures = eventsData?.map(event => ({
        ...event,
        pictures: event.event_pictures || []
      })) || [];

      setResults({
        students: studentsData || [],
        events: eventsWithPictures
      });
    } catch (error) {
      console.error('Error performing search:', error);
      setResults({ students: [], events: [] });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const visitProfile = (userId: number) => {
    // Check if it's the current user's own profile
    const currentUser = localStorage.getItem('user');
    if (currentUser) {
      const user = JSON.parse(currentUser);
      if (user.id === userId) {
        router.push('/profile');
      } else {
        router.push(`/visit-profile?id=${userId}`);
      }
    } else {
      router.push(`/visit-profile?id=${userId}`);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
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

  const filteredResults = () => {
    switch (activeTab) {
      case 'students':
        return { students: results.students, events: [] };
      case 'events':
        return { students: [], events: results.events };
      default:
        return results;
    }
  };

  const currentResults = filteredResults();
  const totalResults = results.students.length + results.events.length;

  return (
    <div className="min-h-screen bg-gray-50">
      <StudentHeader />
      
      <div className="pt-8">
        <div className="max-w-4xl mx-auto px-4 py-8">

          {/* Results Header */}
          {searchQuery && (
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Search Results for "{searchQuery}"
              </h1>
              <p className="text-gray-600">
                {loading ? 'Searching...' : `${totalResults} results found`}
              </p>
            </div>
          )}

          {/* Filter Tabs */}
          {searchQuery && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
              <div className="flex border-b border-gray-200">
                <button
                  onClick={() => setActiveTab('all')}
                  className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'all'
                      ? 'border-[#20B2AA] text-[#20B2AA]'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  All ({totalResults})
                </button>
                <button
                  onClick={() => setActiveTab('students')}
                  className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'students'
                      ? 'border-[#20B2AA] text-[#20B2AA]'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Students ({results.students.length})
                </button>
                <button
                  onClick={() => setActiveTab('events')}
                  className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'events'
                      ? 'border-[#20B2AA] text-[#20B2AA]'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Events ({results.events.length})
                </button>
              </div>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 animate-pulse">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Results */}
          {!loading && searchQuery && (
            <div className="space-y-4">
              {/* Students Results */}
              {currentResults.students.length > 0 && (
                <div className="space-y-3">
                  {currentResults.students.map((student) => (
                    <div key={student.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-[#20B2AA] rounded-full flex items-center justify-center overflow-hidden flex-shrink-0">
                          {student.profile_picture ? (
                            <Image
                              src={student.profile_picture}
                              alt={`${student.first_name} ${student.last_name}`}
                              width={48}
                              height={48}
                              className="rounded-full object-cover w-full h-full"
                              style={{ borderRadius: '50%' }}
                              unoptimized
                            />
                          ) : (
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {student.first_name} {student.last_name}
                          </h3>
                          <p className="text-sm text-gray-500">Student ID: {student.student_id}</p>
                          <p className="text-sm text-gray-500">Year: {student.year}</p>
                          <p className="text-xs text-gray-400">Joined {formatDate(student.created_at)}</p>
                        </div>
                        <button
                          onClick={() => visitProfile(student.id)}
                          className="bg-[#20B2AA] text-white px-4 py-2 rounded-lg hover:bg-[#1a9b9b] transition-colors text-sm font-medium"
                        >
                          View Profile
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Events Results */}
              {currentResults.events.length > 0 && (
                <div className="space-y-4">
                  {currentResults.events.map((event) => (
                    <div key={event.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                      {/* Event Header */}
                      <div className="p-4 pb-2">
                        <div className="flex items-start space-x-3">
                          <div className="w-10 h-10 bg-[#20B2AA] rounded-lg flex items-center justify-center flex-shrink-0">
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-lg font-semibold text-gray-900 mb-1">
                              {event.title}
                            </h3>
                            <div className="flex items-center space-x-4 text-sm text-gray-500">
                              <span className="flex items-center">
                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                {formatDate(event.event_date)}
                              </span>
                              <span className="flex items-center">
                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                {getTimeAgo(event.created_at)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Event Description */}
                      <div className="px-4 pb-3">
                        <p className="text-sm text-gray-600 line-clamp-3">
                          {event.description}
                        </p>
                      </div>

                      {/* Event Pictures */}
                      {event.pictures && event.pictures.length > 0 && (
                        <div className="px-4 pb-4">
                          {event.pictures.length === 1 ? (
                            // Single image - full width
                            <div className="relative">
                              <Image
                                src={event.pictures[0].picture_url}
                                alt={event.title}
                                width={1080}
                                height={566}
                                className="w-full h-48 sm:h-56 md:h-64 lg:h-72 object-cover rounded-lg"
                                unoptimized
                              />
                            </div>
                          ) : event.pictures.length === 2 ? (
                            // Two images - side by side
                            <div className="grid grid-cols-2 gap-2">
                              {event.pictures.slice(0, 2).map((picture, index) => (
                                <div key={index} className="relative">
                                  <Image
                                    src={picture.picture_url}
                                    alt={`${event.title} ${index + 1}`}
                                    width={1080}
                                    height={566}
                                    className="w-full h-32 sm:h-36 md:h-40 object-cover rounded-lg"
                                    unoptimized
                                  />
                                </div>
                              ))}
                            </div>
                          ) : event.pictures.length >= 3 ? (
                            // Three or more images - grid layout
                            <div className="grid grid-cols-2 gap-2">
                              <div className="relative">
                                <Image
                                  src={event.pictures[0].picture_url}
                                  alt={`${event.title} 1`}
                                  width={1080}
                                  height={566}
                                  className="w-full h-32 sm:h-36 md:h-40 object-cover rounded-lg"
                                  unoptimized
                                />
                              </div>
                              <div className="grid grid-rows-2 gap-2">
                                {event.pictures.slice(1, 3).map((picture, index) => (
                                  <div key={index} className="relative">
                                    <Image
                                      src={picture.picture_url}
                                      alt={`${event.title} ${index + 2}`}
                                      width={1080}
                                      height={566}
                                      className="w-full h-16 sm:h-18 md:h-20 object-cover rounded-lg"
                                      unoptimized
                                    />
                                    {index === 1 && event.pictures.length > 3 && (
                                      <div className="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center">
                                        <span className="text-white font-semibold text-lg">
                                          +{event.pictures.length - 3}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : null}
                        </div>
                      )}

                      {/* Event Action Button */}
                      <div className="px-4 pb-4">
                        <Link
                          href="/events"
                          className="inline-flex items-center bg-[#20B2AA] text-white px-4 py-2 rounded-lg hover:bg-[#1a9b9b] transition-colors text-sm font-medium"
                        >
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          View Event
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* No Results */}
              {!loading && totalResults === 0 && (
                <div className="text-center py-12">
                  <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No results found</h3>
                  <p className="text-gray-500">Try searching with different keywords</p>
                </div>
              )}
            </div>
          )}

          {/* Empty State */}
          {!searchQuery && (
            <div className="text-center py-12">
              <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Search Codebyters</h3>
              <p className="text-gray-500">Find students, events, and more</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
