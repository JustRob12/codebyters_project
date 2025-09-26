'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminDashboardHeader from '@/components/AdminDashboardHeader';
import { supabase } from '@/lib/supabase';
import AuthGuard from '@/components/AuthGuard';
import jsQR from 'jsqr';

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
                  stopScanning()
                  return
                }
              }
            } catch (error) {
              setError('Invalid QR code format - not valid JSON or CODEX format')
              stopScanning()
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
          return;
        }
        
        if (attendanceType === 'time_out' && existingRecord.time_out) {
          setError(`Student ${userData.first_name} ${userData.last_name} already has a time out recorded for this event.`);
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
      setIsScanning(false); // Stop scanning when QR is detected

    } catch (error) {
      console.error('Error processing QR code:', error);
      setError('Failed to process QR code. Please try again.');
    }
  };

  // Show modal with detected student information (legacy function for CODEX format)
  const showQRModalWithStudent = (qrData: string) => {
    try {
      // Parse QR code data (format: first_name|last_name|student_id|year|profile_picture|CODEX)
      const parts = qrData.split('|');
      
      if (parts.length < 5 || parts[5] !== 'CODEX') {
        setError('Invalid QR code. Please scan a valid CODEX QR code.');
        return;
      }

      const [first_name, last_name, student_id, year, profile_picture] = parts;

      // Check if student is already recorded for this event
      const existingRecord = scannedStudents.find(
        record => record.student_id === student_id && record.event_title === selectedEventTitle
      );

      if (existingRecord) {
        setError(`Student ${first_name} ${last_name} is already recorded for this event.`);
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
      setIsScanning(false); // Stop scanning when QR is detected

    } catch (error) {
      console.error('Error processing QR code:', error);
      setError('Failed to process QR code. Please try again.');
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
      <div className="min-h-screen bg-gray-50">
        <AdminDashboardHeader />
        
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Attendance Scanner</h1>
            <p className="text-gray-600">Scan CODEX QR codes to record student attendance for events.</p>
          </div>

          {/* Event Selection */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <label htmlFor="eventSelect" className="block text-sm font-medium text-gray-700 mb-2">
              Select Event
            </label>
            {loadingEvents ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#20B2AA]"></div>
                <span className="text-sm text-gray-600">Loading events...</span>
              </div>
            ) : (
              <select
                id="eventSelect"
                value={selectedEventId || ''}
                onChange={(e) => handleEventChange(parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#20B2AA] focus:border-transparent"
                disabled={isScanning}
              >
                <option value="">Select an event...</option>
                {events.map((event) => (
                  <option key={event.id} value={event.id}>
                    {event.title} - {new Date(event.event_date).toLocaleDateString()}
                  </option>
                ))}
              </select>
            )}
            {selectedEventTitle && (
              <div className="mt-2 text-sm text-gray-600">
                Selected: <span className="font-medium">{selectedEventTitle}</span>
              </div>
            )}
          </div>

          {/* Attendance Type Selection */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Attendance Type
            </label>
            <div className="flex space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="attendanceType"
                  value="time_in"
                  checked={attendanceType === 'time_in'}
                  onChange={(e) => setAttendanceType(e.target.value as 'time_in' | 'time_out')}
                  className="mr-2 text-[#20B2AA] focus:ring-[#20B2AA]"
                  disabled={isScanning}
                />
                <span className="text-sm font-medium text-gray-700">Time In</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="attendanceType"
                  value="time_out"
                  checked={attendanceType === 'time_out'}
                  onChange={(e) => setAttendanceType(e.target.value as 'time_in' | 'time_out')}
                  className="mr-2 text-[#20B2AA] focus:ring-[#20B2AA]"
                  disabled={isScanning}
                />
                <span className="text-sm font-medium text-gray-700">Time Out</span>
              </label>
            </div>
            <p className="mt-2 text-xs text-gray-500">
              {attendanceType === 'time_in' 
                ? 'Students will be marked as present when they scan their QR code'
                : 'Students will be marked as leaving when they scan their QR code'
              }
            </p>
          </div>

          {/* Scanner Controls */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={startScanning}
                  disabled={!selectedEventTitle.trim() || isScanning}
                  className={`px-6 py-3 rounded-md font-medium transition-colors ${
                    !selectedEventTitle.trim() || isScanning
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-[#20B2AA] text-white hover:bg-[#1a9b9b]'
                  }`}
                >
                  {isScanning ? 'Scanning...' : 'Start Scanning'}
                </button>
                
                <button
                  onClick={stopScanning}
                  disabled={!isScanning}
                  className={`px-6 py-3 rounded-md font-medium transition-colors ${
                    !isScanning
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-red-600 text-white hover:bg-red-700'
                  }`}
                >
                  Stop Scanning
                </button>
              </div>

              {scannedStudents.length > 0 && (
                <button
                  onClick={exportAttendance}
                  className="px-6 py-3 bg-green-600 text-white rounded-md font-medium hover:bg-green-700 transition-colors"
                >
                  Export CSV
                </button>
              )}
            </div>

            {/* Messages */}
            {error && (
              <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-md">
                {error}
              </div>
            )}
            
            {success && (
              <div className="mt-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded-md">
                {success}
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
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Camera View</h3>
              <div className="max-w-2xl mx-auto">
                {/* Simple Camera Container */}
                <div className="relative bg-black rounded-xl overflow-hidden">
                  {/* Video Element */}
                  <video
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-96 object-cover"
                  />
                  
                  {/* Simple Scanning Overlay */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className={`w-64 h-64 border-2 rounded-lg transition-all duration-300 ${
                      qrDetected 
                        ? 'border-green-400 bg-green-400/10' 
                        : 'border-white/60'
                    }`}>
                      {/* Simple Corner Indicators */}
                      <div className={`absolute -top-1 -left-1 w-6 h-6 border-l-2 border-t-2 rounded-tl-lg ${
                        qrDetected ? 'border-green-400' : 'border-white'
                      }`}></div>
                      <div className={`absolute -top-1 -right-1 w-6 h-6 border-r-2 border-t-2 rounded-tr-lg ${
                        qrDetected ? 'border-green-400' : 'border-white'
                      }`}></div>
                      <div className={`absolute -bottom-1 -left-1 w-6 h-6 border-l-2 border-b-2 rounded-bl-lg ${
                        qrDetected ? 'border-green-400' : 'border-white'
                      }`}></div>
                      <div className={`absolute -bottom-1 -right-1 w-6 h-6 border-r-2 border-b-2 rounded-br-lg ${
                        qrDetected ? 'border-green-400' : 'border-white'
                      }`}></div>
                      
                      {/* Success Checkmark */}
                      {qrDetected && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center">
                            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Simple Status Bar */}
                  <div className="absolute top-4 left-4">
                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                      qrDetected 
                        ? 'bg-green-500 text-white' 
                        : 'bg-orange-500 text-white'
                    }`}>
                      {qrDetected ? 'QR Detected!' : 'Scanning...'}
                    </div>
                  </div>
                  
                  {/* Simple Instructions */}
                  <div className="absolute bottom-4 left-4 right-4">
                    <div className="bg-black/70 text-white px-3 py-2 rounded-lg text-sm text-center">
                      {qrDetected ? 'QR Code Found!' : 'Point camera at student QR code'}
                    </div>
                  </div>
                </div>

                {/* Simple Controls */}
                <div className="mt-6 flex justify-center">
                  <button
                    onClick={stopScanning}
                    className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors"
                  >
                    Stop Scanning
                  </button>
                </div>
                
                {/* Test button for development */}
                <div className="mt-4 text-center">
                  <button
                    onClick={() => {
                      const testQRData = 'Roberto|Prisoris|2022-2703|4th Year|https://res.cloudinary.com/dqhfbkdea/image/upload/v1758447497/f2audlxhf8ni3z73ke5j.jpg|CODEX';
                      handleScannedData(testQRData);
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
                  >
                    Test QR Detection
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Attendance Records */}
          {selectedEventTitle && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">
                  Attendance Records ({scannedStudents.length})
                </h3>
                <p className="text-sm text-gray-600">Event: {selectedEventTitle}</p>
              </div>
              
              {scannedStudents.length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  No attendance records yet. Start scanning to record attendance.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Student ID
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Year
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Time In
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Time Out
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {scannedStudents.map((record) => (
                        <tr key={record.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {record.student_id}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {record.first_name} {record.middle_initial} {record.last_name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {record.year}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {record.time_in ? new Date(record.time_in).toLocaleString() : '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {record.time_out ? new Date(record.time_out).toLocaleString() : '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button
                              onClick={() => deleteAttendanceRecord(record.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>

        {/* QR Detection Modal */}
        {showQRModal && detectedStudent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">QR Code Detected</h3>
                    <p className="text-sm text-gray-600">
                      Recording: <span className="font-medium text-[#20B2AA]">
                        {attendanceType === 'time_in' ? 'Time In' : 'Time Out'}
                      </span>
                    </p>
                  </div>
                  <button
                    onClick={closeQRModal}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="text-center mb-6">
                  <div className="w-20 h-20 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                    {detectedStudent.profile_picture ? (
                      <img
                        src={detectedStudent.profile_picture}
                        alt="Profile"
                        className="w-16 h-16 rounded-full object-cover"
                      />
                    ) : (
                      <svg className="w-8 h-8 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  
                  <h4 className="text-xl font-semibold text-gray-900 mb-2">
                    {detectedStudent.first_name} {detectedStudent.last_name}
                  </h4>
                  
                  <div className="space-y-2 text-sm text-gray-600">
                    <p><span className="font-medium">Student ID:</span> {detectedStudent.student_id}</p>
                    <p><span className="font-medium">Year:</span> {detectedStudent.year}</p>
                    <p><span className="font-medium">Event:</span> {selectedEventTitle}</p>
                  </div>
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={closeQRModal}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={approveAttendance}
                    disabled={isProcessing}
                    className={`flex-1 px-4 py-2 rounded-md font-medium transition-colors ${
                      isProcessing
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-[#20B2AA] text-white hover:bg-[#1a9b9b]'
                    }`}
                  >
                    {isProcessing ? (
                      <div className="flex items-center justify-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Recording...</span>
                      </div>
                    ) : (
                      `Approve & Record ${attendanceType === 'time_in' ? 'Time In' : 'Time Out'}`
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
