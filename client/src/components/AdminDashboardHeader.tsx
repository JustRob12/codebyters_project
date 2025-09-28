'use client';

import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

export default function AdminDashboardHeader() {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const toggleUserMenu = () => {
    setIsUserMenuOpen(!isUserMenuOpen);
  };

  const closeUserMenu = () => {
    setIsUserMenuOpen(false);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const handleLogout = () => {
    // Clear any stored user data
    localStorage.removeItem('user');
    sessionStorage.clear();
    
    // Close the dropdown
    closeUserMenu();
    
    // Redirect to login page
    router.push('/login');
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left side - Logo and Mobile Menu Button */}
          <div className="flex items-center space-x-4">
            {/* Mobile Menu Button */}
            <button
              onClick={toggleMobileMenu}
              className="md:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-[#20B2AA]"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            
            {/* Logo */}
            <Link href="/admin" className="flex items-center">
              <Image
                src="/codebyterslogo.png"
                alt="Logo"
                width={40}
                height={40}
                className="rounded-full"
              />
            </Link>
          </div>

          {/* Center - Search Bar (Hidden on mobile) */}
          <div className="hidden md:flex flex-1 max-w-lg mx-4">
            <div className="relative w-full">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search students and events..."
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-[#20B2AA] focus:border-[#20B2AA] text-sm"
              />
            </div>
          </div>

          {/* Right side - Navigation and User Menu */}
          <div className="flex items-center space-x-4">
            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center space-x-6">
              <Link
                href="/admin"
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  pathname === '/admin'
                    ? 'text-[#20B2AA] bg-gray-100'
                    : 'text-gray-700 hover:text-[#20B2AA] hover:bg-gray-100'
                }`}
              >
                Home
              </Link>
              <Link
                href="/admin/events"
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  pathname === '/admin/events'
                    ? 'text-[#20B2AA] bg-gray-100'
                    : 'text-gray-700 hover:text-[#20B2AA] hover:bg-gray-100'
                }`}
              >
                Events
              </Link>
              <Link
                href="/admin/posts"
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  pathname === '/admin/posts'
                    ? 'text-[#20B2AA] bg-gray-100'
                    : 'text-gray-700 hover:text-[#20B2AA] hover:bg-gray-100'
                }`}
              >
                Posts
              </Link>
              <Link
                href="/admin/committees"
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  pathname === '/admin/committees'
                    ? 'text-[#20B2AA] bg-gray-100'
                    : 'text-gray-700 hover:text-[#20B2AA] hover:bg-gray-100'
                }`}
              >
                Committees
              </Link>
              <Link
                href="/admin/attendance-scanner"
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  pathname === '/admin/attendance-scanner'
                    ? 'text-[#20B2AA] bg-gray-100'
                    : 'text-gray-700 hover:text-[#20B2AA] hover:bg-gray-100'
                }`}
              >
                Attendance Scanner
              </Link>
            </nav>

            {/* User Profile Dropdown */}
            <div className="relative">
              <button
                onClick={toggleUserMenu}
                className="flex items-center space-x-2 p-2 rounded-full hover:bg-gray-100 transition-colors"
              >
                <div className="w-8 h-8 bg-[#20B2AA] rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-sm font-medium text-gray-900">Admin</p>
                  <p className="text-xs text-gray-500">Administrator</p>
                </div>
                <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Dropdown Menu */}
              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200">
                  <Link
                    href="/admin/profile"
                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={closeUserMenu}
                  >
                    <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Profile
                  </Link>
                  <Link
                    href="/admin/settings"
                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={closeUserMenu}
                  >
                    <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Settings
                  </Link>
                  <hr className="my-1" />
                  <button
                    onClick={handleLogout}
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Navigation - Horizontal Icon Bar */}
      <div className="md:hidden border-t border-gray-200 bg-white">
        <div className="flex items-center justify-around px-2 py-3">
          <Link
            href="/admin"
            className={`flex flex-col items-center p-2 rounded-lg transition-all ${
              pathname === '/admin'
                ? 'text-[#20B2AA] bg-[#20B2AA]/10'
                : 'text-gray-600 hover:text-[#20B2AA] hover:bg-gray-100'
            }`}
            onClick={closeMobileMenu}
          >
            <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span className="text-xs font-medium">Home</span>
          </Link>
          
          <Link
            href="/admin/events"
            className={`flex flex-col items-center p-2 rounded-lg transition-all ${
              pathname === '/admin/events'
                ? 'text-[#20B2AA] bg-[#20B2AA]/10'
                : 'text-gray-600 hover:text-[#20B2AA] hover:bg-gray-100'
            }`}
            onClick={closeMobileMenu}
          >
            <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-xs font-medium">Events</span>
          </Link>
          
          <Link
            href="/admin/posts"
            className={`flex flex-col items-center p-2 rounded-lg transition-all ${
              pathname === '/admin/posts'
                ? 'text-[#20B2AA] bg-[#20B2AA]/10'
                : 'text-gray-600 hover:text-[#20B2AA] hover:bg-gray-100'
            }`}
            onClick={closeMobileMenu}
          >
            <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span className="text-xs font-medium">Posts</span>
          </Link>
          
          <Link
            href="/admin/committees"
            className={`flex flex-col items-center p-2 rounded-lg transition-all ${
              pathname === '/admin/committees'
                ? 'text-[#20B2AA] bg-[#20B2AA]/10'
                : 'text-gray-600 hover:text-[#20B2AA] hover:bg-gray-100'
            }`}
            onClick={closeMobileMenu}
          >
            <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <span className="text-xs font-medium">Committees</span>
          </Link>
          
          <Link
            href="/admin/attendance-scanner"
            className={`flex flex-col items-center p-2 rounded-lg transition-all ${
              pathname === '/admin/attendance-scanner'
                ? 'text-[#20B2AA] bg-[#20B2AA]/10'
                : 'text-gray-600 hover:text-[#20B2AA] hover:bg-gray-100'
            }`}
            onClick={closeMobileMenu}
          >
            <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-xs font-medium">Scanner</span>
          </Link>
        </div>
      </div>

      {/* Click outside to close dropdowns */}
      {(isUserMenuOpen || isMobileMenuOpen) && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => {
            closeUserMenu();
            closeMobileMenu();
          }}
        />
      )}
    </header>
  );
}

