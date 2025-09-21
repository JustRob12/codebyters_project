'use client';

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import { supabase } from "@/lib/supabase";
import bcrypt from "bcryptjs";

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // Get user from database
      const { data: userData, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('email', formData.email)
        .eq('is_active', true)
        .single();

      if (fetchError || !userData) {
        throw new Error('Invalid email or password');
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(formData.password, userData.password);
      if (!isPasswordValid) {
        throw new Error('Invalid email or password');
      }

      // Store user data in localStorage
      localStorage.setItem('user', JSON.stringify(userData));

      // Check user role
      if (userData.role === 0) {
        // Admin - redirect to admin dashboard
        router.push('/admin');
      } else if (userData.role === 1) {
        // Instructor - redirect to instructor dashboard (placeholder)
        router.push('/instructor');
      } else if (userData.role === 2) {
        // Student - redirect to student dashboard
        router.push('/dashboard');
      } else {
        // Unknown role - redirect to dashboard
        router.push('/dashboard');
      }

    } catch (err: any) {
      setError(err.message || 'Login failed. Please try again.');
      console.error('Login error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <div className="flex flex-col lg:flex-row min-h-[calc(100vh-4rem)]">
      {/* Left side with logo */}
      <div className="hidden lg:flex lg:w-1/2 bg-white items-center justify-center min-h-[calc(100vh-4rem)]">
        <div className="text-center">
          <Image
            src="/codebyterslogo.png"
            alt="Codebyters Logo"
            width={350}
            height={350}
            className="mx-auto mb-10"
          />
         
          
        </div>
      </div>

      {/* Right side with login form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-6 lg:p-8 lg:pl-16">
        <div className="w-full max-w-md mx-auto">
          <div className="text-center mb-8 lg:hidden">
            <Image
              src="/codebyterslogo.png"
              alt="Codebyters Logo"
              width={120}
              height={120}
              className="mx-auto mb-4"
            />
            <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-600 to-green-600 bg-clip-text text-transparent">
              Codebyters
            </h1>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Welcome back</h2>
            <p className="text-gray-600 mb-6 sm:mb-8">Sign in to your account</p>

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                <p className="font-medium">Login failed</p>
                <p className="text-sm">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email address
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#20B2AA] focus:border-transparent transition-colors text-black"
                  placeholder="Enter your email"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#20B2AA] focus:border-transparent transition-colors text-black"
                  placeholder="Enter your password"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    className="h-4 w-4 text-cyan-600 focus:ring-cyan-500 border-gray-300 rounded"
                  />
                  <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                    Remember me
                  </label>
                </div>
                <Link href="/forgot-password" className="text-sm hover:opacity-80" style={{ color: '#20B2AA' }}>
                  Forgot password?
                </Link>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className={`w-full text-white py-2 sm:py-3 px-4 rounded-lg font-medium focus:outline-none focus:ring-2 focus:ring-[#20B2AA] focus:ring-offset-2 transition-all duration-200 text-sm sm:text-base ${
                  isLoading 
                    ? 'opacity-50 cursor-not-allowed' 
                    : 'hover:opacity-90'
                }`}
                style={{ backgroundColor: '#20B2AA' }}
              >
                {isLoading ? 'Signing in...' : 'Sign in'}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-gray-600">
                Don't have an account?{' '}
                <Link href="/register" className="hover:opacity-80 font-medium" style={{ color: '#20B2AA' }}>
                  Sign up
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}
