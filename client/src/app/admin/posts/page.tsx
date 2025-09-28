'use client';

import { useState, useEffect } from 'react';
import AdminDashboardHeader from "@/components/AdminDashboardHeader";
import CloudinaryUpload from "@/components/CloudinaryUpload";
import { supabase } from "@/lib/supabase";
import Image from 'next/image';
import { useGlobalLoading } from '@/contexts/LoadingContext';

interface Post {
  id: number;
  title: string;
  description: string;
  content: string;
  status: 'active' | 'inactive';
  created_at: string;
  pictures: string[];
}

export default function AdminPostsPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newPost, setNewPost] = useState({
    title: '',
    description: '',
    content: '',
    status: 'active' as 'active' | 'inactive',
    pictures: [] as string[]
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [showEditForm, setShowEditForm] = useState(false);
  const { startLoading, stopLoading } = useGlobalLoading();

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select(`
          *,
          post_pictures (picture_url, picture_order)
        `)
        .order('created_at', { ascending: false });

      if (postsError) throw postsError;

      const formattedPosts = postsData.map((post: any) => ({
        ...post,
        pictures: post.post_pictures
          .sort((a: any, b: any) => a.picture_order - b.picture_order)
          .map((pic: any) => pic.picture_url)
      }));

      setPosts(formattedPosts);
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPost.title.trim() || !newPost.description.trim() || !newPost.content.trim()) {
      alert('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    startLoading();

    try {
      // Insert the post
      const { data: postData, error: postError } = await supabase
        .from('posts')
        .insert([{
          title: newPost.title,
          description: newPost.description,
          content: newPost.content,
          status: newPost.status,
          created_by: 1 // Assuming admin user ID is 1
        }])
        .select()
        .single();

      if (postError) throw postError;

      // Insert pictures if any
      if (newPost.pictures.length > 0) {
        const pictureInserts = newPost.pictures.map((url, index) => ({
          post_id: postData.id,
          picture_url: url,
          picture_order: index + 1
        }));

        const { error: picturesError } = await supabase
          .from('post_pictures')
          .insert(pictureInserts);

        if (picturesError) throw picturesError;
      }

      // Reset form and refresh data
      setNewPost({
        title: '',
        description: '',
        content: '',
        status: 'active',
        pictures: []
      });
      setShowAddForm(false);
      await fetchPosts();
    } catch (error) {
      console.error('Error adding post:', error);
      alert('Error adding post. Please try again.');
    } finally {
      setIsSubmitting(false);
      stopLoading();
    }
  };

  const handleEditPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPost) return;

    if (!editingPost.title.trim() || !editingPost.description.trim() || !editingPost.content.trim()) {
      alert('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    startLoading();

    try {
      // Update the post
      const { error: postError } = await supabase
        .from('posts')
        .update({
          title: editingPost.title,
          description: editingPost.description,
          content: editingPost.content,
          status: editingPost.status
        })
        .eq('id', editingPost.id);

      if (postError) throw postError;

      // Delete existing pictures
      const { error: deleteError } = await supabase
        .from('post_pictures')
        .delete()
        .eq('post_id', editingPost.id);

      if (deleteError) throw deleteError;

      // Insert new pictures
      if (editingPost.pictures.length > 0) {
        const pictureInserts = editingPost.pictures.map((url, index) => ({
          post_id: editingPost.id,
          picture_url: url,
          picture_order: index + 1
        }));

        const { error: picturesError } = await supabase
          .from('post_pictures')
          .insert(pictureInserts);

        if (picturesError) throw picturesError;
      }

      // Reset form and refresh data
      setEditingPost(null);
      setShowEditForm(false);
      await fetchPosts();
    } catch (error) {
      console.error('Error updating post:', error);
      alert('Error updating post. Please try again.');
    } finally {
      setIsSubmitting(false);
      stopLoading();
    }
  };

  const handleDeletePost = async (postId: number) => {
    if (!confirm('Are you sure you want to delete this post?')) return;

    startLoading();

    try {
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', postId);

      if (error) throw error;

      await fetchPosts();
    } catch (error) {
      console.error('Error deleting post:', error);
      alert('Error deleting post. Please try again.');
    } finally {
      stopLoading();
    }
  };

  const handleToggleStatus = async (post: Post) => {
    startLoading();

    try {
      const { error } = await supabase
        .from('posts')
        .update({ status: post.status === 'active' ? 'inactive' : 'active' })
        .eq('id', post.id);

      if (error) throw error;

      await fetchPosts();
    } catch (error) {
      console.error('Error updating post status:', error);
      alert('Error updating post status. Please try again.');
    } finally {
      stopLoading();
    }
  };

  const startEdit = (post: Post) => {
    setEditingPost({ ...post });
    setShowEditForm(true);
  };

  const cancelEdit = () => {
    setEditingPost(null);
    setShowEditForm(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AdminDashboardHeader />
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#20B2AA]"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminDashboardHeader />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Posts Management</h1>
            <p className="text-gray-600 mt-2">Manage announcements and general posts</p>
          </div>
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-[#20B2AA] text-white px-6 py-3 rounded-lg hover:bg-[#1a9b94] transition-colors flex items-center space-x-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>Add New Post</span>
          </button>
        </div>

        {/* Add Post Form */}
        {showAddForm && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">Add New Post</h2>
            <form onSubmit={handleAddPost} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  value={newPost.title}
                  onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#20B2AA]"
                  placeholder="Enter post title"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description *
                </label>
                <textarea
                  value={newPost.description}
                  onChange={(e) => setNewPost({ ...newPost, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#20B2AA]"
                  rows={3}
                  placeholder="Enter post description"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Content *
                </label>
                <textarea
                  value={newPost.content}
                  onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#20B2AA]"
                  rows={6}
                  placeholder="Enter post content"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={newPost.status}
                  onChange={(e) => setNewPost({ ...newPost, status: e.target.value as 'active' | 'inactive' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#20B2AA]"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pictures (Optional)
                </label>
                <CloudinaryUpload
                  onUpload={(url) => {
                    if (newPost.pictures.length < 8) {
                      setNewPost({ ...newPost, pictures: [...newPost.pictures, url] });
                    } else {
                      alert('Maximum 8 pictures allowed');
                    }
                  }}
                  onRemove={() => {}}
                />
                {newPost.pictures.length > 0 && (
                  <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-2">
                    {newPost.pictures.map((url, index) => (
                      <div key={index} className="relative">
                        <Image
                          src={url}
                          alt={`Post picture ${index + 1}`}
                          width={100}
                          height={100}
                          className="w-full h-24 object-cover rounded-md"
                        />
                        <button
                          type="button"
                          onClick={() => setNewPost({ ...newPost, pictures: newPost.pictures.filter((_, i) => i !== index) })}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex space-x-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-[#20B2AA] text-white px-6 py-2 rounded-md hover:bg-[#1a9b94] disabled:opacity-50"
                >
                  {isSubmitting ? 'Adding...' : 'Add Post'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="bg-gray-500 text-white px-6 py-2 rounded-md hover:bg-gray-600"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Edit Post Form */}
        {showEditForm && editingPost && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">Edit Post</h2>
            <form onSubmit={handleEditPost} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  value={editingPost.title}
                  onChange={(e) => setEditingPost({ ...editingPost, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#20B2AA]"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description *
                </label>
                <textarea
                  value={editingPost.description}
                  onChange={(e) => setEditingPost({ ...editingPost, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#20B2AA]"
                  rows={3}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Content *
                </label>
                <textarea
                  value={editingPost.content}
                  onChange={(e) => setEditingPost({ ...editingPost, content: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#20B2AA]"
                  rows={6}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={editingPost.status}
                  onChange={(e) => setEditingPost({ ...editingPost, status: e.target.value as 'active' | 'inactive' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#20B2AA]"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pictures (Optional)
                </label>
                <CloudinaryUpload
                  onUpload={(url) => {
                    if (editingPost.pictures.length < 8) {
                      setEditingPost({ ...editingPost, pictures: [...editingPost.pictures, url] });
                    } else {
                      alert('Maximum 8 pictures allowed');
                    }
                  }}
                  onRemove={() => {}}
                />
                {editingPost.pictures.length > 0 && (
                  <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-2">
                    {editingPost.pictures.map((url, index) => (
                      <div key={index} className="relative">
                        <Image
                          src={url}
                          alt={`Post picture ${index + 1}`}
                          width={100}
                          height={100}
                          className="w-full h-24 object-cover rounded-md"
                        />
                        <button
                          type="button"
                          onClick={() => setEditingPost({ ...editingPost, pictures: editingPost.pictures.filter((_, i) => i !== index) })}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex space-x-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-[#20B2AA] text-white px-6 py-2 rounded-md hover:bg-[#1a9b94] disabled:opacity-50"
                >
                  {isSubmitting ? 'Updating...' : 'Update Post'}
                </button>
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="bg-gray-500 text-white px-6 py-2 rounded-md hover:bg-gray-600"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Posts List */}
        <div className="grid gap-6">
          {posts.map((post) => (
            <div key={post.id} className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">{post.title}</h3>
                    <p className="text-gray-600 mb-3">{post.description}</p>
                    <div className="text-sm text-gray-500 mb-4">
                      <p className="whitespace-pre-wrap">{post.content}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 ml-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      post.status === 'active' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {post.status}
                    </span>
                  </div>
                </div>

                {post.pictures.length > 0 && (
                  <div className="mb-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {post.pictures.map((url, index) => (
                        <Image
                          key={index}
                          src={url}
                          alt={`Post picture ${index + 1}`}
                          width={200}
                          height={200}
                          className="w-full h-32 object-cover rounded-md"
                        />
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex justify-between items-center text-sm text-gray-500">
                  <span>Created: {new Date(post.created_at).toLocaleDateString()}</span>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleToggleStatus(post)}
                      className={`px-3 py-1 rounded-md text-sm ${
                        post.status === 'active'
                          ? 'bg-red-100 text-red-700 hover:bg-red-200'
                          : 'bg-green-100 text-green-700 hover:bg-green-200'
                      }`}
                    >
                      {post.status === 'active' ? 'Deactivate' : 'Activate'}
                    </button>
                    <button
                      onClick={() => startEdit(post)}
                      className="px-3 py-1 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 text-sm"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeletePost(post.id)}
                      className="px-3 py-1 bg-red-100 text-red-700 rounded-md hover:bg-red-200 text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {posts.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-500 text-lg">No posts found</div>
            <p className="text-gray-400 mt-2">Create your first post to get started</p>
          </div>
        )}
      </div>
    </div>
  );
}
