'use client';

import StudentHeader from '@/components/StudentHeader';
import FloatingNavigation from '@/components/FloatingNavigation';
import Image from 'next/image';
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import QRCode from 'qrcode';

interface Student {
  id: number;
  first_name: string;
  last_name: string;
  middle_initial?: string;
  student_id: string;
  profile_picture: string;
  year: string;
  created_at: string;
}

export default function MyCodexPage() {
  const [user, setUser] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [qrData, setQrData] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const idCardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchUserData();
  }, []);

  useEffect(() => {
    if (qrData && canvasRef.current) {
      console.log('Generating QR code with data:', qrData);
      console.log('Canvas element:', canvasRef.current);
      
      const generateQR = () => {
        try {
          // Get responsive QR code size based on screen size
          const getQRSize = () => {
            if (window.innerWidth < 640) return 128; // Mobile
            if (window.innerWidth < 768) return 192; // Small
            if (window.innerWidth < 1024) return 224; // Medium
            return 256; // Large
          };

          const size = getQRSize();
          console.log('QR code size:', size);

          QRCode.toCanvas(canvasRef.current, qrData, {
            width: size,
            margin: 1,
            color: {
              dark: '#000000',
              light: '#FFFFFF'
            }
          }, (error) => {
            if (error) {
              console.error('Error generating QR code:', error);
            } else {
              console.log('QR code generated successfully');
              // Generate data URL for the QR code
              const canvas = canvasRef.current;
              if (canvas) {
                setQrCodeUrl(canvas.toDataURL());
              }
            }
          });
        } catch (error) {
          console.error('Error generating QR code:', error);
        }
      };

      // Wait a bit for the canvas to be ready
      setTimeout(() => {
        generateQR();
      }, 100);

      // Add resize listener to regenerate QR code on window resize
      const handleResize = () => {
        setTimeout(() => {
          generateQR();
        }, 100);
      };

      window.addEventListener('resize', handleResize);

      // Cleanup listener on unmount
      return () => {
        window.removeEventListener('resize', handleResize);
      };
    }
  }, [qrData]);

  const fetchUserData = async () => {
    try {
      const userData = localStorage.getItem('user');
      if (userData) {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        
        // Check if user has profile picture before generating QR code
        if (parsedUser.profile_picture && parsedUser.profile_picture.trim() !== '') {
          // Generate QR code data with CODEX value, separators, and profile picture
          const codexValue = 'CODEX';
          const qrInfo = `${parsedUser.first_name}|${parsedUser.last_name}|${parsedUser.student_id}|${parsedUser.year}|${parsedUser.profile_picture}|${codexValue}`;
          setQrData(qrInfo);
        } else {
          // No profile picture - don't generate QR code
          setQrData('');
          console.log('No profile picture found - QR code generation skipped');
        }
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const downloadIDCard = async () => {
    if (!idCardRef.current || !user) return;

    try {
      // Import dom-to-image dynamically
      const domtoimage = (await import('dom-to-image')).default as any;
      
      // Wait for images to load
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Convert the ID card to image with high quality
      const dataUrl = await domtoimage.toPng(idCardRef.current, {
        width: 675,
        height: 425,
        quality: 1.0,
        bgcolor: '#20B2AA', // Fallback background
        style: {
          transform: 'scale(1)',
          transformOrigin: 'top left'
        }
      });

      // Create download link
      const link = document.createElement('a');
      link.download = `${user.first_name}_${user.last_name}_CODEX_ID.png`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error downloading ID card:', error);
      alert('Error downloading ID card. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <StudentHeader />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
              <div className="flex items-center space-x-6">
                <div className="w-24 h-24 bg-gray-200 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/5"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <StudentHeader />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">My Codex</h1>
            <p className="text-gray-600">Please log in to view your codex.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <StudentHeader />
      <FloatingNavigation user={user} />
      
      <div className="flex flex-col justify-center items-center min-h-[calc(100vh-80px)]">
        {/* CODEX Description */}
        <div className="text-left mb-8 max-w-2xl px-4">
          <h1 className="text-4xl font-bold mb-4" style={{ color: '#111827' }}>The CODEX</h1>
          <p className="text-lg leading-relaxed" style={{ color: '#374151' }}>
            Keep this CODEX as a sign that you are a student of DOrSU BSIT. This is your digital identity card and key to your attendance tracking, membership fee management, and exclusive student events. Your CODEX contains your unique student information and serves as your official digital identification within the BSIT community.
          </p>
        </div>
        
        {/* Mobile Notice */}
        <div className="block sm:hidden bg-blue-50 border border-blue-200 rounded-lg p-6 mx-4 mb-8">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-blue-900 mb-2">NOTE: PLEASE OPEN YOUR CODEX ON YOUR LAPTOP AND DOWNLOAD IT</h3>
              <p className="text-blue-700">
                For the best experience and to download your CODEX ID card, please use a laptop or desktop computer.
              </p>
            </div>
          </div>
        </div>

        {/* Student ID Card - Hidden on mobile */}
        <div 
          ref={idCardRef}
          data-id-card
          className="hidden sm:block rounded-lg p-4 sm:p-6 md:p-8 relative overflow-hidden w-full max-w-[400px] sm:max-w-[500px] md:max-w-[600px] lg:max-w-[675px] mx-auto bg-cover bg-center bg-no-repeat h-[250px] sm:h-[300px] md:h-[350px] lg:h-[425px]" 
          style={{ 
            backgroundImage: 'url(/codexbackground.png)',
            aspectRatio: '675/425'
          }}
        >
          <div className="flex h-full flex-col sm:flex-row">
            {/* QR Code Section - Top on mobile, Right on desktop */}
            <div className="flex-1 flex items-center justify-center mb-4 sm:mb-0 order-1 sm:order-2">
              <div className="bg-white p-1 sm:p-2 rounded-lg shadow-lg">
                {qrData ? (
                  <canvas ref={canvasRef} className="w-32 h-32 sm:w-48 sm:h-48 md:w-56 md:h-56 lg:w-64 lg:h-64"></canvas>
                ) : user?.profile_picture ? (
                  <div className="w-32 h-32 sm:w-48 sm:h-48 md:w-56 md:h-56 lg:w-64 lg:h-64 flex items-center justify-center text-gray-500">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-gray-900 mx-auto mb-2"></div>
                      <p className="text-xs sm:text-sm">Loading QR Code...</p>
                    </div>
                  </div>
                  ) : (
                    <div className="w-32 h-32 sm:w-48 sm:h-48 md:w-56 md:h-56 lg:w-64 lg:h-64 flex items-center justify-center" style={{ color: '#6b7280' }}>
                      <div className="text-center">
                        <svg className="w-8 h-8 sm:w-12 sm:h-12 md:w-16 md:h-16 mx-auto mb-2 sm:mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#9ca3af' }}>
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 15.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                        <p className="text-xs sm:text-sm font-medium" style={{ color: '#4b5563' }}>Profile Picture Required</p>
                        <p className="text-xs mt-1" style={{ color: '#6b7280' }}>Upload a profile picture to generate QR code</p>
                      </div>
                    </div>
                  )}
              </div>
            </div>

            {/* Profile Picture and Student Information - Bottom on mobile, Left on desktop */}
            <div className="flex-1 flex flex-col justify-center pl-4 sm:pl-4 order-2 sm:order-1">
              <div className="flex flex-col items-start">
                {/* Circular Profile Picture */}
                <div className="w-32 h-32 sm:w-40 sm:h-40 md:w-50 md:h-50 bg-white rounded-full flex items-center justify-center overflow-hidden shadow-lg mb-4 sm:mb-6" style={{ border: '4px solid #166534' }}>
                  {user.profile_picture ? (
                    <Image
                      src={user.profile_picture}
                      alt={`${user.first_name} ${user.last_name}`}
                      width={160}
                      height={160}
                      className="rounded-full object-cover w-full h-full"
                      style={{ borderRadius: '50%' }}
                      unoptimized
                    />
                  ) : (
                    <svg className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                
                {/* Student Information */}
                <div className="text-left">
                  <p className="text-sm sm:text-lg md:text-xl font-bold uppercase" style={{ color: '#166534' }}>
                    {user.first_name} {user.middle_initial || ''}
                  </p>
                  <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold uppercase" style={{ color: '#166534' }}>
                    {user.last_name}
                  </h2>
                  <p className="text-xs sm:text-sm md:text-base lg:text-lg font-bold uppercase" style={{ color: '#166534' }}>{user.student_id} {user.year}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Download Button - Hidden on mobile */}
        <div className="mt-8 hidden sm:block">
          <button
            onClick={downloadIDCard}
            className="bg-[#20B2AA] hover:bg-[#1a9b9b] text-white font-bold py-3 px-8 rounded-lg shadow-lg transition-colors duration-200 flex items-center space-x-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span>Download CODEX ID</span>
          </button>
        </div>
      </div>
    </div>
  );
}
