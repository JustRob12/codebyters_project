'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import ImageModal from './ImageModal';
import FloatingNavigation from './FloatingNavigation';

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

interface DailyDevPost {
  id: string;
  title: string;
  description: string;
  url: string;
  image: string;
  publishedAt: string;
  author: string;
  tags: string[];
  source: string;
}

interface MiddleColumnProps {
  user: any;
  events: Event[];
  loading: boolean;
}

export default function MiddleColumn({ user, events, loading }: MiddleColumnProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [dailyDevPosts, setDailyDevPosts] = useState<DailyDevPost[]>([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [postsError, setPostsError] = useState<string | null>(null);

  // Fetch Daily.dev posts
  const fetchDailyDevPosts = async () => {
    setPostsLoading(true);
    setPostsError(null);
    
    try {
      // Fetch from our API route (server-side)
      const response = await fetch('/api/daily-dev');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setDailyDevPosts(data.posts);
    } catch (error) {
      console.error('Error fetching Daily.dev posts:', error);
      setPostsError('Failed to load tech posts. Please try again later.');
    } finally {
      setPostsLoading(false);
    }
  };

  useEffect(() => {
    fetchDailyDevPosts();
  }, []);

  const openModal = (event: Event, imageIndex: number = 0) => {
    setSelectedEvent(event);
    setSelectedImageIndex(imageIndex);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedEvent(null);
    setSelectedImageIndex(0);
  };
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
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
    } else if (diffInSeconds < 2592000) {
      const weeks = Math.floor(diffInSeconds / 604800);
      return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
    } else if (diffInSeconds < 31536000) {
      const months = Math.floor(diffInSeconds / 2592000);
      return `${months} month${months > 1 ? 's' : ''} ago`;
    } else {
      const years = Math.floor(diffInSeconds / 31536000);
      return `${years} year${years > 1 ? 's' : ''} ago`;
    }
  };

  return (
    <>
      <FloatingNavigation user={user} />
      <div className="w-full lg:col-span-6 h-[calc(100vh-4rem)] overflow-y-auto bg-gray-50 pb-16 lg:pb-0">
      <div className="space-y-4 p-3 sm:p-4">
        {/* Daily.dev Posts */}
        {postsLoading ? (
          <div className="bg-white rounded-lg shadow-md p-4 text-center mb-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#20B2AA] mx-auto"></div>
            <p className="mt-2 text-gray-500">Loading tech posts...</p>
          </div>
        ) : postsError ? (
          <div className="bg-white rounded-lg shadow-md p-4 text-center mb-4">
            <div className="text-red-500 mb-2">
              <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 15.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <p className="text-gray-600 mb-4">{postsError}</p>
            <button 
              onClick={fetchDailyDevPosts}
              className="bg-[#20B2AA] text-white px-4 py-2 rounded-lg hover:bg-[#1a9b9b] transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : (
          dailyDevPosts.map((post) => (
            <div key={post.id} className="bg-white rounded-lg shadow-md overflow-hidden mb-4">
              {/* Post Header */}
              <div className="p-3 border-b border-gray-100">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Daily.dev</h4>
                    <p className="text-sm text-gray-500">{formatDate(post.publishedAt)}</p>
                  </div>
                </div>
              </div>

              {/* Post Content */}
              <div className="p-3">
                <h3 className="font-bold text-lg text-gray-900 mb-2">{post.title}</h3>
                <p className="text-gray-700 mb-4">{post.description}</p>
                
                {/* Post Image */}
                <div className="mb-4">
                  <Image
                    src={post.image}
                    alt={post.title}
                    width={0}
                    height={0}
                    sizes="(max-width: 768px) 100vw, 600px"
                    className="w-full h-auto object-contain rounded-lg"
                    unoptimized
                  />
                </div>

                {/* Post Timestamp */}
                <div className="text-xs text-gray-400 mb-3">
                  {getTimeAgo(post.publishedAt)}
                </div>
              </div>

              {/* Read More Link */}
              <div className="px-3 py-2 border-t border-gray-100">
                <a
                  href={post.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center space-x-2 text-[#20B2AA] hover:text-[#1a9b9b] font-medium py-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                  <span>Read More</span>
                </a>
              </div>
            </div>
          ))
        )}

        {/* Events Feed */}
        {loading ? (
          <div className="bg-white rounded-lg shadow-md p-4 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#20B2AA] mx-auto"></div>
            <p className="mt-2 text-gray-500">Loading events...</p>
          </div>
        ) : (
          events.map((event) => (
            <div key={event.id} className="bg-white rounded-lg shadow-md overflow-hidden">
              {/* Event Header */}
              <div className="p-3 border-b border-gray-100">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-[#20B2AA] rounded-full flex items-center justify-center">
                    <Image
                      src="/codebyterslogo.png"
                      alt="Codebyters"
                      width={24}
                      height={24}
                      className="rounded-full"
                      unoptimized
                    />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Codebyters</h4>
                    <p className="text-sm text-gray-500">{formatDate(event.created_at)}</p>
                  </div>
                </div>
              </div>

              {/* Event Content */}
              <div className="p-3">
                <h3 className="font-bold text-lg text-gray-900 mb-2">{event.title}</h3>
                <p className="text-gray-700 mb-4">{event.description}</p>
                
                {/* Event Pictures */}
                {event.pictures.length > 0 && (
                  <div className="mb-4">
                    {event.pictures.length === 1 && event.pictures[0].picture_url ? (
                      <div 
                        className="relative cursor-pointer hover:opacity-90 transition-opacity"
                        onClick={() => openModal(event, 0)}
                      >
                        <Image
                          src={event.pictures[0].picture_url}
                          alt={event.title}
                          width={0}
                          height={0}
                          sizes="(max-width: 768px) 100vw, 600px"
                          className="w-full h-auto object-contain"
                          unoptimized
                          onLoad={(e) => {
                            const img = e.target as HTMLImageElement;
                            const aspectRatio = img.naturalWidth / img.naturalHeight;
                            
                            // If landscape (aspect ratio > 1), show full width
                            if (aspectRatio > 1) {
                              img.className = "w-full h-auto object-contain";
                            } else {
                              // If portrait, use default sizing
                              img.className = "w-full max-h-96 object-cover";
                            }
                          }}
                        />
                      </div>
                    ) : event.pictures.length === 2 ? (
                      <div className="grid grid-cols-2 gap-0.5">
                        {event.pictures.map((picture, index) => (
                          picture.picture_url && (
                            <div 
                              key={picture.id} 
                              className="relative cursor-pointer hover:opacity-90 transition-opacity overflow-hidden"
                              onClick={() => openModal(event, index)}
                            >
                              <Image
                                src={picture.picture_url}
                                alt={`${event.title} ${index + 1}`}
                                width={0}
                                height={0}
                                sizes="(max-width: 768px) 50vw, 300px"
                                className="w-full h-48 object-cover"
                                unoptimized
                              />
                            </div>
                          )
                        ))}
                      </div>
                    ) : event.pictures.length === 3 ? (
                      <div className="grid grid-cols-2 gap-0.5">
                        {event.pictures[0].picture_url && (
                          <div 
                            className="row-span-2 cursor-pointer hover:opacity-90 transition-opacity overflow-hidden"
                            onClick={() => openModal(event, 0)}
                          >
                            <Image
                              src={event.pictures[0].picture_url}
                              alt={`${event.title} 1`}
                              width={0}
                              height={0}
                              sizes="(max-width: 768px) 50vw, 300px"
                              className="w-full h-full object-cover"
                              unoptimized
                            />
                          </div>
                        )}
                        {event.pictures[1].picture_url && (
                          <div 
                            className="cursor-pointer hover:opacity-90 transition-opacity overflow-hidden"
                            onClick={() => openModal(event, 1)}
                          >
                            <Image
                              src={event.pictures[1].picture_url}
                              alt={`${event.title} 2`}
                              width={0}
                              height={0}
                              sizes="(max-width: 768px) 50vw, 300px"
                              className="w-full h-48 object-cover"
                              unoptimized
                            />
                          </div>
                        )}
                        {event.pictures[2].picture_url && (
                          <div 
                            className="cursor-pointer hover:opacity-90 transition-opacity overflow-hidden"
                            onClick={() => openModal(event, 2)}
                          >
                            <Image
                              src={event.pictures[2].picture_url}
                              alt={`${event.title} 3`}
                              width={0}
                              height={0}
                              sizes="(max-width: 768px) 50vw, 300px"
                              className="w-full h-48 object-cover"
                              unoptimized
                            />
                          </div>
                        )}
                      </div>
                    ) : event.pictures.length === 4 ? (
                      <div className="grid grid-cols-2 gap-0.5">
                        {event.pictures.map((picture, index) => (
                          picture.picture_url && (
                            <div 
                              key={picture.id} 
                              className="relative cursor-pointer hover:opacity-90 transition-opacity overflow-hidden"
                              onClick={() => openModal(event, index)}
                            >
                              <Image
                                src={picture.picture_url}
                                alt={`${event.title} ${index + 1}`}
                                width={0}
                                height={0}
                                sizes="(max-width: 768px) 50vw, 300px"
                                className="w-full h-48 object-cover"
                                unoptimized
                              />
                            </div>
                          )
                        ))}
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-0.5">
                        {event.pictures.slice(0, 4).map((picture, index) => (
                          picture.picture_url && (
                            <div 
                              key={picture.id} 
                              className="relative cursor-pointer hover:opacity-90 transition-opacity overflow-hidden"
                              onClick={() => openModal(event, index)}
                            >
                              <Image
                                src={picture.picture_url}
                                alt={`${event.title} ${index + 1}`}
                                width={0}
                                height={0}
                                sizes="(max-width: 768px) 50vw, 300px"
                                className={`w-full h-48 object-cover ${index === 3 && event.pictures.length > 4 ? 'opacity-50' : ''}`}
                                unoptimized
                              />
                              {index === 3 && event.pictures.length > 4 && (
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                  <span className="text-black font-semibold text-lg drop-shadow-lg">+{event.pictures.length - 4}</span>
                                </div>
                              )}
                            </div>
                          )
                        ))}
                      </div>
                    )}
                  </div>
                )}

             

                {/* Post Timestamp */}
                <div className="text-xs text-gray-400 mb-3">
                  {getTimeAgo(event.created_at)}
                </div>
              </div>

            </div>
          ))
        )}
      </div>

      {/* Image Modal */}
      {selectedEvent && (
        <ImageModal
          isOpen={modalOpen}
          onClose={closeModal}
          pictures={selectedEvent.pictures}
          currentIndex={selectedImageIndex}
          eventTitle={selectedEvent.title}
          eventDescription={selectedEvent.description}
          eventDate={selectedEvent.created_at}
        />
      )}
      </div>
    </>
  );
}
