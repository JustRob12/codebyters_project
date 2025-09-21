'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface SocialMediaLink {
  id: number;
  user_id: number;
  platform: string;
  username: string;
  url: string;
  display_order: number;
  is_active: boolean;
}

interface ReadOnlySocialMediaSectionProps {
  userId: number;
}

const PLATFORM_ICONS = {
  twitter: 'M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z',
  instagram: 'M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37zm1.5-4.87h.01M22 12a10 10 0 11-20 0 10 10 0 0120 0zm-7.5-3.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z',
  linkedin: 'M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2zM4 2a2 2 0 100 4 2 2 0 000-4z',
  github: 'M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 00-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0020 4.77 5.07 5.07 0 0019.91 1S18.73.65 16 2.48a13.38 13.38 0 00-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 005 4.77a5.44 5.44 0 00-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 009 18.13V22',
  facebook: 'M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z',
  youtube: 'M22.54 6.42a2.78 2.78 0 00-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 00-1.94 2A29 29 0 001 12.25a29 29 0 00.46 5.83A2.78 2.78 0 003.4 20c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 001.94-2 29 29 0 00.46-5.83 29 29 0 00-.46-5.83zM9.75 15.02V9.98l5.75 2.52-5.75 2.52z',
  tiktok: 'M19.59 6.69a4.83 4.83 0 01-3.08-1.45 4.83 4.83 0 01-1.45-3.08h-3.12v12.88a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0V8.5a6.5 6.5 0 1013 0v-1.81z'
};

const PLATFORM_COLORS = {
  twitter: '#1DA1F2',
  instagram: '#E4405F',
  linkedin: '#0077B5',
  github: '#333',
  facebook: '#1877F2',
  youtube: '#FF0000',
  tiktok: '#000000'
};

const PLATFORM_NAMES = {
  twitter: 'Twitter',
  instagram: 'Instagram',
  linkedin: 'LinkedIn',
  github: 'GitHub',
  facebook: 'Facebook',
  youtube: 'YouTube',
  tiktok: 'TikTok'
};

export default function ReadOnlySocialMediaSection({ userId }: ReadOnlySocialMediaSectionProps) {
  const [socialLinks, setSocialLinks] = useState<SocialMediaLink[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSocialLinks();
  }, [userId]);

  const fetchSocialLinks = async () => {
    try {
      const { data, error } = await supabase
        .from('social_media_links')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('display_order');

      if (error) throw error;
      setSocialLinks(data || []);
    } catch (error) {
      console.error('Error fetching social links:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPlatformIcon = (platform: string) => {
    return PLATFORM_ICONS[platform as keyof typeof PLATFORM_ICONS] || PLATFORM_ICONS.github;
  };

  const getPlatformColor = (platform: string) => {
    return PLATFORM_COLORS[platform as keyof typeof PLATFORM_COLORS] || '#6B7280';
  };

  const getPlatformName = (platform: string) => {
    return PLATFORM_NAMES[platform as keyof typeof PLATFORM_NAMES] || platform;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
      <div className="flex items-center mb-6">
        <div className="w-10 h-10 bg-purple-500 rounded-xl flex items-center justify-center mr-4">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-gray-900">Social Media</h3>
      </div>

      {socialLinks.length === 0 ? (
        <p className="text-gray-500 text-center py-8">No social media links added yet.</p>
      ) : (
        <div className="space-y-4">
          {socialLinks.map((link) => (
            <div key={link.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <div className="flex items-center space-x-4">
                <div 
                  className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: getPlatformColor(link.platform) }}
                >
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={getPlatformIcon(link.platform)} />
                  </svg>
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{getPlatformName(link.platform)}</p>
                  <p className="text-sm text-gray-600">{link.username}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#20B2AA] hover:text-[#1a9b9b] transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
