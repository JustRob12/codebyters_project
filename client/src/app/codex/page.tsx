'use client';

import StudentHeader from '@/components/StudentHeader';
import FloatingNavigation from '@/components/FloatingNavigation';
import Image from 'next/image';
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import QRCode from 'qrcode';
import html2canvas from 'html2canvas';
import AuthGuard from '@/components/AuthGuard';

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
  const [isDownloading, setIsDownloading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const modalCanvasRef = useRef<HTMLCanvasElement>(null);
  const idCardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchUserData();
  }, []);

  // Generate QR code for modal when it opens
  useEffect(() => {
    if (isModalOpen && qrData && modalCanvasRef.current) {
      const generateModalQR = () => {
        try {
          QRCode.toCanvas(modalCanvasRef.current, qrData, {
            width: 256, // 256px for modal
            margin: 1,
            color: {
              dark: '#000000',
              light: '#FFFFFF'
            }
          }, (error) => {
            if (error) {
              console.error('Error generating modal QR code:', error);
            } else {
              console.log('Modal QR code generated successfully');
            }
          });
        } catch (error) {
          console.error('Error generating modal QR code:', error);
        }
      };

      setTimeout(() => {
        generateModalQR();
      }, 100);
    }
  }, [isModalOpen, qrData]);

  useEffect(() => {
    if (qrData && canvasRef.current) {
      console.log('Generating QR code with data:', qrData);
      console.log('Canvas element:', canvasRef.current);
      
      const generateQR = () => {
        try {
          // Get QR code size optimized for ID card (192px = w-48 h-48)
          const getQRSize = () => {
            return 192; // Fixed size for ID card consistency
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

    setIsDownloading(true);
    try {
      // Wait for all images to load completely
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Ensure all images are fully loaded
      const images = idCardRef.current.querySelectorAll('img');
      await Promise.all(Array.from(images).map(img => {
        return new Promise(resolve => {
          if (img.complete && img.naturalWidth > 0) {
            resolve(true);
          } else {
            img.onload = () => resolve(true);
            img.onerror = () => resolve(true);
          }
        });
      }));

      // No positioning adjustments needed for portrait layout

      // Capture the exact card as it appears on the page
      const canvas = await html2canvas(idCardRef.current, {
        width: 336, // 3.5 inches at 96 DPI
        height: 480, // 5 inches at 96 DPI
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: '#ffffff',
      });

      // No styling restoration needed for portrait layout

      // Convert canvas to blob for download with maximum quality
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
          link.download = `${user.first_name}_${user.last_name}_CODEX_ID_Card.png`;
          link.href = url;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
          URL.revokeObjectURL(url);
        }
        setIsDownloading(false);
      }, 'image/png', 1.0); // Maximum quality PNG

    } catch (error) {
      console.error('Error downloading ID card:', error);
      alert('Error downloading ID card. Please try again.');
      setIsDownloading(false);
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
    <AuthGuard requireAuth={true} allowedRoles={[2]}>
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
        

        {/* Student ID Card - Portrait Layout */}
        <div 
          ref={idCardRef}
          data-id-card
          className="rounded-lg p-6 relative overflow-hidden mx-auto shadow-lg border-2 border-gray-200" 
          style={{ 
            width: '3.5in',
            height: '5in',
            minWidth: '3.5in',
            minHeight: '5in',
            backgroundImage: 'url(/codexbg.png)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat'
          }}
        >
          {/* Semi-transparent overlay for better text readability */}
          <div className="absolute inset-0 bg-white bg-opacity-20 rounded-lg"></div>
          
          <div className="flex flex-col h-full items-center justify-between relative z-10">
            {/* Profile Picture - Top */}
            <div className="flex justify-center mb-4">
              <div className="w-32 h-32 bg-white rounded-full flex items-center justify-center overflow-hidden shadow-lg" style={{ 
                border: '3px solid #166534'
              }}>
                {user.profile_picture ? (
                  <Image
                    src={user.profile_picture}
                    alt={`${user.first_name} ${user.last_name}`}
                    width={128}
                    height={128}
                    className="rounded-full object-cover w-full h-full"
                    style={{ 
                      borderRadius: '50%',
                      objectFit: 'cover',
                      objectPosition: 'center'
                    }}
                    unoptimized
                    priority
                  />
                ) : (
                  <svg className="w-8 h-8 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
            </div>

            {/* Student Information - Center */}
            <div className="text-center flex-1 flex flex-col justify-center">
              {/* Year */}
              <p className="text-sm font-bold uppercase " style={{ color: '#166534' }}>
                {user.year}
              </p>
              
              {/* Name */}
              <h2 className="text-lg font-bold uppercase " style={{ color: '#166534' }}>
                {user.first_name} {user.middle_initial || ''} {user.last_name}
              </h2>
              
              {/* School ID */}
              <p className="text-sm font-bold uppercase" style={{ color: '#166534' }}>
                {user.student_id}
              </p>
            </div>

            {/* QR Code - Bottom */}
            <div className="flex justify-center mt-4">
              <div className="bg-white p-2 rounded-lg shadow-lg">
                {qrData ? (
                  <canvas ref={canvasRef} className="w-48 h-48"></canvas>
                ) : user?.profile_picture ? (
                  <div className="w-48 h-48 flex items-center justify-center text-gray-500">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-2"></div>
                      <p className="text-sm">Loading QR Code...</p>
                    </div>
                  </div>
                  ) : (
                  <div className="w-48 h-48 flex items-center justify-center" style={{ color: '#6b7280' }}>
                      <div className="text-center">
                      <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 15.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                      <p className="text-sm font-medium" style={{ color: '#4b5563' }}>Profile Required</p>
                    </div>
                    </div>
                  )}
              </div>
            </div>
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row gap-4 items-center justify-center">
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-[#166534] hover:bg-[#14532d] text-white font-bold py-3 px-8 rounded-lg shadow-lg transition-colors duration-200 flex items-center space-x-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
            </svg>
            <span>View Fullscreen</span>
          </button>
          
          <button
            onClick={downloadIDCard}
            disabled={isDownloading}
            className={`${isDownloading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-[#1a9b9b]'} bg-[#20B2AA] text-white font-bold py-3 px-8 rounded-lg shadow-lg transition-colors duration-200 flex items-center space-x-2`}
          >
            {isDownloading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Generating Card...</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>Download CODEX ID Card</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Fullscreen Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75">
          <div className="relative w-full h-full flex items-center justify-center p-4">
            {/* Close Button */}
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 z-10 bg-white bg-opacity-90 hover:bg-opacity-100 text-gray-800 rounded-full p-2 shadow-lg transition-all duration-200"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            {/* ID Card in Modal */}
            <div className="max-w-full max-h-full overflow-auto flex items-center justify-center">
              <div 
                className="rounded-lg p-8 relative overflow-hidden shadow-2xl border-2 border-gray-200" 
                style={{ 
                  width: '5in',
                  height: '7in',
                  minWidth: '5in',
                  minHeight: '7in',
                  backgroundImage: 'url(/codexbg.png)',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  backgroundRepeat: 'no-repeat'
                }}
              >
                {/* Semi-transparent overlay for better text readability */}
                <div className="absolute inset-0 bg-white bg-opacity-20 rounded-lg"></div>
                
                <div className="flex flex-col h-full items-center justify-between relative z-10">
                  {/* Profile Picture - Top */}
                  <div className="flex justify-center mb-6">
                    <div className="w-48 h-48 bg-white rounded-full flex items-center justify-center overflow-hidden shadow-lg" style={{ 
                      border: '4px solid #166534'
                    }}>
                      {user?.profile_picture ? (
                    <Image
                      src={user.profile_picture}
                      alt={`${user.first_name} ${user.last_name}`}
                          width={192}
                          height={192}
                      className="rounded-full object-cover w-full h-full"
                          style={{ 
                            borderRadius: '50%',
                            objectFit: 'cover',
                            objectPosition: 'center'
                          }}
                      unoptimized
                          priority
                    />
                  ) : (
                        <svg className="w-8 h-8 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                    </svg>
                  )}
                    </div>
                </div>
                
                  {/* Student Information - Center */}
                  <div className="text-center flex-1 flex flex-col justify-center">
                    {/* Year */}
                    <p className="text-lg font-bold uppercase mb-3" style={{ color: '#166534' }}>
                      {user?.year}
                    </p>
                    
                    {/* Name */}
                    <h2 className="text-2xl font-bold uppercase mb-3" style={{ color: '#166534' }}>
                      {user?.first_name} {user?.middle_initial || ''} {user?.last_name}
                  </h2>
                    
                    {/* School ID */}
                    <p className="text-lg font-bold uppercase" style={{ color: '#166534' }}>
                      {user?.student_id}
                    </p>
                  </div>

                  {/* QR Code - Bottom */}
                  <div className="flex justify-center mt-6">
                    <div className="bg-white p-3 rounded-lg shadow-lg">
                      {qrData ? (
                        <canvas ref={modalCanvasRef} className="w-64 h-64"></canvas>
                      ) : user?.profile_picture ? (
                        <div className="w-64 h-64 flex items-center justify-center text-gray-500">
                          <div className="text-center">
                            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-gray-900 mx-auto mb-3"></div>
                            <p className="text-lg">Loading QR Code...</p>
                          </div>
                        </div>
                      ) : (
                        <div className="w-64 h-64 flex items-center justify-center" style={{ color: '#6b7280' }}>
                          <div className="text-center">
                            <svg className="w-16 h-16 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 15.5c-.77.833.192 2.5 1.732 2.5z" />
                            </svg>
                            <p className="text-lg font-medium" style={{ color: '#4b5563' }}>Profile Required</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </AuthGuard>
  );
}
