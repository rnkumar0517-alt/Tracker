import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';

interface StepTrackingData {
  steps: number;
  isTracking: boolean;
  hasPermission: boolean;
  error: string | null;
}

export const useStepTracking = (user: User | null) => {
  const [data, setData] = useState<StepTrackingData>({
    steps: 0,
    isTracking: false,
    hasPermission: false,
    error: null
  });

  const stepCountRef = useRef(0);
  const lastStepTimeRef = useRef(0);
  const accelerometerRef = useRef<Accelerometer | null>(null);
  const gyroscopeRef = useRef<Gyroscope | null>(null);
  const lastUpdateRef = useRef(0);

  // Step detection algorithm
  const detectStep = (acceleration: { x: number; y: number; z: number }) => {
    const magnitude = Math.sqrt(
      acceleration.x * acceleration.x +
      acceleration.y * acceleration.y +
      acceleration.z * acceleration.z
    );

    const now = Date.now();
    const timeDiff = now - lastStepTimeRef.current;

    // Basic step detection: magnitude threshold and time between steps
    if (magnitude > 1.2 && timeDiff > 300) { // 300ms minimum between steps
      stepCountRef.current++;
      lastStepTimeRef.current = now;
      
      // Update UI immediately
      setData(prev => ({ ...prev, steps: stepCountRef.current }));
      
      // Save to database every 10 steps to avoid too many API calls
      if (stepCountRef.current % 10 === 0) {
        updateStepsInDatabase(stepCountRef.current);
      }
    }
  };

  const updateStepsInDatabase = async (steps: number) => {
    if (!user) return;

    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Check if activity exists for today
      const { data: existingActivity, error: fetchError } = await supabase
        .from('activities')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', today)
        .single();

      if (fetchError && fetchError.code === 'PGRST116') {
        // Create new activity record
        await supabase
          .from('activities')
          .insert({
            user_id: user.id,
            date: today,
            steps: steps,
            calories_burned: Math.floor(steps * 0.04), // Approximate calories
            active_minutes: Math.floor(steps / 100), // Approximate active minutes
            sleep_hours: 0,
          });
      } else if (!fetchError) {
        // Update existing record
        await supabase
          .from('activities')
          .update({
            steps: steps,
            calories_burned: Math.floor(steps * 0.04),
            active_minutes: Math.floor(steps / 100),
            updated_at: new Date().toISOString()
          })
          .eq('user_id', user.id)
          .eq('date', today);
      }
    } catch (error) {
      console.error('Error updating steps in database:', error);
    }
  };

  const requestPermission = async () => {
    try {
      // Check if DeviceMotionEvent is supported
      if (!('DeviceMotionEvent' in window)) {
        throw new Error('Device motion not supported on this device');
      }

      // Request permission for motion sensors
      if ('requestPermission' in DeviceMotionEvent) {
        const permission = await (DeviceMotionEvent as any).requestPermission();
        if (permission !== 'granted') {
          throw new Error('Motion sensor permission denied');
        }
      }

      // Try to use Accelerometer API (newer browsers)
      if ('Accelerometer' in window) {
        const accelerometer = new Accelerometer({ frequency: 60 });
        accelerometer.addEventListener('reading', () => {
          detectStep({
            x: accelerometer.x || 0,
            y: accelerometer.y || 0,
            z: accelerometer.z || 0
          });
        });
        
        accelerometer.start();
        accelerometerRef.current = accelerometer;
        
        setData(prev => ({
          ...prev,
          isTracking: true,
          hasPermission: true,
          error: null
        }));
      } else {
        // Fallback to DeviceMotionEvent
        const handleMotion = (event: DeviceMotionEvent) => {
          if (event.acceleration) {
            detectStep({
              x: event.acceleration.x || 0,
              y: event.acceleration.y || 0,
              z: event.acceleration.z || 0
            });
          }
        };

        window.addEventListener('devicemotion', handleMotion);
        
        setData(prev => ({
          ...prev,
          isTracking: true,
          hasPermission: true,
          error: null
        }));
      }
    } catch (error) {
      setData(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to start tracking'
      }));
    }
  };

  const stopTracking = () => {
    if (accelerometerRef.current) {
      accelerometerRef.current.stop();
      accelerometerRef.current = null;
    }
    
    if (gyroscopeRef.current) {
      gyroscopeRef.current.stop();
      gyroscopeRef.current = null;
    }

    window.removeEventListener('devicemotion', () => {});
    
    setData(prev => ({
      ...prev,
      isTracking: false
    }));
  };

  const loadTodaySteps = async () => {
    if (!user) return;

    try {
      const today = new Date().toISOString().split('T')[0];
      const { data: activity, error } = await supabase
        .from('activities')
        .select('steps')
        .eq('user_id', user.id)
        .eq('date', today)
        .single();

      if (!error && activity) {
        stepCountRef.current = activity.steps || 0;
        setData(prev => ({ ...prev, steps: activity.steps || 0 }));
      }
    } catch (error) {
      console.error('Error loading today steps:', error);
    }
  };

  useEffect(() => {
    if (user) {
      loadTodaySteps();
    }
  }, [user]);

  useEffect(() => {
    return () => {
      stopTracking();
    };
  }, []);

  return {
    ...data,
    requestPermission,
    stopTracking,
    startTracking: requestPermission
  };
};
