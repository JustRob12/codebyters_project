'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Image from 'next/image';

interface Committee {
  id: number;
  title: string;
  description: string;
  picture_url: string | null;
  link: string | null;
  status: 'Apply' | 'Full';
  created_at: string;
}

interface CommitteesDisplayProps {
  limit?: number;
}

export default function CommitteesDisplay({ limit }: CommitteesDisplayProps) {
  const [committees, setCommittees] = useState<Committee[]>([]);
  const [userCommittees, setUserCommittees] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const userData = localStorage.getItem('user');
      if (userData) {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        await fetchUserCommittees(parsedUser.student_id);
      }
      await fetchCommittees();
    } catch (error) {
      console.error('Error checking user:', error);
    }
  };

  const fetchUserCommittees = async (studentId: string) => {
    try {
      const { data, error } = await supabase
        .from('committee_members')
        .select('committee_id')
        .eq('student_id', studentId)
        .eq('status', 'Active');

      if (error) throw error;
      setUserCommittees(data?.map(item => item.committee_id) || []);
    } catch (error) {
      console.error('Error fetching user committees:', error);
    }
  };

  const fetchCommittees = async () => {
    try {
      let query = supabase
        .from('committees')
        .select('*')
        .order('created_at', { ascending: false });

      if (limit) {
        query = query.limit(limit);
      }

      const { data, error } = await query;

      if (error) throw error;
      setCommittees(data || []);
    } catch (error) {
      console.error('Error fetching committees:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#20B2AA]"></div>
      </div>
    );
  }

  if (committees.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 mb-4">
          <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No committees available</h3>
        <p className="text-gray-500">Check back later for new committee opportunities.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Join Our Committees</h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Be part of our organization by joining one of our committees. 
          Contribute to meaningful projects and connect with like-minded individuals.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {committees.map((committee) => {
          const isUserMember = userCommittees.includes(committee.id);
          
          return (
            <div key={committee.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
              {committee.picture_url && (
                <div className="h-48 relative">
                  <Image
                    src={committee.picture_url}
                    alt={committee.title}
                    fill
                    className="object-cover"
                  />
                  <div className="absolute top-4 right-4">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      isUserMember
                        ? 'bg-[#20B2AA] text-white'
                        : committee.status === 'Apply' 
                        ? 'bg-green-500 text-white' 
                        : 'bg-red-500 text-white'
                    }`}>
                      {isUserMember ? 'Member' : committee.status}
                    </span>
                  </div>
                </div>
              )}
              
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-3">{committee.title}</h3>
                
                <p className="text-gray-600 mb-4 line-clamp-4">{committee.description}</p>
                
                {isUserMember ? (
                  <div className="w-full bg-[#20B2AA]/10 text-[#20B2AA] border border-[#20B2AA] px-6 py-3 rounded-lg text-center font-medium">
                    ✓ You are a member of this Committee
                  </div>
                ) : committee.link && committee.status === 'Apply' ? (
                  <a
                    href={committee.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block w-full bg-[#20B2AA] text-white px-6 py-3 rounded-lg hover:bg-[#1a9b94] transition-colors text-center font-medium"
                  >
                    JOIN COMMITTEE
                  </a>
                ) : committee.status === 'Full' ? (
                  <div className="w-full bg-gray-200 text-gray-500 px-6 py-3 rounded-lg text-center font-medium">
                    Committee Full
                  </div>
                ) : !committee.link && committee.status === 'Apply' ? (
                  <div className="w-full bg-yellow-100 text-yellow-800 px-6 py-3 rounded-lg text-center font-medium">
                    Application Link Coming Soon
                  </div>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
