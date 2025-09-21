'use client';

import Image from 'next/image';

interface LeftColumnProps {
  user: any;
}

export default function LeftColumn({ user }: LeftColumnProps) {
  return (
    <div className="lg:col-span-3 h-[calc(100vh-4rem)] overflow-hidden bg-white">
      <div className="p-3 mb-4">
        <div className="text-center">
          <div className="w-20 h-20 mx-auto mb-4 bg-gray-200 rounded-full flex items-center justify-center">
            {user?.profile_picture ? (
              <Image
                src={user.profile_picture}
                alt="Profile"
                width={80}
                height={80}
                className="rounded-full object-cover w-full h-full"
                style={{ borderRadius: '50%' }}
                unoptimized
              />
            ) : (
              <svg className="w-10 h-10 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
              </svg>
            )}
          </div>
          <h3 className="font-semibold text-gray-900">
            {user ? `${user.first_name} ${user.last_name}` : 'Loading...'}
          </h3>
          <p className="text-sm text-gray-500">Student</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="p-3">
        <h4 className="font-semibold text-black mb-3">Quick Actions</h4>
        <div className="space-y-2">
          {/* <button className="w-full text-left p-2 hover:bg-gray-50 rounded-lg flex items-center">
            <svg className="w-5 h-5 mr-3 text-[#20B2AA]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Create Post
          </button> */}
          <button className="w-full text-left p-2 hover:bg-gray-50 rounded-lg flex items-center text-black">
            <svg className="w-5 h-5 mr-3 text-[#20B2AA]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            View Events
          </button>
          <button className="w-full text-left p-2 hover:bg-gray-50 rounded-lg flex items-center text-black">
            <svg className="w-5 h-5 mr-3 text-[#20B2AA]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            Committees
          </button>
        </div>
      </div>
    </div>
  );
}
