'use client';

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

export default function Header() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isActive = (path: string) => {
    return pathname === path;
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Brand */}
          <div className="flex items-center space-x-3">
            {/* <Image
              src="/codebyterslogo.png"
              alt="Codebyters Logo"
              width={40}
              height={40}
            /> */}
            <span className="text-2xl font-bold bg-black bg-clip-text text-transparent" style={{ color: '#20B2AA' }}>
              CODEBYTERS
            </span>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex space-x-8">
            <Link
              href="/"
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive('/')
                  ? 'text-white'
                  : 'text-gray-700 hover:text-[#20B2AA] hover:bg-[#20B2AA]/10'
              }`}
              style={isActive('/') ? { backgroundColor: '#20B2AA' } : {}}
            >
              Home
            </Link>
            <Link
              href="/officers"
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive('/officers')
                  ? 'text-white'
                  : 'text-gray-700 hover:text-[#20B2AA] hover:bg-[#20B2AA]/10'
              }`}
              style={isActive('/officers') ? { backgroundColor: '#20B2AA' } : {}}
            >
              Officers
            </Link>
            <Link
              href="/developers"
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive('/developers')
                  ? 'text-white'
                  : 'text-gray-700 hover:text-[#20B2AA] hover:bg-[#20B2AA]/10'
              }`}
              style={isActive('/developers') ? { backgroundColor: '#20B2AA' } : {}}
            >
              Developers
            </Link>
          </nav>

          {/* Desktop Auth Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            <Link
              href="/login"
              className="text-gray-700 hover:text-[#20B2AA] px-3 py-2 rounded-md text-sm font-medium transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="text-white px-4 py-2 rounded-md text-sm font-medium hover:opacity-90 transition-all duration-200"
              style={{ backgroundColor: '#20B2AA' }}
            >
              Get Started
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              type="button"
              onClick={toggleMobileMenu}
              className="text-gray-700 hover:text-[#20B2AA] focus:outline-none focus:text-[#20B2AA] p-2"
            >
              {isMobileMenuOpen ? (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-gray-50 rounded-lg mt-2">
              <Link
                href="/"
                className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${
                  isActive('/')
                    ? 'text-white'
                    : 'text-gray-700 hover:text-[#20B2AA] hover:bg-[#20B2AA]/10'
                }`}
                style={isActive('/') ? { backgroundColor: '#20B2AA' } : {}}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Home
              </Link>
              <Link
                href="/officers"
                className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${
                  isActive('/officers')
                    ? 'text-white'
                    : 'text-gray-700 hover:text-[#20B2AA] hover:bg-[#20B2AA]/10'
                }`}
                style={isActive('/officers') ? { backgroundColor: '#20B2AA' } : {}}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Officers
              </Link>
              <Link
                href="/developers"
                className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${
                  isActive('/developers')
                    ? 'text-white'
                    : 'text-gray-700 hover:text-[#20B2AA] hover:bg-[#20B2AA]/10'
                }`}
                style={isActive('/developers') ? { backgroundColor: '#20B2AA' } : {}}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Developers
              </Link>
              <div className="border-t border-gray-200 pt-3 mt-3">
                <Link
                  href="/login"
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-[#20B2AA] hover:bg-[#20B2AA]/10 transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="block px-3 py-2 rounded-md text-base font-medium text-white transition-colors"
                  style={{ backgroundColor: '#20B2AA' }}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Get Started
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
