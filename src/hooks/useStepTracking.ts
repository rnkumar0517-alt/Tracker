import { useState, useEffect, useCallback } from 'react';
import { User } from '@supabase/supabase-js';

interface StepTrackingState {
  steps: number;
  isTracking: boolean;
  hasPermission: boolean;
  error: string | null;
}

interface StepTrackingActions {
  requestPermission: () => Promise<void>;
  stopTracking: () => void;
}

export const useStepTracking = (user: User): StepTrackingState & StepTrackingActions => {
  const [steps, setSteps] = useState<number>(0);
  const [isTracking, setIsTracking] = useState<boolean>(false);
  const [hasPermission, setHasPermission] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Check if device supports step counting
  const checkSupport = useCallback(() => {
    if (!('DeviceMotionEvent' in window)) {
      setError('Step tracking not supported on this device');
      return false;
    }
    return true;
  }, []);

  // Request permission for motion sensors
  const requestPermission = useCallback(async () => {
    try {
      setError(null);
      
      if (!checkSupport()) {
        return;
      }

      // Request permission for device motion
      if (typeof DeviceMotionEvent.requestPermission === 'function') {
        const permission = await DeviceMotionEvent.requestPermission();
        if (permission !== 'granted') {
          setError('Permission denied for motion sensors');
          return;
        }
      }

      setHasPermission(true);
      setIsTracking(true);
      
      // Start tracking steps
      startStepTracking();
    } catch (err) {
      setError('Failed to request permission');
      console.error('Permission request error:', err);
    }
  }, [checkSupport]);

  // Stop tracking
  const stopTracking = useCallback(() => {
    setIsTracking(false);
    // Remove event listeners
    window.removeEventListener('devicemotion', handleMotion);
  }, []);

  // Handle device motion for step detection
  const handleMotion = useCallback((event: DeviceMotionEvent) => {
    if (!isTracking) return;

    const acceleration = event.acceleration;
    if (!acceleration) return;

    // Simple step detection based on acceleration changes
    const magnitude = Math.sqrt(
      Math.pow(acceleration.x || 0, 2) +
      Math.pow(acceleration.y || 0, 2) +
      Math.pow(acceleration.z || 0, 2)
    );

    // Threshold for step detection (adjust as needed)
    const stepThreshold = 1.5;
    
    if (magnitude > stepThreshold) {
      setSteps(prev => prev + 1);
    }
  }, [isTracking]);

  // Start step tracking
  const startStepTracking = useCallback(() => {
    if (!hasPermission || !isTracking) return;

    // Add motion event listener
    window.addEventListener('devicemotion', handleMotion, { passive: true });
  }, [hasPermission, isTracking, handleMotion]);

  // Initialize tracking when permission is granted and tracking is enabled
  useEffect(() => {
    if (hasPermission && isTracking) {
      startStepTracking();
    }
  }, [hasPermission, isTracking, startStepTracking]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      window.removeEventListener('devicemotion', handleMotion);
    };
  }, [handleMotion]);

  return {
    steps,
    isTracking,
    hasPermission,
    error,
    requestPermission,
    stopTracking,
  };
};

