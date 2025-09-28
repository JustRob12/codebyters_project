'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminDashboardHeader from '@/components/AdminDashboardHeader';
import { supabase } from '@/lib/supabase';
import AuthGuard from '@/components/AuthGuard';
import jsQR from 'jsqr';
import { useAudio } from '@/hooks/useAudio';

interface Student {
  id: number;
  first_name: string;
  last_name: string;
  middle_initial?: string;
  student_id: string;
  year: string;
  created_at: string;
}

interface Event {
  id: number;
  title: string;
  description: string;
  event_date: string;
  status: 'active' | 'inactive';
  created_at: string;
}

interface AttendanceRecord {
  id: number;
  event_title: string;
  student_id: string;
  first_name: string;
  last_name: string;
  middle_initial?: string;
  year: string;
  time_in?: string;
  time_out?: string;
  created_at: string;
}

export default function AttendanceScannerPage() {
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);
  const [selectedEventTitle, setSelectedEventTitle] = useState('');
  const [events, setEvents] = useState<Event[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [scannedStudents, setScannedStudents] = useState<AttendanceRecord[]>([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [showQRModal, setShowQRModal] = useState(false);
  const [attendanceType, setAttendanceType] = useState<'time_in' | 'time_out'>('time_in');
  const [detectedStudent, setDetectedStudent] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [qrDetected, setQrDetected] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const router = useRouter();
  
  // Audio hook for QR detection sound
  const { playAudio } = useAudio('/bep.mp3');

  // Load events on component mount
  useEffect(() => {
    loadEvents();
  }, []);

  // Load existing attendance records for the current event
  useEffect(() => {
    if (selectedEventTitle) {
      loadAttendanceRecords();
    }
  }, [selectedEventTitle]);

  const loadEvents = async () => {
    try {
      setLoadingEvents(true);
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('status', 'active')
        .order('event_date', { ascending: false });

      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error('Error loading events:', error);
      setError('Failed to load events');
    } finally {
      setLoadingEvents(false);
    }
  };

  const loadAttendanceRecords = async () => {
    try {
      const { data, error } = await supabase
        .from('attendance')
        .select('*')
        .eq('event_title', selectedEventTitle)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setScannedStudents(data || []);
    } catch (error) {
      console.error('Error loading attendance records:', error);
    }
  };

  const handleEventChange = (eventId: number) => {
    setSelectedEventId(eventId);
    const selectedEvent = events.find(event => event.id === eventId);
    if (selectedEvent) {
      setSelectedEventTitle(selectedEvent.title);
    }
  };

  const startScanning = async () => {
    if (!selectedEventTitle.trim()) {
      setError('Please select an event first');
      return;
    }

    try {
      setError('');
      setSuccess('');
      setQrDetected(false);
      
      // Stop any existing stream first
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      
      // Set scanning state first to render the video element
      setIsScanning(true);
      
      // Wait for the video element to be rendered
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Try to get camera with optimized constraints for better performance
      const constraints = {
        video: {
          facingMode: 'environment', // Prefer back camera
          width: { ideal: 640, max: 1280 },
          height: { ideal: 480, max: 720 },
          frameRate: { ideal: 15, max: 30 }
        }
      };
      
      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch (error) {
        // Fallback to front camera
        stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'user' } 
        });
      }
      
      // Wait a bit more for the video element to be available
      await new Promise(resolve => setTimeout(resolve, 200));
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        
        // Also set the stream on the visible video element when it appears
        setTimeout(() => {
          const visibleVideo = document.querySelector('video:not(.hidden)') as HTMLVideoElement;
          if (visibleVideo) {
            visibleVideo.srcObject = stream;
          }
        }, 100);
        
        // Wait for video to be ready
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().catch(e => {
            setError('Failed to start video playback');
          });
        };
        
        videoRef.current.onplay = () => {
          // Start QR detection after video is playing
          setTimeout(() => {
            setIsDetecting(true);
            detectQRCode();
          }, 500);
        };
        
        videoRef.current.onerror = (e) => {
          setError('Video playback error');
        };
      } else {
        setError('Video element not found - please try again');
        setIsScanning(false);
      }
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          setError('Camera access denied. Please allow camera permissions and try again.');
        } else if (error.name === 'NotFoundError') {
          setError('No camera found. Please check your device has a camera.');
        } else {
          setError(`Failed to access camera: ${error.message}`);
        }
      } else {
        setError('Failed to access camera. Please check permissions.');
      }
      setIsScanning(false);
    }
  };

  const stopScanning = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsScanning(false);
    setIsDetecting(false);
    setQrDetected(false);
  };

  // Auto-detect QR codes from video stream
  const detectQRCode = () => {
    if (!videoRef.current) {
      return
    }
    
    // If we have a video reference and it's playing, we can detect
    if (videoRef.current.readyState >= 2) { // HAVE_CURRENT_DATA
      // Video is ready
    } else {
      setTimeout(() => detectQRCode(), 100)
      return
    }

    // Create canvas once and reuse it
    const canvas = document.createElement('canvas')
    const context = canvas.getContext('2d')
    
    if (!context) {
      return
    }

    // Set canvas size once - use smaller size for better performance
    const scale = 0.5 // Reduce resolution by half for better performance
    canvas.width = videoRef.current.videoWidth * scale
    canvas.height = videoRef.current.videoHeight * scale

    let frameCount = 0
    const detect = () => {
        // Check if we should continue scanning
        const shouldContinue = videoRef.current && videoRef.current.videoWidth && videoRef.current.readyState >= 2
        
        if (!shouldContinue) {
          return
        }
        
        // Process every 3rd frame to reduce CPU usage
        frameCount++
        if (frameCount % 3 !== 0) {
          requestAnimationFrame(detect)
          return
        }

        try {
          if (!videoRef.current) {
            return
          }

          // Draw video frame to canvas with scaling
          context.drawImage(videoRef.current, 0, 0, videoRef.current.videoWidth, videoRef.current.videoHeight, 0, 0, canvas.width, canvas.height)

          // Get image data with reduced resolution for better performance
          const imageData = context.getImageData(0, 0, canvas.width, canvas.height)
          
          // Use faster QR detection settings
          const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: 'dontInvert',
          })

          if (code) {
            try {
              // Play audio when QR code is detected
              playAudio();
              
              // Check if it's CODEX format (pipe-separated) or JSON format
              if (code.data.includes('|') && code.data.includes('CODEX')) {
                // CODEX format: first_name|last_name|student_id|year|profile_picture|CODEX
                console.log('CODEX QR Code detected:', code.data);
                
                // Immediately set QR detected state and stop scanning
                setQrDetected(true)
                setIsScanning(false)
                setIsDetecting(false)
                
                // Small delay to show the success animation before showing modal
                setTimeout(() => {
                  handleScannedData(code.data)
                }, 500)
                
                return
              } else {
                // Try JSON format (legacy support)
                const scannedData = JSON.parse(code.data)
                
                // Check for required fields - support both student_id and id
                const studentId = scannedData.student_id || scannedData.id
                
                if (scannedData && studentId) {
                  // Normalize the data structure
                  const normalizedData = {
                    id: scannedData.id,
                    student_id: studentId,
                    first_name: scannedData.first_name,
                    middle_initial: scannedData.middle_initial,
                    last_name: scannedData.last_name,
                    email: scannedData.email,
                    year_level: scannedData.year_level,
                    course: scannedData.course,
                    avatar: scannedData.avatar,
                    timestamp: scannedData.timestamp
                  }
                  
                  // Immediately set QR detected state and stop scanning
                  setQrDetected(true)
                  setIsScanning(false)
                  setIsDetecting(false)
                  
                  // Small delay to show the success animation before showing modal
                  setTimeout(() => {
                    handleScannedData(normalizedData)
                  }, 500)
                  
                  return
                } else {
                  setError('Invalid QR code format - missing student ID')
                  stopScanning() // Stop scanning for invalid QR format
                  return
                }
              }
            } catch (error) {
              setError('Invalid QR code format - not valid JSON or CODEX format')
              stopScanning() // Stop scanning for invalid QR format
              return
            }
          } else {
            // Continue scanning
            requestAnimationFrame(detect)
          }
        } catch (error) {
          // Continue scanning even if there's an error
          requestAnimationFrame(detect)
        }
    }

    detect()
  };

  // Handle scanned data from QR code
  const handleScannedData = async (data: any) => {
    try {
      // Parse CODEX QR code format: first_name|last_name|student_id|year|profile_picture|CODEX
      const parts = data.split('|');
      
      if (parts.length < 6 || parts[5] !== 'CODEX') {
        setError('Invalid QR code. Please scan a valid CODEX QR code.');
        stopScanning(); // Stop scanning for invalid QR format
        return;
      }

      const [first_name, last_name, student_id, year, profile_picture] = parts;

      // Look up student in users table using student_id
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('student_id', student_id)
        .eq('role', 2) // Only students (role 2)
        .maybeSingle();

      if (userError) {
        console.error('Error fetching user data:', userError);
        setError('Error looking up student information');
        return;
      }

      if (!userData) {
        setError(`Student with ID ${student_id} not found in the system`);
        stopScanning(); // Stop scanning for invalid student
        return;
      }

      // Check if student is already recorded for this event with the same attendance type
      const existingRecord = scannedStudents.find(
        record => record.student_id === student_id && record.event_title === selectedEventTitle
      );

      if (existingRecord) {
        // Check if we're trying to record the same type that already exists in local state
        if (attendanceType === 'time_in' && existingRecord.time_in) {
          setError(`Student ${userData.first_name} ${userData.last_name} already has a time in recorded for this event.`);
          stopScanning(); // Stop scanning for duplicate attendance
          return;
        }
        
        if (attendanceType === 'time_out' && existingRecord.time_out) {
          setError(`Student ${userData.first_name} ${userData.last_name} already has a time out recorded for this event.`);
          stopScanning(); // Stop scanning for duplicate attendance
          return;
        }
      }

      // Show success message
      const successMessage = `QR Code detected! Student: ${userData.first_name} ${userData.last_name}`;
      setSuccess(successMessage);
      
      // Set detected student data from users table
      setDetectedStudent({
        first_name: userData.first_name,
        last_name: userData.last_name,
        middle_initial: userData.middle_initial,
        student_id: userData.student_id,
        year: userData.year,
        profile_picture: profile_picture // Use profile picture from QR code, not database
      });

      // Show modal
      setShowQRModal(true);
      // Keep scanning active - don't stop scanning when QR is detected

    } catch (error) {
      console.error('Error processing QR code:', error);
      setError('Failed to process QR code. Please try again.');
      stopScanning(); // Stop scanning on processing error
    }
  };

  // Show modal with detected student information (legacy function for CODEX format)
  const showQRModalWithStudent = (qrData: string) => {
    try {
      // Parse QR code data (format: first_name|last_name|student_id|year|profile_picture|CODEX)
      const parts = qrData.split('|');
      
      if (parts.length < 5 || parts[5] !== 'CODEX') {
        setError('Invalid QR code. Please scan a valid CODEX QR code.');
        stopScanning(); // Stop scanning for invalid QR format
        return;
      }

      const [first_name, last_name, student_id, year, profile_picture] = parts;

      // Check if student is already recorded for this event
      const existingRecord = scannedStudents.find(
        record => record.student_id === student_id && record.event_title === selectedEventTitle
      );

      if (existingRecord) {
        setError(`Student ${first_name} ${last_name} is already recorded for this event.`);
        stopScanning(); // Stop scanning for duplicate attendance
        return;
      }

      // Set detected student data
      setDetectedStudent({
        first_name,
        last_name,
        student_id,
        year,
        profile_picture
      });

      // Show modal
      setShowQRModal(true);
      // Keep scanning active - don't stop scanning when QR is detected

    } catch (error) {
      console.error('Error processing QR code:', error);
      setError('Failed to process QR code. Please try again.');
      stopScanning(); // Stop scanning on processing error
    }
  };

  // Approve and record attendance
  const approveAttendance = async () => {
    if (!detectedStudent) return;

    try {
      setIsProcessing(true);

      // Get fresh user data from database to ensure accuracy
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('student_id', detectedStudent.student_id)
        .eq('role', 2) // Only students
        .maybeSingle();

      if (userError || !userData) {
        setError('Error fetching student data. Please try again.');
        return;
      }

      // Check if student already has attendance record for this event
      const { data: existingRecord, error: checkError } = await supabase
        .from('attendance')
        .select('*')
        .eq('event_title', selectedEventTitle)
        .eq('student_id', userData.student_id)
        .maybeSingle();

      if (checkError) {
        throw checkError;
      }

      let attendanceData;
      const currentTime = new Date().toISOString();

      if (existingRecord) {
        // Check if we're trying to record the same type that already exists
        if (attendanceType === 'time_in' && existingRecord.time_in) {
          setError(`Student ${userData.first_name} ${userData.last_name} already has a time in recorded for this event.`);
          return;
        }
        
        if (attendanceType === 'time_out' && existingRecord.time_out) {
          setError(`Student ${userData.first_name} ${userData.last_name} already has a time out recorded for this event.`);
          return;
        }

        // Update existing record with the new time
        const updateData: any = {};
        if (attendanceType === 'time_in') {
          updateData.time_in = currentTime;
        } else {
          updateData.time_out = currentTime;
        }

        const { data, error } = await supabase
          .from('attendance')
          .update(updateData)
          .eq('id', existingRecord.id)
          .select()
          .single();

        if (error) throw error;
        attendanceData = data;
      } else {
        // Create new record
        const insertData: any = {
          event_title: selectedEventTitle,
          student_id: userData.student_id,
          first_name: userData.first_name,
          last_name: userData.last_name,
          middle_initial: userData.middle_initial || '',
          year: userData.year
        };

        if (attendanceType === 'time_in') {
          insertData.time_in = currentTime;
        } else {
          insertData.time_out = currentTime;
        }

        const { data, error } = await supabase
          .from('attendance')
          .insert(insertData)
          .select()
          .single();

        if (error) throw error;
        attendanceData = data;
      }

      // Add to local state - check if record already exists to avoid duplicates
      setScannedStudents(prev => {
        const existingIndex = prev.findIndex(record => record.id === attendanceData.id);
        if (existingIndex > -1) {
          // Update existing record
          const newPrev = [...prev];
          newPrev[existingIndex] = attendanceData;
          return newPrev;
        } else {
          // Add new record
          return [attendanceData, ...prev];
        }
      });
      setSuccess(`Successfully recorded ${attendanceType === 'time_in' ? 'time in' : 'time out'} for ${userData.first_name} ${userData.last_name}`);
      
      // Close modal and clear data
      setShowQRModal(false);
      setDetectedStudent(null);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
      
      // Continue scanning - don't stop the camera

    } catch (error) {
      console.error('Error recording attendance:', error);
      setError('Failed to record attendance. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Close modal without recording
  const closeQRModal = () => {
    setShowQRModal(false);
    setDetectedStudent(null);
    setError('');
    // Continue scanning - don't stop the camera
  };

  const deleteAttendanceRecord = async (recordId: number) => {
    try {
      const { error } = await supabase
        .from('attendance')
        .delete()
        .eq('id', recordId);

      if (error) throw error;

      setScannedStudents(prev => prev.filter(record => record.id !== recordId));
      setSuccess('Attendance record deleted successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error deleting attendance record:', error);
      setError('Failed to delete attendance record');
    }
  };

  const exportAttendance = () => {
    if (scannedStudents.length === 0) {
      setError('No attendance records to export');
      return;
    }

    const csvContent = [
      ['Event Title', 'Student ID', 'First Name', 'Last Name', 'Middle Initial', 'Year', 'Recorded At'],
      ...scannedStudents.map(record => [
        record.event_title,
        record.student_id,
        record.first_name,
        record.last_name,
        record.middle_initial || '',
        record.year,
        new Date(record.created_at).toLocaleString()
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${selectedEventTitle.replace(/\s+/g, '_')}_attendance.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <AuthGuard requireAuth={true} allowedRoles={[0]}>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <AdminDashboardHeader />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Header Section */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-[#20B2AA] rounded-full mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">Attendance Scanner</h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Scan CODEX QR codes to record student attendance for events with real-time validation.
            </p>
          </div>

          {/* Event Selection */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mb-6">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Event Selection</h3>
                <p className="text-sm text-gray-600">Choose the event for attendance tracking</p>
              </div>
            </div>
            
            {loadingEvents ? (
              <div className="flex items-center justify-center py-8">
                <div className="flex items-center space-x-3">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#20B2AA]"></div>
                  <span className="text-gray-600 font-medium">Loading events...</span>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <select
                  id="eventSelect"
                  value={selectedEventId || ''}
                  onChange={(e) => handleEventChange(parseInt(e.target.value))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#20B2AA] focus:border-transparent text-gray-900 font-medium"
                  disabled={isScanning}
                >
                  <option value="">Select an event...</option>
                  {events.map((event) => (
                    <option key={event.id} value={event.id}>
                      {event.title} - {new Date(event.event_date).toLocaleDateString()}
                    </option>
                  ))}
                </select>
                
                {selectedEventTitle && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center">
                      <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-green-800 font-medium">Selected: {selectedEventTitle}</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Attendance Type Selection */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mb-6">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Attendance Type</h3>
                <p className="text-sm text-gray-600">Select the type of attendance to record</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className={`relative flex items-center p-4 border-2 rounded-xl cursor-pointer transition-all ${
                attendanceType === 'time_in' 
                  ? 'border-[#20B2AA] bg-[#20B2AA]/5' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}>
                <input
                  type="radio"
                  name="attendanceType"
                  value="time_in"
                  checked={attendanceType === 'time_in'}
                  onChange={(e) => setAttendanceType(e.target.value as 'time_in' | 'time_out')}
                  className="sr-only"
                  disabled={isScanning}
                />
                <div className="flex items-center w-full">
                  <div className={`w-5 h-5 rounded-full border-2 mr-3 flex items-center justify-center ${
                    attendanceType === 'time_in' 
                      ? 'border-[#20B2AA] bg-[#20B2AA]' 
                      : 'border-gray-300'
                  }`}>
                    {attendanceType === 'time_in' && (
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    )}
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">Time In</div>
                    <div className="text-sm text-gray-600">Mark students as present</div>
                  </div>
                </div>
              </label>
              
              <label className={`relative flex items-center p-4 border-2 rounded-xl cursor-pointer transition-all ${
                attendanceType === 'time_out' 
                  ? 'border-[#20B2AA] bg-[#20B2AA]/5' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}>
                <input
                  type="radio"
                  name="attendanceType"
                  value="time_out"
                  checked={attendanceType === 'time_out'}
                  onChange={(e) => setAttendanceType(e.target.value as 'time_in' | 'time_out')}
                  className="sr-only"
                  disabled={isScanning}
                />
                <div className="flex items-center w-full">
                  <div className={`w-5 h-5 rounded-full border-2 mr-3 flex items-center justify-center ${
                    attendanceType === 'time_out' 
                      ? 'border-[#20B2AA] bg-[#20B2AA]' 
                      : 'border-gray-300'
                  }`}>
                    {attendanceType === 'time_out' && (
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    )}
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">Time Out</div>
                    <div className="text-sm text-gray-600">Mark students as leaving</div>
                  </div>
                </div>
              </label>
            </div>
            
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start">
                <svg className="w-5 h-5 text-blue-600 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm text-blue-800">
                  {attendanceType === 'time_in' 
                    ? 'Students will be marked as present when they scan their QR code'
                    : 'Students will be marked as leaving when they scan their QR code'
                  }
                </p>
              </div>
            </div>
          </div>

          {/* Scanner Controls */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mb-6">
            <div className="flex items-center mb-6">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Scanner Controls</h3>
                <p className="text-sm text-gray-600">Start scanning to record attendance</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <button
                onClick={startScanning}
                disabled={!selectedEventTitle.trim() || isScanning}
                className={`flex items-center justify-center px-6 py-4 rounded-xl font-semibold transition-all transform hover:scale-105 ${
                  !selectedEventTitle.trim() || isScanning
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-[#20B2AA] text-white hover:bg-[#1a9b9b] shadow-lg'
                }`}
              >
                {isScanning ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Scanning...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Start Scanning
                  </>
                )}
              </button>
              
              <button
                onClick={stopScanning}
                disabled={!isScanning}
                className={`flex items-center justify-center px-6 py-4 rounded-xl font-semibold transition-all transform hover:scale-105 ${
                  !isScanning
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-red-500 text-white hover:bg-red-600 shadow-lg'
                }`}
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Stop Scanning
              </button>

              {scannedStudents.length > 0 && (
                <button
                  onClick={exportAttendance}
                  className="flex items-center justify-center px-6 py-4 bg-green-500 text-white rounded-xl font-semibold hover:bg-green-600 transition-all transform hover:scale-105 shadow-lg"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Export CSV
                </button>
              )}
            </div>

            {/* Status Messages */}
            {error && (
              <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-xl">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-red-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-red-800 font-medium">{error}</p>
                </div>
              </div>
            )}
            
            {success && (
              <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-xl">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-green-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <p className="text-green-800 font-medium">{success}</p>
                </div>
              </div>
            )}
          </div>

          {/* Hidden Video Element - Always present for ref */}
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="hidden"
          />

          {/* Camera View */}
          {isScanning && (
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mb-6">
              <div className="flex items-center mb-6">
                <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center mr-3">
                  <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Live Camera Feed</h3>
                  <p className="text-sm text-gray-600">Point camera at student QR codes</p>
                </div>
              </div>
              
              <div className="max-w-4xl mx-auto">
                {/* Professional Camera Container */}
                <div className="relative bg-black rounded-2xl overflow-hidden shadow-2xl">
                  {/* Video Element */}
                  <video
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-80 sm:h-96 object-cover"
                  />
                  
                  {/* Professional Scanning Overlay */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className={`w-72 h-72 sm:w-80 sm:h-80 border-2 rounded-2xl transition-all duration-500 ${
                      qrDetected 
                        ? 'border-green-400 bg-green-400/10 shadow-green-400/20' 
                        : 'border-white/70 shadow-white/10'
                    }`}>
                      {/* Professional Corner Indicators */}
                      <div className={`absolute -top-2 -left-2 w-8 h-8 border-l-4 border-t-4 rounded-tl-2xl transition-all duration-300 ${
                        qrDetected ? 'border-green-400' : 'border-white'
                      }`}></div>
                      <div className={`absolute -top-2 -right-2 w-8 h-8 border-r-4 border-t-4 rounded-tr-2xl transition-all duration-300 ${
                        qrDetected ? 'border-green-400' : 'border-white'
                      }`}></div>
                      <div className={`absolute -bottom-2 -left-2 w-8 h-8 border-l-4 border-b-4 rounded-bl-2xl transition-all duration-300 ${
                        qrDetected ? 'border-green-400' : 'border-white'
                      }`}></div>
                      <div className={`absolute -bottom-2 -right-2 w-8 h-8 border-r-4 border-b-4 rounded-br-2xl transition-all duration-300 ${
                        qrDetected ? 'border-green-400' : 'border-white'
                      }`}></div>
                      
                      {/* Success Animation */}
                      {qrDetected && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center animate-pulse shadow-lg">
                            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Professional Status Bar */}
                  <div className="absolute top-6 left-6">
                    <div className={`px-4 py-2 rounded-full text-sm font-semibold shadow-lg transition-all duration-300 ${
                      qrDetected 
                        ? 'bg-green-500 text-white animate-pulse' 
                        : 'bg-orange-500 text-white'
                    }`}>
                      <div className="flex items-center">
                        {qrDetected ? (
                          <>
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            QR Detected!
                          </>
                        ) : (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Scanning...
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Professional Instructions */}
                  <div className="absolute bottom-6 left-6 right-6">
                    <div className="bg-black/80 backdrop-blur-sm text-white px-4 py-3 rounded-xl text-center font-medium">
                      {qrDetected ? 'QR Code Found! Processing...' : 'Point camera at student QR code to scan'}
                    </div>
                  </div>
                </div>

                {/* Professional Controls */}
                <div className="mt-8 flex justify-center">
                  <button
                    onClick={stopScanning}
                    className="flex items-center px-8 py-4 bg-red-500 hover:bg-red-600 text-white rounded-xl font-semibold transition-all transform hover:scale-105 shadow-lg"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Stop Scanning
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* QR Detection Modal */}
        {showQRModal && detectedStudent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 transform transition-all">
              <div className="p-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mr-4">
                      <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">QR Code Detected</h3>
                      <p className="text-sm text-gray-600">
                        Recording: <span className="font-semibold text-[#20B2AA]">
                          {attendanceType === 'time_in' ? 'Time In' : 'Time Out'}
                        </span>
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={closeQRModal}
                    className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-lg"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Student Info */}
                <div className="text-center mb-8">
                  <div className="w-24 h-24 bg-gradient-to-br from-[#20B2AA] to-[#1a9b9b] rounded-full mx-auto mb-6 flex items-center justify-center shadow-lg">
                    {detectedStudent.profile_picture ? (
                      <img
                        src={detectedStudent.profile_picture}
                        alt="Profile"
                        className="w-20 h-20 rounded-full object-cover border-4 border-white"
                      />
                    ) : (
                      <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  
                  <h4 className="text-2xl font-bold text-gray-900 mb-3">
                    {detectedStudent.first_name} {detectedStudent.last_name}
                  </h4>
                  
                  <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-600">Student ID:</span>
                      <span className="text-sm font-semibold text-gray-900">{detectedStudent.student_id}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-600">Year:</span>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {detectedStudent.year}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-600">Event:</span>
                      <span className="text-sm font-semibold text-gray-900 truncate ml-2">{selectedEventTitle}</span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-4">
                  <button
                    onClick={closeQRModal}
                    className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 hover:border-gray-400 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={approveAttendance}
                    disabled={isProcessing}
                    className={`flex-1 px-6 py-3 rounded-xl font-semibold transition-all transform hover:scale-105 ${
                      isProcessing
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-[#20B2AA] text-white hover:bg-[#1a9b9b] shadow-lg'
                    }`}
                  >
                    {isProcessing ? (
                      <div className="flex items-center justify-center space-x-2">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        <span>Recording...</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center space-x-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span>Approve & Record {attendanceType === 'time_in' ? 'Time In' : 'Time Out'}</span>
                      </div>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AuthGuard>
  );
}
