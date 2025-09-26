'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

interface FloatingNavigationProps {
  user: any;
}

export default function FloatingNavigation({ user }: FloatingNavigationProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeItem, setActiveItem] = useState('');

  const navigationItems = [
    {
      id: 'Officers',
      label: 'Officers',
      href: '/officers',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      )
    },
    {
      id: 'Developers',
      label: 'Developers',
      href: '/developers',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
        </svg>
      )
    },
    {
      id: 'Instructors',
      label: 'Instructors',
      href: '/instructors',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      )
    },
    {
      id: 'Merch',
      label: 'Merch',
      href: '/merch',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
        </svg>
      )
    },
    {
      id: 'Membership Fee',
      label: 'Membership Fee',
      href: '/membership-fee',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
        </svg>
      )
    }
  ];

  return (
    <>
      {/* Mobile Floating Burger Button */}
      <div className="lg:hidden fixed bottom-6 right-6 z-50">
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="bg-[#20B2AA] hover:bg-[#1a9b9b] text-white p-4 rounded-full shadow-lg transition-all duration-300 hover:scale-105"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {isMobileMenuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile Floating Navigation Menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-40" onClick={() => setIsMobileMenuOpen(false)}>
          <div className="absolute bottom-20 right-6 bg-white rounded-2xl shadow-2xl p-6 w-80 max-w-[calc(100vw-3rem)]">
            {/* User Profile Section */}
            <div className="mb-6">
              <Link href="/profile" className="block hover:bg-gray-50 rounded-lg p-3 transition-colors" onClick={() => setIsMobileMenuOpen(false)}>
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                    {user?.profile_picture ? (
                      <Image
                        src={user.profile_picture}
                        alt="Profile"
                        width={48}
                        height={48}
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
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">
                      {user ? `${user.first_name} ${user.last_name}` : 'Loading...'}
                    </h3>
                    <p className="text-sm text-gray-500">Student</p>
                  </div>
                </div>
              </Link>
            </div>

            {/* Navigation Menu */}
            <nav className="space-y-2">
              {navigationItems.map((item) => {
                const isActive = activeItem === item.id;
                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    onClick={() => {
                      setActiveItem(item.id);
                      setIsMobileMenuOpen(false);
                    }}
                    className={`flex items-center space-x-3 px-3 py-3 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-[#20B2AA]/10 text-[#20B2AA]'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <div className={`${isActive ? 'text-[#20B2AA]' : 'text-gray-500'}`}>
                      {item.icon}
                    </div>
                    <span className="font-medium">{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Separator */}
            <div className="my-4 border-t border-gray-200"></div>

            {/* Report a Problem */}
            <Link
              href="/report"
              onClick={() => {
                setActiveItem('Report a Problem');
                setIsMobileMenuOpen(false);
              }}
              className={`flex items-center space-x-3 px-3 py-3 rounded-lg transition-colors ${
                activeItem === 'Report a Problem'
                  ? 'bg-[#20B2AA]/10 text-[#20B2AA]'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <div className={`${activeItem === 'Report a Problem' ? 'text-[#20B2AA]' : 'text-gray-500'}`}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <span className="font-medium">Report a Problem</span>
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
