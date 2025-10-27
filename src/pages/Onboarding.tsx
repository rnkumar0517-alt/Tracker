import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Slider } from '@/components/ui/slider';
import { toast } from 'sonner';
import { Target, Gauge, Clock } from 'lucide-react';

const Onboarding = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [fitnessGoal, setFitnessGoal] = useState<'fitness' | 'weight_loss' | 'muscle_gain'>('fitness');
  const [fitnessLevel, setFitnessLevel] = useState<'beginner' | 'intermediate' | 'advanced'>('beginner');
  const [availableTime, setAvailableTime] = useState([30]);

  const handleComplete = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      const { error } = await supabase
        .from('profiles')
        .update({
          fitness_goal: fitnessGoal,
          fitness_level: fitnessLevel,
          available_time: availableTime[0],
        })
        .eq('id', user.id);

      if (error) throw error;

      toast.success('Profile setup complete!');
      navigate('/');
    } catch (error) {
      toast.error('Failed to save profile');
      console.error('Onboarding error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute top-0 right-1/3 w-96 h-96 gradient-success rounded-full blur-3xl opacity-20 animate-pulse-slow" />
        <div className="absolute bottom-0 left-1/3 w-96 h-96 gradient-primary rounded-full blur-3xl opacity-20 animate-pulse-slow" style={{ animationDelay: '1.5s' }} />
      </div>

      <Card className="w-full max-w-2xl shadow-glow animate-fade-in">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold">Welcome to FitTrack Pro</CardTitle>
          <CardDescription>Let's personalize your fitness journey</CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          {step === 1 && (
            <div className="space-y-6 animate-slide-up">
              <div className="flex items-center gap-3 mb-6">
                <Target className="w-6 h-6 text-primary" />
                <h3 className="text-xl font-semibold">What's your primary goal?</h3>
              </div>
              <RadioGroup value={fitnessGoal} onValueChange={(value: any) => setFitnessGoal(value)}>
                <div className="flex items-center space-x-2 p-4 rounded-lg border hover:bg-secondary transition-colors cursor-pointer">
                  <RadioGroupItem value="fitness" id="fitness" />
                  <Label htmlFor="fitness" className="flex-1 cursor-pointer">
                    <div className="font-semibold">General Fitness</div>
                    <div className="text-sm text-muted-foreground">Stay active and healthy</div>
                  </Label>
                </div>
                <div className="flex items-center space-x-2 p-4 rounded-lg border hover:bg-secondary transition-colors cursor-pointer">
                  <RadioGroupItem value="weight_loss" id="weight_loss" />
                  <Label htmlFor="weight_loss" className="flex-1 cursor-pointer">
                    <div className="font-semibold">Weight Loss</div>
                    <div className="text-sm text-muted-foreground">Burn calories and lose weight</div>
                  </Label>
                </div>
                <div className="flex items-center space-x-2 p-4 rounded-lg border hover:bg-secondary transition-colors cursor-pointer">
                  <RadioGroupItem value="muscle_gain" id="muscle_gain" />
                  <Label htmlFor="muscle_gain" className="flex-1 cursor-pointer">
                    <div className="font-semibold">Muscle Gain</div>
                    <div className="text-sm text-muted-foreground">Build strength and muscle mass</div>
                  </Label>
                </div>
              </RadioGroup>
              <Button onClick={() => setStep(2)} className="w-full gradient-primary shadow-glow">
                Continue
              </Button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6 animate-slide-up">
              <div className="flex items-center gap-3 mb-6">
                <Gauge className="w-6 h-6 text-primary" />
                <h3 className="text-xl font-semibold">What's your fitness level?</h3>
              </div>
              <RadioGroup value={fitnessLevel} onValueChange={(value: any) => setFitnessLevel(value)}>
                <div className="flex items-center space-x-2 p-4 rounded-lg border hover:bg-secondary transition-colors cursor-pointer">
                  <RadioGroupItem value="beginner" id="beginner" />
                  <Label htmlFor="beginner" className="flex-1 cursor-pointer">
                    <div className="font-semibold">Beginner</div>
                    <div className="text-sm text-muted-foreground">Just starting out</div>
                  </Label>
                </div>
                <div className="flex items-center space-x-2 p-4 rounded-lg border hover:bg-secondary transition-colors cursor-pointer">
                  <RadioGroupItem value="intermediate" id="intermediate" />
                  <Label htmlFor="intermediate" className="flex-1 cursor-pointer">
                    <div className="font-semibold">Intermediate</div>
                    <div className="text-sm text-muted-foreground">Some experience with workouts</div>
                  </Label>
                </div>
                <div className="flex items-center space-x-2 p-4 rounded-lg border hover:bg-secondary transition-colors cursor-pointer">
                  <RadioGroupItem value="advanced" id="advanced" />
                  <Label htmlFor="advanced" className="flex-1 cursor-pointer">
                    <div className="font-semibold">Advanced</div>
                    <div className="text-sm text-muted-foreground">Regular workout routine</div>
                  </Label>
                </div>
              </RadioGroup>
              <div className="flex gap-2">
                <Button onClick={() => setStep(1)} variant="outline" className="flex-1">
                  Back
                </Button>
                <Button onClick={() => setStep(3)} className="flex-1 gradient-primary shadow-glow">
                  Continue
                </Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6 animate-slide-up">
              <div className="flex items-center gap-3 mb-6">
                <Clock className="w-6 h-6 text-primary" />
                <h3 className="text-xl font-semibold">How much time can you dedicate per day?</h3>
              </div>
              <div className="space-y-4">
                <div className="text-center">
                  <div className="text-4xl font-bold gradient-primary bg-clip-text text-transparent">
                    {availableTime[0]} minutes
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">Daily workout time</p>
                </div>
                <Slider
                  value={availableTime}
                  onValueChange={setAvailableTime}
                  min={15}
                  max={120}
                  step={15}
                  className="py-4"
                />
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>15 min</span>
                  <span>120 min</span>
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={() => setStep(2)} variant="outline" className="flex-1">
                  Back
                </Button>
                <Button onClick={handleComplete} className="flex-1 gradient-primary shadow-glow" disabled={loading}>
                  {loading ? 'Saving...' : 'Complete Setup'}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Onboarding;