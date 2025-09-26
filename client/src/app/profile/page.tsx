'use client';

import StudentHeader from '@/components/StudentHeader';
import ImageCropModal from '@/components/ImageCropModal';
import SocialMediaSection from '@/components/SocialMediaSection';
import Image from 'next/image';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useGlobalLoading } from '@/contexts/LoadingContext';
import AuthGuard from '@/components/AuthGuard';

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [coverPhoto, setCoverPhoto] = useState<string>('');
  const [showCropModal, setShowCropModal] = useState(false);
  const [cropImageSrc, setCropImageSrc] = useState<string>('');
  const [cropType, setCropType] = useState<'profile' | 'cover'>('profile');
  const [activeTab, setActiveTab] = useState<'about' | 'committees' | 'social'>('about');
  const [userCommittees, setUserCommittees] = useState<any[]>([]);
  const [socialMediaLinks, setSocialMediaLinks] = useState<any[]>([]);
  const router = useRouter();
  const profileInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const { startLoading, stopLoading, setLoadingMessage } = useGlobalLoading();

  useEffect(() => {
    fetchUserData();
  }, []);

  useEffect(() => {
    if (user) {
      fetchUserCommittees();
      fetchSocialMediaLinks();
    }
  }, [user]);

  const fetchUserData = async () => {
    try {
      const userData = localStorage.getItem('user');
      if (userData) {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        setCoverPhoto(parsedUser.cover_photo || '');
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserCommittees = async () => {
    try {
      const { data, error } = await supabase
        .from('committee_members')
        .select(`
          *,
          committees (
            id,
            title,
            description,
            picture_url,
            status
          )
        `)
        .eq('student_id', user.student_id)
        .eq('status', 'Active');

      if (error) throw error;
      setUserCommittees(data || []);
    } catch (error) {
      console.error('Error fetching user committees:', error);
    }
  };

  const fetchSocialMediaLinks = async () => {
    try {
      const { data, error } = await supabase
        .from('social_media_links')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;
      setSocialMediaLinks(data || []);
    } catch (error) {
      console.error('Error fetching social media links:', error);
    }
  };

  const handleImageUpload = async (file: File, type: 'profile' | 'cover') => {
    if (!file) return;

    setIsUploading(true);
    startLoading(`Uploading ${type === 'profile' ? 'profile picture' : 'cover photo'}...`);
    try {
      console.log('Starting image upload...', { file: file.name, type, size: file.size });
      
      // Upload to Cloudinary using API route instead of direct upload
      const uploadFormData = new FormData();
      uploadFormData.append('file', file);
      
      console.log('Uploading via API route...');
      const response = await fetch('/api/upload-simple', {
        method: 'POST',
        body: uploadFormData
      });

      console.log('API response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API error response:', errorText);
        throw new Error(`Upload failed (${response.status}): ${errorText}`);
      }

      const data = await response.json();
      console.log('Upload successful:', data);
      
      if (!data.url) {
        console.error('No URL in response:', data);
        throw new Error('No URL returned from upload');
      }
      
      const imageUrl = data.url;

      // Update user data
      const updatedUser = {
        ...user,
        [type === 'profile' ? 'profile_picture' : 'cover_photo']: imageUrl
      };

      // Update in Supabase
      console.log('Updating user in Supabase...', { userId: user.id, imageUrl, type });
      const { error } = await supabase
        .from('users')
        .update({
          [type === 'profile' ? 'profile_picture' : 'cover_photo']: imageUrl
        })
        .eq('id', user.id);

      if (error) {
        console.error('Supabase update error:', error);
        throw new Error(`Database update failed: ${error.message}`);
      }
      
      console.log('Supabase update successful');

      // Update localStorage
      console.log('Updating localStorage and state...');
      try {
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setUser(updatedUser);

        if (type === 'cover') {
          setCoverPhoto(imageUrl);
        }
        console.log('State update successful');
      } catch (stateError) {
        console.error('State update error:', stateError);
        throw new Error(`State update failed: ${stateError instanceof Error ? stateError.message : 'Unknown error'}`);
      }

    } catch (error) {
      console.error('Upload error:', error);
      console.error('Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        error: error
      });
      alert(`Failed to upload image: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`);
    } finally {
      setIsUploading(false);
      stopLoading();
    }
  };

  const handleProfilePictureClick = () => {
    profileInputRef.current?.click();
  };

  const handleCoverPhotoClick = () => {
    console.log('Cover photo clicked');
    coverInputRef.current?.click();
  };

  const handleProfilePictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setCropImageSrc(reader.result as string);
        setCropType('profile');
        setShowCropModal(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCoverPhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    console.log('Cover photo file selected:', file);
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        console.log('File reader loaded, opening crop modal');
        setCropImageSrc(reader.result as string);
        setCropType('cover');
        setShowCropModal(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCropComplete = async (croppedImageUrl: string) => {
    try {
      console.log('handleCropComplete called with:', { croppedImageUrl, cropType });
      
      // Convert blob URL to file
      const response = await fetch(croppedImageUrl);
      const blob = await response.blob();
      const file = new File([blob], 'cropped-image.jpg', { type: 'image/jpeg' });
      
      console.log('Created file from blob:', { file: file.name, size: file.size, type: file.type });
      
      // Upload the cropped image
      console.log('Calling handleImageUpload with cropType:', cropType);
      await handleImageUpload(file, cropType);
    } catch (error) {
      console.error('Error processing cropped image:', error);
      console.error('Crop complete error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        error: error
      });
      alert('Failed to process cropped image. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100">
        <StudentHeader />
        <div className="pt-16 flex items-center justify-center min-h-[calc(100vh-4rem)]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#20B2AA]"></div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100">
        <StudentHeader />
        <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#20B2AA] mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading profile...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <AuthGuard requireAuth={true} allowedRoles={[2]}>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <StudentHeader />
      
      <div className="pt-4 sm:pt-8">
        <div className="max-w-6xl mx-auto px-3 sm:px-4 py-4 sm:py-8">
          {/* Back Button */}
          {/* <div className="mb-8">
            <Link
              href="/dashboard"
              className="inline-flex items-center text-[#20B2AA] hover:text-[#1a9b9b] transition-colors group"
            >
              <svg className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Dashboard
            </Link>
          </div> */}

          {/* Profile Header */}
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
            {/* Cover Photo */}
            <div 
              className="w-full bg-gradient-to-r from-[#20B2AA] via-[#1a9b9b] to-[#20B2AA] relative cursor-pointer group h-48 sm:h-64 md:h-80 lg:h-96"
              onClick={handleCoverPhotoClick}
              style={{
                backgroundImage: coverPhoto ? `url(${coverPhoto})` : '',
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
                <div className="bg-white/90 backdrop-blur-sm text-gray-800 px-6 py-3 rounded-full shadow-lg">
                  {isUploading ? (
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-[#20B2AA] border-t-transparent"></div>
                      <span>Uploading...</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span>Change Cover Photo</span>
                    </div>
                  )}
                </div>
              </div>
              <input
                type="file"
                ref={coverInputRef}
                onChange={handleCoverPhotoChange}
                accept="image/*"
                className="hidden"
              />
            </div>

            {/* Profile Info */}
            <div className="px-4 sm:px-6 lg:px-8 pb-8">
              <div className="flex flex-col lg:flex-row items-start lg:items-end -mt-16 sm:-mt-20 relative">
                {/* Profile Picture */}
                <div className="relative z-10">
                  <div 
                    className="w-24 h-24 sm:w-32 sm:h-32 lg:w-40 lg:h-40 bg-white rounded-full border-4 border-white shadow-2xl flex items-center justify-center cursor-pointer group hover:scale-105 transition-all duration-300"
                    onClick={handleProfilePictureClick}
                  >
                    {user.profile_picture ? (
                      <Image
                        src={user.profile_picture}
                        alt={`${user.first_name} ${user.last_name}`}
                        width={152}
                        height={152}
                        className="rounded-full object-cover w-full h-full"
                        style={{ borderRadius: '50%' }}
                        unoptimized
                      />
                    ) : (
                      <svg className="w-12 h-12 sm:w-16 sm:h-16 lg:w-20 lg:h-20 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                      </svg>
                    )}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 rounded-full flex items-center justify-center transition-all duration-300">
                      <svg className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                  </div>
                  <input
                    type="file"
                    ref={profileInputRef}
                    onChange={handleProfilePictureChange}
                    accept="image/*"
                    className="hidden"
                  />
                </div>

                {/* Profile Details */}
                <div className="mt-4 sm:mt-5 lg:mt-0 lg:ml-8 flex-1 w-full">
                  <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">
                    {user.first_name} {user.last_name}
                  </h1>
                  <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 mb-4">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-[#20B2AA]/10 text-[#20B2AA] w-fit">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      Student
                    </span>
                    <span className="text-sm text-gray-500">
                      Member since {new Date(user.created_at).toLocaleDateString('en-US', {
                        month: 'long',
                        year: 'numeric'
                      })}
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="mt-4 sm:mt-6 lg:mt-0 flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 w-full sm:w-auto">
                  <button className="bg-[#20B2AA] text-white px-4 sm:px-6 py-2 sm:py-3 rounded-xl hover:bg-[#1a9b9b] transition-colors shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 text-sm sm:text-base">
                    <div className="flex items-center justify-center space-x-2">
                      <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      <span>Edit Profile</span>
                    </div>
                  </button>
                  <Link href="/codex" className="border-2 border-gray-200 text-gray-700 px-4 sm:px-6 py-2 sm:py-3 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 text-sm sm:text-base inline-block">
                    <div className="flex items-center justify-center space-x-2">
                      <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                      <span>My Codex</span>
                    </div>
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 mt-6">
            <div className="flex border-b border-gray-200">
              <button
                onClick={() => setActiveTab('about')}
                className={`flex-1 px-6 py-4 text-center font-medium transition-colors ${
                  activeTab === 'about'
                    ? 'text-[#20B2AA] border-b-2 border-[#20B2AA] bg-[#20B2AA]/5'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-center space-x-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span>About</span>
                </div>
              </button>
              <button
                onClick={() => setActiveTab('committees')}
                className={`flex-1 px-6 py-4 text-center font-medium transition-colors ${
                  activeTab === 'committees'
                    ? 'text-[#20B2AA] border-b-2 border-[#20B2AA] bg-[#20B2AA]/5'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-center space-x-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <span>Committees</span>
                </div>
              </button>
              <button
                onClick={() => setActiveTab('social')}
                className={`flex-1 px-6 py-4 text-center font-medium transition-colors ${
                  activeTab === 'social'
                    ? 'text-[#20B2AA] border-b-2 border-[#20B2AA] bg-[#20B2AA]/5'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-center space-x-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                  <span>Social Media</span>
                </div>
              </button>
            </div>
          </div>

          {/* Tab Content */}
          <div className="mt-6">
            {activeTab === 'about' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
                {/* Left Column - About */}
                <div className="lg:col-span-2 space-y-6 sm:space-y-8">
                  {/* About Section */}
                  <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 lg:p-8 border border-gray-100">
                    <div className="flex items-center mb-4 sm:mb-6">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-[#20B2AA] rounded-xl flex items-center justify-center mr-3 sm:mr-4">
                        <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <h2 className="text-xl sm:text-2xl font-bold text-gray-900">About</h2>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                      <div className="space-y-1">
                        <label className="text-xs sm:text-sm font-semibold text-gray-500 uppercase tracking-wide">Full Name</label>
                        <p className="text-base sm:text-lg text-gray-900 font-medium break-words">{user.first_name} {user.middle_initial} {user.last_name}</p>
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs sm:text-sm font-semibold text-gray-500 uppercase tracking-wide">Student ID</label>
                        <p className="text-base sm:text-lg text-gray-900 font-medium break-words">{user.student_id}</p>
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs sm:text-sm font-semibold text-gray-500 uppercase tracking-wide">Year Level</label>
                        <p className="text-base sm:text-lg text-gray-900 font-medium">{user.year}</p>
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs sm:text-sm font-semibold text-gray-500 uppercase tracking-wide">Email</label>
                        <p className="text-base sm:text-lg text-gray-900 font-medium break-words">{user.email}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column - Quick Info */}
                <div className="space-y-6 sm:space-y-8">
                  {/* Quick Stats */}
                  <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 lg:p-8 border border-gray-100">
                    <div className="flex items-center mb-4 sm:mb-6">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-500 rounded-xl flex items-center justify-center mr-3 sm:mr-4">
                        <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                      </div>
                      <h3 className="text-lg sm:text-xl font-bold text-gray-900">Quick Stats</h3>
                    </div>
                    <div className="space-y-3 sm:space-y-4">
                      <div className="flex justify-between items-center py-2 sm:py-3 border-b border-gray-100">
                        <span className="text-sm sm:text-base text-gray-600 font-medium">Events Attended</span>
                        <span className="font-bold text-xl sm:text-2xl text-[#20B2AA]">0</span>
                      </div>
                      <div className="flex justify-between items-center py-2 sm:py-3 border-b border-gray-100">
                        <span className="text-sm sm:text-base text-gray-600 font-medium">Committees</span>
                        <span className="font-bold text-xl sm:text-2xl text-[#20B2AA]">{userCommittees.length}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'committees' && (
              <div className="bg-white rounded-2xl shadow-lg p-6 lg:p-8 border border-gray-100">
                <div className="flex items-center mb-6">
                  <div className="w-10 h-10 bg-[#20B2AA] rounded-xl flex items-center justify-center mr-4">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">My Committees</h2>
                </div>
                
                {userCommittees.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {userCommittees.map((membership) => (
                      <div key={membership.id} className="bg-gray-50 rounded-xl p-6 border border-gray-200 hover:shadow-md transition-shadow">
                        {membership.committees.picture_url && (
                          <div className="mb-4">
                            <Image
                              src={membership.committees.picture_url}
                              alt={membership.committees.title}
                              width={300}
                              height={200}
                              className="w-full h-32 object-cover rounded-lg"
                            />
                          </div>
                        )}
                        <h3 className="text-lg font-bold text-gray-900 mb-2">{membership.committees.title}</h3>
                        <p className="text-gray-600 text-sm mb-4 line-clamp-3">{membership.committees.description}</p>
                        <div className="flex items-center justify-between">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            membership.committees.status === 'Apply' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {membership.committees.status}
                          </span>
                          <span className="text-xs text-gray-500">
                            Joined {new Date(membership.joined_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="text-gray-400 mb-4">
                      <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No committees yet</h3>
                    <p className="text-gray-500 mb-6">You haven't joined any committees yet.</p>
                    <Link
                      href="/committees"
                      className="inline-block bg-[#20B2AA] text-white px-6 py-3 rounded-lg hover:bg-[#1a9b94] transition-colors"
                    >
                      Browse Committees
                    </Link>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'social' && (
              <div className="bg-white rounded-2xl shadow-lg p-6 lg:p-8 border border-gray-100">
                <div className="flex items-center mb-6">
                  <div className="w-10 h-10 bg-[#20B2AA] rounded-xl flex items-center justify-center mr-4">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">Social Media Links</h2>
                </div>
                
                <SocialMediaSection 
                  userId={user.id} 
                  isEditing={isEditing} 
                  onEditToggle={() => setIsEditing(!isEditing)} 
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Image Crop Modal */}
      <ImageCropModal
        isOpen={showCropModal}
        onClose={() => setShowCropModal(false)}
        onCrop={handleCropComplete}
        imageSrc={cropImageSrc}
        aspect={cropType === 'profile' ? 1 : 1200/460}
      />
      </div>
    </AuthGuard>
  );
}
