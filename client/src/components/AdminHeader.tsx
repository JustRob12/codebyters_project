'use client';

import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

export default function AdminHeader() {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const toggleUserMenu = () => {
    setIsUserMenuOpen(!isUserMenuOpen);
  };

  const closeUserMenu = () => {
    setIsUserMenuOpen(false);
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
          {/* Left side - Logo and Admin Badge */}
          <div className="flex items-center space-x-4">
            {/* Codebyters Logo */}
            <Link href="/admin" className="flex items-center space-x-2">
              <Image
                src="/codebyterslogo.png"
                alt="Codebyters"
                width={40}
                height={40}
                className="rounded-full"
              />
              <div className="flex flex-col">
                <span className="text-xl font-bold" style={{ color: '#20B2AA' }}>
                  Codebyters
                </span>
                <span className="text-xs text-red-600 font-medium">Admin Panel</span>
              </div>
            </Link>
          </div>

          {/* Center - Navigation */}
          <nav className="hidden lg:flex items-center space-x-8">
            <Link
              href="/admin"
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                pathname === '/admin'
                  ? 'text-[#20B2AA] bg-gray-100'
                  : 'text-gray-700 hover:text-[#20B2AA] hover:bg-gray-100'
              }`}
            >
              Dashboard
            </Link>
            <Link
              href="/admin/users"
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                pathname === '/admin/users'
                  ? 'text-[#20B2AA] bg-gray-100'
                  : 'text-gray-700 hover:text-[#20B2AA] hover:bg-gray-100'
              }`}
            >
              Users
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
              href="/admin/settings"
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                pathname === '/admin/settings'
                  ? 'text-[#20B2AA] bg-gray-100'
                  : 'text-gray-700 hover:text-[#20B2AA] hover:bg-gray-100'
              }`}
            >
              Settings
            </Link>
          </nav>

          {/* Right side - User Menu */}
          <div className="flex items-center space-x-4">
            {/* Admin Badge */}
            <div className="hidden sm:flex items-center space-x-2 px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <span>Admin</span>
            </div>

            {/* User Profile Dropdown */}
            <div className="relative">
              <button
                onClick={toggleUserMenu}
                className="flex items-center space-x-2 p-2 rounded-full hover:bg-gray-100 transition-colors"
              >
                <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
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

      {/* Mobile Navigation */}
      <div className="lg:hidden border-t border-gray-200">
        <div className="px-2 pt-2 pb-3 space-y-1">
          <Link
            href="/admin"
            className={`block px-3 py-2 rounded-md text-base font-medium ${
              pathname === '/admin'
                ? 'text-[#20B2AA] bg-gray-100'
                : 'text-gray-700 hover:text-[#20B2AA] hover:bg-gray-100'
            }`}
          >
            Dashboard
          </Link>
          <Link
            href="/admin/users"
            className={`block px-3 py-2 rounded-md text-base font-medium ${
              pathname === '/admin/users'
                ? 'text-[#20B2AA] bg-gray-100'
                : 'text-gray-700 hover:text-[#20B2AA] hover:bg-gray-100'
            }`}
          >
            Users
          </Link>
          <Link
            href="/admin/events"
            className={`block px-3 py-2 rounded-md text-base font-medium ${
              pathname === '/admin/events'
                ? 'text-[#20B2AA] bg-gray-100'
                : 'text-gray-700 hover:text-[#20B2AA] hover:bg-gray-100'
            }`}
          >
            Events
          </Link>
          <Link
            href="/admin/committees"
            className={`block px-3 py-2 rounded-md text-base font-medium ${
              pathname === '/admin/committees'
                ? 'text-[#20B2AA] bg-gray-100'
                : 'text-gray-700 hover:text-[#20B2AA] hover:bg-gray-100'
            }`}
          >
            Committees
          </Link>
          <Link
            href="/admin/settings"
            className={`block px-3 py-2 rounded-md text-base font-medium ${
              pathname === '/admin/settings'
                ? 'text-[#20B2AA] bg-gray-100'
                : 'text-gray-700 hover:text-[#20B2AA] hover:bg-gray-100'
            }`}
          >
            Settings
          </Link>
        </div>
      </div>

      {/* Click outside to close dropdown */}
      {isUserMenuOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={closeUserMenu}
        />
      )}
    </header>
  );
}
