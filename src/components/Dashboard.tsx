import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';
import ActivityCard from './ActivityCard';
import WorkoutPlanGenerator from './WorkoutPlanGenerator';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Footprints, Flame, Clock, Moon, Dumbbell, TrendingUp, LogOut, Play, Square } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { useStepTracking } from '@/hooks/useStepTracking';

interface DashboardProps {
  user: User;
}

const Dashboard = ({ user }: DashboardProps) => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [todayActivity, setTodayActivity] = useState<any>(null);
  const [weekActivities, setWeekActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Use automatic step tracking
  const { 
    steps, 
    isTracking, 
    hasPermission, 
    error, 
    requestPermission, 
    stopTracking 
  } = useStepTracking(user);

  useEffect(() => {
    fetchProfile();
    fetchTodayActivity();
    fetchWeekActivities();
  }, [user]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      setProfile(data);

      // If profile incomplete, redirect to onboarding
      if (!data?.fitness_goal || !data?.fitness_level) {
        navigate('/onboarding');
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTodayActivity = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      let { data, error } = await supabase
        .from('activities')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', today)
        .single();

      if (error && error.code === 'PGRST116') {
        // No activity for today, create one with initial values
        const { data: newData, error: insertError } = await supabase
          .from('activities')
          .insert({
            user_id: user.id,
            date: today,
            steps: 0,
            calories_burned: 0,
            active_minutes: 0,
            sleep_hours: 0,
          })
          .select()
          .single();

        if (insertError) throw insertError;
        data = newData;
      } else if (error) {
        throw error;
      }

      setTodayActivity(data);
    } catch (error) {
      console.error('Error fetching today activity:', error);
    }
  };

  const fetchWeekActivities = async () => {
    try {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const { data, error } = await supabase
        .from('activities')
        .select('*')
        .eq('user_id', user.id)
        .gte('date', weekAgo.toISOString().split('T')[0])
        .order('date', { ascending: true });

      if (error) throw error;
      setWeekActivities(data || []);
    } catch (error) {
      console.error('Error fetching week activities:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast.success('Logged out successfully');
      navigate('/auth');
    } catch (error) {
      toast.error('Error logging out');
      console.error('Logout error:', error);
    }
  };

  if (loading || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">Loading your fitness data...</p>
        </div>
      </div>
    );
  }

  const stepsGoal = 10000;
  const caloriesGoal = 500;
  const activeMinutesGoal = 60;

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2 text-black">
              Welcome back, <span className="text-black">{profile.full_name || 'Athlete'}</span>
            </h1>
            <p className="text-black">Let's crush your fitness goals today!</p>
          </div>
          <Button onClick={handleLogout} variant="outline" size="icon">
            <LogOut className="w-4 h-4" />
          </Button>
        </div>

        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList>
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="workout">Workout Plans</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            {/* Auto Tracking Control */}
            <div className="mb-4">
              <Card className="shadow-card">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-black mb-1">Automatic Step Tracking</h3>
                      <p className="text-sm text-muted-foreground">
                        {isTracking ? 'Tracking your steps automatically' : 'Enable tracking to count your steps as you walk'}
                      </p>
                    </div>
                    {!isTracking ? (
                      <Button onClick={requestPermission} className="gradient-primary">
                        <Play className="w-4 h-4 mr-2" />
                        Start Tracking
                      </Button>
                    ) : (
                      <Button onClick={stopTracking} variant="outline">
                        <Square className="w-4 h-4 mr-2" />
                        Stop Tracking
                      </Button>
                    )}
                  </div>
                  {error && (
                    <p className="text-sm text-red-500 mt-2">{error}</p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Today's Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <ActivityCard
                title="Steps"
                value={todayActivity?.steps || steps || 0}
                unit="steps"
                icon={Footprints}
                gradient="gradient-primary"
                progress={((todayActivity?.steps || steps || 0) / stepsGoal) * 100}
              />
              <ActivityCard
                title="Calories Burned"
                value={Math.floor((todayActivity?.steps || steps || 0) * 0.04)}
                unit="kcal"
                icon={Flame}
                gradient="gradient-accent"
                progress={(Math.floor((todayActivity?.steps || steps || 0) * 0.04) / caloriesGoal) * 100}
              />
              <ActivityCard
                title="Active Minutes"
                value={Math.floor((todayActivity?.steps || steps || 0) / 100)}
                unit="min"
                icon={Clock}
                gradient="gradient-success"
                progress={(Math.floor((todayActivity?.steps || steps || 0) / 100) / activeMinutesGoal) * 100}
              />
              <ActivityCard
                title="Sleep"
                value={todayActivity?.sleep_hours || 0}
                unit="hours"
                icon={Moon}
                gradient="gradient-primary"
              />
            </div>

            {/* 7-Day Trends */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-black">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  7-Day Activity Trends
                </CardTitle>
              </CardHeader>
              <CardContent>
                {weekActivities.length > 0 ? (
                  <div className="space-y-3">
                    {weekActivities.map((activity) => (
                      <div key={activity.id} className="flex items-center gap-4">
                        <span className="text-sm text-black w-20">
                          {new Date(activity.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                        </span>
                        <div className="flex-1 space-y-1">
                          <div className="flex justify-between text-xs text-black">
                            <span>Steps: {activity.steps}</span>
                            <span>Cal: {activity.calories_burned}</span>
                            <span>Active: {activity.active_minutes}m</span>
                          </div>
                          <div className="h-2 bg-secondary rounded-full overflow-hidden">
                            <div
                              className="h-full gradient-primary rounded-full"
                              style={{ width: `${(activity.steps / stepsGoal) * 100}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-black py-8">No activity data yet. Start tracking today!</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="workout" className="space-y-6">
            <WorkoutPlanGenerator profile={profile} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Dashboard;