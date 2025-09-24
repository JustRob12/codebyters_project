'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import StudentHeader from '@/components/StudentHeader';
import CommitteesDisplay from '@/components/CommitteesDisplay';

export default function CommitteesPage() {
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    checkAuthentication();
  }, []);

  const checkAuthentication = async () => {
    try {
      const userData = localStorage.getItem('user');
      if (!userData) {
        router.push('/login');
        return;
      }
      
      const user = JSON.parse(userData);
      if (!user.student_id) {
        router.push('/login');
        return;
      }
    } catch (error) {
      console.error('Error checking authentication:', error);
      router.push('/login');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100">
        <StudentHeader />
        <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#20B2AA] mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading committees...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <StudentHeader />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <CommitteesDisplay />
      </div>
    </div>
  );
}
