'use client';

import StudentHeader from '@/components/StudentHeader';
import ImageCropModal from '@/components/ImageCropModal';
import SocialMediaSection from '@/components/SocialMediaSection';
import Image from 'next/image';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [coverPhoto, setCoverPhoto] = useState<string>('');
  const [showCropModal, setShowCropModal] = useState(false);
  const [cropImageSrc, setCropImageSrc] = useState<string>('');
  const [cropType, setCropType] = useState<'profile' | 'cover'>('profile');
  const router = useRouter();
  const profileInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchUserData();
  }, []);

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

  const handleImageUpload = async (file: File, type: 'profile' | 'cover') => {
    if (!file) return;

    setIsUploading(true);
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

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-100">
        <StudentHeader />
        <div className="pt-16 flex items-center justify-center min-h-[calc(100vh-4rem)]">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Profile Not Found</h1>
            <p className="text-gray-600 mb-6">Please log in to view your profile.</p>
            <Link
              href="/login"
              className="bg-[#20B2AA] text-white px-6 py-2 rounded-lg hover:opacity-90 transition-opacity"
            >
              Go to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <StudentHeader />
      
      <div className="pt-8">
        <div className="max-w-6xl mx-auto px-4 py-8">
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
              className="w-full bg-gradient-to-r from-[#20B2AA] via-[#1a9b9b] to-[#20B2AA] relative cursor-pointer group"
              onClick={handleCoverPhotoClick}
              style={{
                width: '1200px',
                height: '460px',
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
            <div className="px-8 pb-8">
              <div className="flex flex-col lg:flex-row items-start lg:items-end -mt-20 relative">
                {/* Profile Picture */}
                <div className="relative z-10">
                  <div 
                    className="w-40 h-40 bg-white rounded-full border-4 border-white shadow-2xl flex items-center justify-center cursor-pointer group hover:scale-105 transition-all duration-300"
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
                      <svg className="w-20 h-20 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
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
                <div className="mt-5 lg:mt-0 lg:ml-8 flex-1">
                  <h1 className="text-3xl font-bold text-gray-900">
                    {user.first_name} {user.last_name}
                  </h1>
                  <div className="flex items-center space-x-4 mb-4">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-[#20B2AA]/10 text-[#20B2AA]">
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
                <div className="mt-6 lg:mt-0 flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
                  <button className="bg-[#20B2AA] text-white px-6 py-3 rounded-xl hover:bg-[#1a9b9b] transition-colors shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
                    <div className="flex items-center space-x-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      <span>Edit Profile</span>
                    </div>
                  </button>
                  <button className="border-2 border-gray-200 text-gray-700 px-6 py-3 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
                    <div className="flex items-center space-x-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                      </svg>
                      <span>Share Profile</span>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Profile Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
            {/* Left Column - About */}
            <div className="lg:col-span-2 space-y-8">
              {/* About Section */}
              <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
                <div className="flex items-center mb-6">
                  <div className="w-10 h-10 bg-[#20B2AA] rounded-xl flex items-center justify-center mr-4">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">About</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <label className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Full Name</label>
                    <p className="text-lg text-gray-900 font-medium">{user.first_name} {user.middle_initial} {user.last_name}</p>
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Student ID</label>
                    <p className="text-lg text-gray-900 font-medium">{user.student_id}</p>
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Year Level</label>
                    <p className="text-lg text-gray-900 font-medium">{user.year}</p>
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Email</label>
                    <p className="text-lg text-gray-900 font-medium">{user.email}</p>
                  </div>
                </div>
              </div>

              {/* Social Media Section */}
              <SocialMediaSection 
                userId={user.id} 
                isEditing={isEditing} 
                onEditToggle={() => setIsEditing(!isEditing)} 
              />
            </div>

            {/* Right Column - Quick Info */}
            <div className="space-y-8">
              {/* Quick Stats */}
              <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
                <div className="flex items-center mb-6">
                  <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center mr-4">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">Quick Stats</h3>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-3 border-b border-gray-100">
                    <span className="text-gray-600 font-medium">Events Attended</span>
                    <span className="font-bold text-2xl text-[#20B2AA]">0</span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-gray-100">
                    <span className="text-gray-600 font-medium">Committees</span>
                    <span className="font-bold text-2xl text-[#20B2AA]">0</span>
                  </div>
                </div>
              </div>

             
            </div>
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
  );
}
