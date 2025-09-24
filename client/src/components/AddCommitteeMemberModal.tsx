'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useGlobalLoading } from '@/contexts/LoadingContext';

interface Committee {
  id: number;
  title: string;
  status: 'Apply' | 'Full';
}

interface Student {
  id: string;
  student_id: string;
  first_name: string;
  last_name: string;
  email: string;
}

interface AddCommitteeMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMemberAdded: () => void;
}

export default function AddCommitteeMemberModal({ 
  isOpen, 
  onClose, 
  onMemberAdded 
}: AddCommitteeMemberModalProps) {
  const [committees, setCommittees] = useState<Committee[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [selectedCommittee, setSelectedCommittee] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { startLoading, stopLoading } = useGlobalLoading();

  useEffect(() => {
    if (isOpen) {
      fetchCommittees();
      fetchStudents();
    }
  }, [isOpen]);

  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = students.filter(student => 
        student.student_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.last_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.email.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredStudents(filtered);
    } else {
      setFilteredStudents([]);
    }
  }, [searchQuery, students]);

  const fetchCommittees = async () => {
    try {
      const { data, error } = await supabase
        .from('committees')
        .select('id, title, status')
        .order('title');

      if (error) throw error;
      setCommittees(data || []);
    } catch (error) {
      console.error('Error fetching committees:', error);
    }
  };

  const fetchStudents = async () => {
    try {
      // Try to fetch all users first (simplest approach)
      const { data, error } = await supabase
        .from('users')
        .select('id, student_id, first_name, last_name, email')
        .order('first_name');

      if (error) throw error;
      
      // Filter students on the client side if needed
      // This assumes users with student_id are students
      const studentUsers = data?.filter(user => user.student_id) || [];
      setStudents(studentUsers);
    } catch (error) {
      console.error('Error fetching students:', error);
      // Fallback: set empty array
      setStudents([]);
    }
  };

  const handleStudentSelect = (student: Student) => {
    setSelectedStudent(student);
    setSearchQuery(`${student.student_id} - ${student.first_name} ${student.last_name}`);
    setFilteredStudents([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedCommittee || !selectedStudent) {
      setError('Please select both a committee and a student');
      return;
    }

    setLoading(true);
    setError('');
    startLoading('Adding member to committee...');

    try {
      // Check if student is already a member of this committee
      const { data: existingMember, error: checkError } = await supabase
        .from('committee_members')
        .select('id')
        .eq('committee_id', selectedCommittee)
        .eq('student_id', selectedStudent.student_id)
        .eq('status', 'Active')
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError;
      }

      if (existingMember) {
        setError('This student is already a member of the selected committee');
        setLoading(false);
        return;
      }

      // Add student to committee
      const { error: insertError } = await supabase
        .from('committee_members')
        .insert([{
          committee_id: selectedCommittee,
          student_id: selectedStudent.student_id,
          student_name: `${selectedStudent.first_name} ${selectedStudent.last_name}`,
          student_email: selectedStudent.email,
          status: 'Active',
          role: 'Member'
        }]);

      if (insertError) throw insertError;

      // Reset form
      setSelectedCommittee(null);
      setSelectedStudent(null);
      setSearchQuery('');
      setError('');
      
      onMemberAdded();
      onClose();
    } catch (error: any) {
      console.error('Error adding member:', error);
      setError(error.message || 'Failed to add member to committee');
    } finally {
      setLoading(false);
      stopLoading();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Add Committee Member</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Committee Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Committee *
              </label>
              <select
                value={selectedCommittee || ''}
                onChange={(e) => setSelectedCommittee(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#20B2AA] text-black"
                required
              >
                <option value="">Choose a committee...</option>
                {committees.map((committee) => (
                  <option key={committee.id} value={committee.id}>
                    {committee.title} ({committee.status})
                  </option>
                ))}
              </select>
            </div>

            {/* Student Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search Student *
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#20B2AA] text-black"
                  placeholder="Search by student ID, name, or email..."
                  required
                />
                
                {/* Search Results Dropdown */}
                {filteredStudents.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {filteredStudents.map((student) => (
                      <button
                        key={student.id}
                        type="button"
                        onClick={() => handleStudentSelect(student)}
                        className="w-full px-4 py-3 text-left hover:bg-gray-100 border-b border-gray-100 last:border-b-0"
                      >
                        <div className="font-medium text-gray-900">
                          {student.student_id}
                        </div>
                        <div className="text-sm text-gray-600">
                          {student.first_name} {student.last_name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {student.email}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Selected Student Display */}
            {selectedStudent && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">Selected Student:</h4>
                <div className="text-sm text-gray-600">
                  <div><strong>ID:</strong> {selectedStudent.student_id}</div>
                  <div><strong>Name:</strong> {selectedStudent.first_name} {selectedStudent.last_name}</div>
                  <div><strong>Email:</strong> {selectedStudent.email}</div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedStudent(null);
                    setSearchQuery('');
                  }}
                  className="mt-2 text-sm text-red-600 hover:text-red-800"
                >
                  Clear Selection
                </button>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !selectedCommittee || !selectedStudent}
                className="px-6 py-2 bg-[#20B2AA] text-white rounded-lg hover:bg-[#1a9b94] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Adding...' : 'Add Member'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
