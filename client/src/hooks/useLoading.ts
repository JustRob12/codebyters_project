'use client';

import { useState, useCallback } from 'react';

interface LoadingState {
  isLoading: boolean;
  message: string;
}

export function useLoading() {
  const [loadingState, setLoadingState] = useState<LoadingState>({
    isLoading: false,
    message: 'Loading...'
  });

  const startLoading = useCallback((message: string = 'Loading...') => {
    setLoadingState({
      isLoading: true,
      message
    });
  }, []);

  const stopLoading = useCallback(() => {
    setLoadingState({
      isLoading: false,
      message: 'Loading...'
    });
  }, []);

  const setLoadingMessage = useCallback((message: string) => {
    setLoadingState(prev => ({
      ...prev,
      message
    }));
  }, []);

  return {
    isLoading: loadingState.isLoading,
    message: loadingState.message,
    startLoading,
    stopLoading,
    setLoadingMessage
  };
}
