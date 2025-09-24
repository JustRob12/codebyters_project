'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Image from 'next/image';
import CloudinaryUpload from '@/components/CloudinaryUpload';
import AdminDashboardHeader from '@/components/AdminDashboardHeader';
import AddCommitteeMemberModal from '@/components/AddCommitteeMemberModal';
import { useGlobalLoading } from '@/contexts/LoadingContext';

interface Committee {
  id: number;
  title: string;
  description: string;
  picture_url: string | null;
  link: string | null;
  status: 'Apply' | 'Full';
  created_at: string;
  updated_at: string;
}

export default function CommitteesPage() {
  const [committees, setCommittees] = useState<Committee[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [editingCommittee, setEditingCommittee] = useState<Committee | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    picture_url: '',
    link: '',
    status: 'Apply' as 'Apply' | 'Full'
  });

  const { startLoading, stopLoading } = useGlobalLoading();


  useEffect(() => {
    fetchCommittees();
  }, []);

  const fetchCommittees = async () => {
    try {
      const { data, error } = await supabase
        .from('committees')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCommittees(data || []);
    } catch (error) {
      console.error('Error fetching committees:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    startLoading(editingCommittee ? 'Updating committee...' : 'Creating committee...');
    
    try {
      if (editingCommittee) {
        // Update existing committee
        const { error } = await supabase
          .from('committees')
          .update(formData)
          .eq('id', editingCommittee.id);

        if (error) throw error;
      } else {
        // Create new committee
        const { error } = await supabase
          .from('committees')
          .insert([formData]);

        if (error) throw error;
      }

      setShowForm(false);
      setEditingCommittee(null);
      setFormData({
        title: '',
        description: '',
        picture_url: '',
        link: '',
        status: 'Apply'
      });
      fetchCommittees();
    } catch (error) {
      console.error('Error saving committee:', error);
    } finally {
      stopLoading();
    }
  };

  const handleEdit = (committee: Committee) => {
    setEditingCommittee(committee);
    setFormData({
      title: committee.title,
      description: committee.description,
      picture_url: committee.picture_url || '',
      link: committee.link || '',
      status: committee.status
    });
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this committee?')) return;

    startLoading('Deleting committee...');
    
    try {
      const { error } = await supabase
        .from('committees')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchCommittees();
    } catch (error) {
      console.error('Error deleting committee:', error);
    } finally {
      stopLoading();
    }
  };

  const handleImageUpload = (url: string) => {
    setFormData(prev => ({ ...prev, picture_url: url }));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminDashboardHeader />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Committees Management</h1>
              <p className="mt-2 text-gray-600">Manage organization committees and applications</p>
            </div>
            <div className="flex space-x-4">
              <button
                onClick={() => setShowAddMemberModal(true)}
                className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
              >
                Add Member
              </button>
              <button
                onClick={() => {
                  setEditingCommittee(null);
                  setFormData({
                    title: '',
                    description: '',
                    picture_url: '',
                    link: '',
                    status: 'Apply'
                  });
                  setShowForm(true);
                }}
                className="bg-[#20B2AA] text-white px-6 py-3 rounded-lg hover:bg-[#1a9b94] transition-colors"
              >
                Add Committee
              </button>
            </div>
          </div>
        </div>

        {/* Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-gray-500 bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">
                    {editingCommittee ? 'Edit Committee' : 'Add New Committee'}
                  </h2>
                  <button
                    onClick={() => setShowForm(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Committee Title *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.title}
                      onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#20B2AA] text-black"
                      placeholder="Enter committee title"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description *
                    </label>
                    <textarea
                      required
                      rows={4}
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#20B2AA] text-black"
                      placeholder="Enter committee description"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Committee Picture
                    </label>
                    {formData.picture_url ? (
                      <div className="mb-4">
                        <Image
                          src={formData.picture_url}
                          alt="Committee preview"
                          width={200}
                          height={150}
                          className="rounded-lg object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, picture_url: '' }))}
                          className="mt-2 text-red-600 hover:text-red-800 text-sm"
                        >
                          Remove Image
                        </button>
                      </div>
                    ) : (
                      <CloudinaryUpload
                        onUpload={handleImageUpload}
                        onRemove={() => setFormData(prev => ({ ...prev, picture_url: '' }))}
                        currentUrl={formData.picture_url}
                      />
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Application Link
                    </label>
                    <input
                      type="url"
                      value={formData.link}
                      onChange={(e) => setFormData(prev => ({ ...prev, link: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#20B2AA] text-black"
                      placeholder="https://example.com/apply"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Status *
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as 'Apply' | 'Full' }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#20B2AA] text-black"
                    >
                      <option value="Apply">Apply</option>
                      <option value="Full">Full</option>
                    </select>
                  </div>

                  <div className="flex justify-end space-x-4">
                    <button
                      type="button"
                      onClick={() => setShowForm(false)}
                      className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2 bg-[#20B2AA] text-white rounded-lg hover:bg-[#1a9b94] transition-colors"
                    >
                      {editingCommittee ? 'Update Committee' : 'Create Committee'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Committees List */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#20B2AA]"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {committees.map((committee) => (
              <div key={committee.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                {committee.picture_url && (
                  <div className="h-48 relative">
                    <Image
                      src={committee.picture_url}
                      alt={committee.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
                
                <div className="p-6">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-xl font-bold text-gray-900">{committee.title}</h3>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      committee.status === 'Apply' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {committee.status}
                    </span>
                  </div>
                  
                  <p className="text-gray-600 mb-4 line-clamp-3">{committee.description}</p>
                  
                  {committee.link && (
                    <a
                      href={committee.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block bg-[#20B2AA] text-white px-4 py-2 rounded-lg hover:bg-[#1a9b94] transition-colors mb-4"
                    >
                      JOIN COMMITTEE
                    </a>
                  )}
                  
                  <div className="flex justify-between items-center text-sm text-gray-500">
                    <span>Created: {new Date(committee.created_at).toLocaleDateString()}</span>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEdit(committee)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(committee.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && committees.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No committees yet</h3>
            <p className="text-gray-500">Get started by creating your first committee.</p>
          </div>
        )}

        {/* Add Member Modal */}
        <AddCommitteeMemberModal
          isOpen={showAddMemberModal}
          onClose={() => setShowAddMemberModal(false)}
          onMemberAdded={fetchCommittees}
        />
      </div>
    </div>
  );
}
