import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dumbbell, Sparkles, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

interface WorkoutPlanGeneratorProps {
  profile: any;
}

const WorkoutPlanGenerator = ({ profile }: WorkoutPlanGeneratorProps) => {
  const [loading, setLoading] = useState(false);
  const [workoutPlans, setWorkoutPlans] = useState<any[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(true);

  useEffect(() => {
    fetchWorkoutPlans();
  }, []);

  const fetchWorkoutPlans = async () => {
    try {
      const { data, error } = await supabase
        .from('workout_plans')
        .select('*')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setWorkoutPlans(data || []);
    } catch (error) {
      console.error('Error fetching workout plans:', error);
    } finally {
      setLoadingPlans(false);
    }
  };

  const generatePlan = async () => {
    if (!profile.fitness_goal || !profile.fitness_level) {
      toast.error('Please complete your profile first');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-workout-plan', {
        body: {
          goal: profile.fitness_goal,
          fitnessLevel: profile.fitness_level,
          availableTime: profile.available_time || 30,
        },
      });

      if (error) throw error;

      const { plan_name, workouts } = data;

      // Save to database
      const { error: insertError } = await supabase.from('workout_plans').insert({
        user_id: profile.id,
        plan_name,
        goal: profile.fitness_goal,
        difficulty_level: profile.fitness_level,
        workouts,
      });

      if (insertError) throw insertError;

      toast.success('Workout plan generated!');
      fetchWorkoutPlans();
    } catch (error: any) {
      console.error('Error generating workout plan:', error);
      if (error.message?.includes('429')) {
        toast.error('Rate limit exceeded. Please try again in a few moments.');
      } else if (error.message?.includes('402')) {
        toast.error('AI credits exhausted. Please add credits to continue.');
      } else {
        toast.error('Failed to generate workout plan. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="shadow-glow animate-fade-in">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            AI Workout Plan Generator
          </CardTitle>
          <CardDescription>
            Get a personalized workout plan based on your fitness goals and level
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-secondary rounded-lg">
              <div>
                <p className="text-sm text-muted-foreground">Goal</p>
                <p className="font-semibold capitalize">{profile.fitness_goal?.replace('_', ' ')}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Level</p>
                <p className="font-semibold capitalize">{profile.fitness_level}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Available Time</p>
                <p className="font-semibold">{profile.available_time || 30} min/day</p>
              </div>
            </div>
            <Button onClick={generatePlan} disabled={loading} className="w-full gradient-primary shadow-glow">
              {loading ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Generating your personalized plan...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Dumbbell className="w-4 h-4" />
                  Generate New Workout Plan
                </span>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Existing Plans */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Your Workout Plans</h3>
        {loadingPlans ? (
          <Card className="p-6 text-center">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Loading your plans...</p>
          </Card>
        ) : workoutPlans.length === 0 ? (
          <Card className="p-8 text-center">
            <Dumbbell className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No workout plans yet. Generate your first one above!</p>
          </Card>
        ) : (
          workoutPlans.map((plan) => (
            <Card key={plan.id} className="shadow-card hover:shadow-glow transition-all animate-slide-up">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{plan.plan_name}</span>
                  {plan.is_active && (
                    <span className="text-xs bg-success/10 text-success px-2 py-1 rounded-full flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      Active
                    </span>
                  )}
                </CardTitle>
                <CardDescription>
                  {plan.difficulty_level.charAt(0).toUpperCase() + plan.difficulty_level.slice(1)} • {plan.duration_weeks} weeks
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {(plan.workouts || []).slice(0, 3).map((workout: any, idx: number) => (
                    <div key={idx} className="flex gap-3 p-3 bg-secondary rounded-lg">
                      <div className="flex-shrink-0 w-10 h-10 gradient-primary rounded-lg flex items-center justify-center text-primary-foreground font-bold">
                        {idx + 1}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold">{workout.exercise}</p>
                        <p className="text-sm text-muted-foreground">
                          {workout.sets} sets × {workout.reps} reps
                        </p>
                        {workout.notes && <p className="text-xs text-muted-foreground mt-1">{workout.notes}</p>}
                      </div>
                    </div>
                  ))}
                  {plan.workouts?.length > 3 && (
                    <p className="text-sm text-muted-foreground text-center">
                      +{plan.workouts.length - 3} more exercises
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default WorkoutPlanGenerator;
