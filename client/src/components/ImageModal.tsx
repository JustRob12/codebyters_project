'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

interface Picture {
  id: number;
  picture_url: string;
  picture_order: number;
}

interface ImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  pictures: Picture[];
  currentIndex: number;
  eventTitle: string;
  eventDescription: string;
  eventDate: string;
}

export default function ImageModal({
  isOpen,
  onClose,
  pictures,
  currentIndex,
  eventTitle,
  eventDescription,
  eventDate
}: ImageModalProps) {
  const [activeIndex, setActiveIndex] = useState(currentIndex);
  const [imageScale, setImageScale] = useState(1);
  const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    setActiveIndex(currentIndex);
  }, [currentIndex]);

  const nextImage = () => {
    setActiveIndex((prev) => (prev + 1) % pictures.length);
  };

  const prevImage = () => {
    setActiveIndex((prev) => (prev - 1 + pictures.length) % pictures.length);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
    if (e.key === 'ArrowLeft') prevImage();
    if (e.key === 'ArrowRight') nextImage();
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setImageScale(prev => Math.max(0.5, Math.min(3, prev * delta)));
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      e.preventDefault();
    }
  };

  const handleDoubleClick = () => {
    resetImageTransform();
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      e.preventDefault();
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = Math.sqrt(
        Math.pow(touch2.clientX - touch1.clientX, 2) +
        Math.pow(touch2.clientY - touch1.clientY, 2)
      );
      
      if (distance > 0) {
        const scale = Math.min(3, Math.max(0.5, distance / 200));
        setImageScale(scale);
      }
    }
  };

  const resetImageTransform = () => {
    setImageScale(1);
    setImagePosition({ x: 0, y: 0 });
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center"
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white hover:text-gray-300 z-10 bg-black bg-opacity-50 rounded-full p-2"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <div className="flex w-full h-full max-w-7xl mx-4">
        {/* Image Section - Full width on mobile, flex-1 on desktop */}
        <div className="w-full lg:flex-1 flex items-center justify-center relative">
          {pictures.length > 1 && (
            <>
              {/* Left Arrow */}
              <button
                onClick={prevImage}
                className="absolute left-2 lg:left-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-70 hover:bg-opacity-90 text-white p-3 rounded-full transition-all z-10 shadow-lg"
              >
                <svg className="w-6 h-6 lg:w-8 lg:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              {/* Right Arrow */}
              <button
                onClick={nextImage}
                className="absolute right-2 lg:right-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-70 hover:bg-opacity-90 text-white p-3 rounded-full transition-all z-10 shadow-lg"
              >
                <svg className="w-6 h-6 lg:w-8 lg:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </>
          )}

          {/* Main Image */}
          <div 
            className="w-full h-full flex items-center justify-center overflow-hidden"
            onWheel={handleWheel}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
          >
            <Image
              src={pictures[activeIndex].picture_url}
              alt={`${eventTitle} ${activeIndex + 1}`}
              width={0}
              height={0}
              sizes="100vw"
              className="max-w-full max-h-full object-contain transition-transform duration-200 cursor-zoom-in"
              style={{
                transform: `scale(${imageScale}) translate(${imagePosition.x}px, ${imagePosition.y}px)`,
                transformOrigin: 'center center'
              }}
              onDoubleClick={handleDoubleClick}
              unoptimized
              onLoad={(e) => {
                const img = e.target as HTMLImageElement;
                const aspectRatio = img.naturalWidth / img.naturalHeight;
                
                // Reset transform when new image loads
                resetImageTransform();
                
                // For landscape images (aspect ratio > 1), use full width
                if (aspectRatio > 1) {
                  img.className = "max-w-full max-h-full w-full h-auto object-contain transition-transform duration-200";
                } else {
                  // For portrait images, use full height
                  img.className = "max-w-full max-h-full w-auto h-full object-contain transition-transform duration-200";
                }
              }}
            />
          </div>

          {/* Image Counter */}
          {pictures.length > 1 && (
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-70 text-white px-4 py-2 rounded-full text-sm font-medium shadow-lg">
              {activeIndex + 1} / {pictures.length}
            </div>
          )}

          {/* Navigation Hint */}
          {pictures.length > 1 && (
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-70 text-white px-3 py-1 rounded-full text-xs opacity-75">
              Use arrows or swipe to navigate
            </div>
          )}
        </div>

        {/* Details Sidebar - Hidden on mobile, visible on desktop */}
        <div className="hidden lg:flex w-96 xl:w-[28rem] bg-white flex-col h-full">
          {/* Event Header */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-[#20B2AA] rounded-full flex items-center justify-center">
                <Image
                  src="/codebyterslogo.png"
                  alt="Codebyters"
                  width={24}
                  height={24}
                  className="rounded-full"
                  unoptimized
                />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Codebyters</h4>
                <p className="text-sm text-gray-500">{new Date(eventDate).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}</p>
              </div>
            </div>
          </div>

          {/* Event Content */}
          <div className="flex-1 p-6 overflow-y-auto">
            <h3 className="font-bold text-xl text-gray-900 mb-3">{eventTitle}</h3>
            <p className="text-gray-700 mb-6 leading-relaxed">{eventDescription}</p>
            
            {/* Image Details */}
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <h4 className="font-semibold text-gray-900 mb-2">Image {activeIndex + 1} of {pictures.length}</h4>
              <p className="text-sm text-gray-600 mb-3">
                Click the arrows to navigate through all images in this event.
              </p>
              <div className="flex space-x-2">
                {pictures.map((_, index) => (
                  <div
                    key={index}
                    className={`w-2 h-2 rounded-full ${
                      index === activeIndex ? 'bg-[#20B2AA]' : 'bg-gray-300'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Event Stats */}
            <div className="bg-blue-50 rounded-lg p-4 mb-4">
              <h4 className="font-semibold text-gray-900 mb-2">Event Information</h4>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center space-x-2">
                  <svg className="w-4 h-4 text-[#20B2AA]" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                  </svg>
                  <span>Posted {new Date(eventDate).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <svg className="w-4 h-4 text-[#20B2AA]" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                  </svg>
                  <span>{pictures.length} image{pictures.length > 1 ? 's' : ''} in this event</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="p-6 border-t border-gray-200 bg-gray-50">
            <div className="flex justify-between items-center">
              <div className="flex space-x-6">
                <button className="flex items-center space-x-2 text-gray-600 hover:text-[#20B2AA] transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                  <span className="font-medium">Like</span>
                </button>
                <button className="flex items-center space-x-2 text-gray-600 hover:text-[#20B2AA] transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <span className="font-medium">Comment</span>
                </button>
                <button className="flex items-center space-x-2 text-gray-600 hover:text-[#20B2AA] transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                  </svg>
                  <span className="font-medium">Share</span>
                </button>
              </div>
              <button className="text-gray-400 hover:text-gray-600 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
