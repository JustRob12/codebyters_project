'use client';

import { useGlobalLoading } from '@/contexts/LoadingContext';
import LoadingScreen from './LoadingScreen';

export default function GlobalLoadingOverlay() {
  const { isLoading, message } = useGlobalLoading();
  
  return <LoadingScreen isVisible={isLoading} message={message} />;
}
