'use client';

import Image from 'next/image';

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

interface MiddleColumnProps {
  user: any;
  events: Event[];
  loading: boolean;
}

export default function MiddleColumn({ user, events, loading }: MiddleColumnProps) {
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
    <div className="lg:col-span-6 h-[calc(100vh-4rem)] overflow-y-auto bg-gray-50">
      <div className="space-y-4 p-4">
        {/* Create Post Card
        <div className="bg-white rounded-lg shadow-md p-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
              {user?.profile_picture ? (
                <Image
                  src={user.profile_picture}
                  alt="Profile"
                  width={40}
                  height={40}
                  className="rounded-full object-cover w-full h-full"
                  style={{ borderRadius: '50%' }}
                  unoptimized
                />
              ) : (
                <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
              )}
            </div>
            <div className="flex-1">
              <input
                type="text"
                placeholder="What's on your mind?"
                className="w-full p-3 bg-gray-100 rounded-full border-0 focus:outline-none focus:ring-2 focus:ring-[#20B2AA]"
              />
            </div>
          </div>
        </div> */}

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
                    {event.pictures.length === 1 ? (
                      <div className="relative max-w-md mx-auto">
                        <Image
                          src={event.pictures[0].picture_url}
                          alt={event.title}
                          width={0}
                          height={0}
                          sizes="(max-width: 768px) 100vw, 400px"
                          className="w-full max-h-96 object-cover rounded-lg"
                          unoptimized
                        />
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-2 max-w-md mx-auto">
                        {event.pictures.slice(0, 4).map((picture, index) => (
                          <div key={picture.id} className="relative">
                            <Image
                              src={picture.picture_url}
                              alt={`${event.title} ${index + 1}`}
                              width={0}
                              height={0}
                              sizes="(max-width: 768px) 50vw, 200px"
                              className="w-full h-32 object-cover rounded-lg"
                              unoptimized
                            />
                            {index === 3 && event.pictures.length > 4 && (
                              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-lg">
                                <span className="text-white font-semibold">+{event.pictures.length - 4}</span>
                              </div>
                            )}
                          </div>
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

              {/* Event Actions */}
              <div className="px-3 py-2 border-t border-gray-100">
                <div className="flex space-x-4">
                  <button className="flex items-center space-x-2 text-gray-500 hover:text-[#20B2AA]">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                    <span>Like</span>
                  </button>
                  <button className="flex items-center space-x-2 text-gray-500 hover:text-[#20B2AA]">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    <span>Comment</span>
                  </button>
                  <button className="flex items-center space-x-2 text-gray-500 hover:text-[#20B2AA]">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                    </svg>
                    <span>Share</span>
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
