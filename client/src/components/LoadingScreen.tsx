'use client';

import Image from 'next/image';

interface LoadingScreenProps {
  isVisible: boolean;
  message?: string;
}

export default function LoadingScreen({ isVisible, message = 'Loading...' }: LoadingScreenProps) {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 backdrop-blur-md z-50 flex items-center justify-center">
      <Image
        src="/loading.gif"
        alt="Loading"
        width={120}
        height={120}
        className="mx-auto"
        style={{ filter: 'drop-shadow(0 0 10px rgba(0, 0, 0, 0.8))' }}
        unoptimized
      />
    </div>
  );
}
