import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';
import Dashboard from '@/components/Dashboard';
import { Button } from '@/components/ui/button';
import { Activity, Dumbbell, Sparkles, TrendingUp } from 'lucide-react';

const Index = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // If logged in, show dashboard
  if (user) {
    return <Dashboard user={user} />;
  }

  // Landing page for non-authenticated users
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-1/4 w-96 h-96 gradient-primary rounded-full blur-3xl opacity-20 animate-pulse-slow" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 gradient-accent rounded-full blur-3xl opacity-20 animate-pulse-slow" style={{ animationDelay: '1s' }} />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center space-y-8 animate-fade-in">
            <div className="inline-flex items-center justify-center p-4 gradient-primary rounded-2xl shadow-glow mb-4">
              <Activity className="w-12 h-12 text-primary-foreground" />
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold text-black">
              Health Tracker
            </h1>
            
            <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
              Your personal health & fitness tracking platform powered by AI
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
              <Button
                size="lg"
                onClick={() => navigate('/auth')}
                className="gradient-primary shadow-glow text-lg px-8"
              >
                Get Started Free
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => navigate('/auth')}
                className="text-lg px-8"
              >
                Sign In
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
          Everything you need to reach your fitness goals
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center space-y-4 p-6 rounded-2xl bg-card shadow-card hover:shadow-glow transition-all animate-slide-up">
            <div className="inline-flex p-4 gradient-primary rounded-xl">
              <TrendingUp className="w-8 h-8 text-primary-foreground" />
            </div>
            <h3 className="text-xl font-semibold">Activity Tracking</h3>
            <p className="text-muted-foreground">
              Track steps, calories, active minutes, and sleep patterns all in one place
            </p>
          </div>

          <div className="text-center space-y-4 p-6 rounded-2xl bg-card shadow-card hover:shadow-glow transition-all animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <div className="inline-flex p-4 gradient-accent rounded-xl">
              <Dumbbell className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-semibold">Smart Detection</h3>
            <p className="text-muted-foreground">
              Automatically detect walking, running, and cycling activities
            </p>
          </div>

          <div className="text-center space-y-4 p-6 rounded-2xl bg-card shadow-card hover:shadow-glow transition-all animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <div className="inline-flex p-4 gradient-success rounded-xl">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-semibold">AI Workout Plans</h3>
            <p className="text-muted-foreground">
              Get personalized workout plans generated by AI based on your goals
            </p>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center p-12 rounded-3xl gradient-primary shadow-glow animate-fade-in">
          <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
            Ready to transform your fitness journey?
          </h2>
          <p className="text-primary-foreground/90 text-lg mb-8">
            Join thousands of users reaching their fitness goals
          </p>
          <Button
            size="lg"
            onClick={() => navigate('/auth')}
            className="bg-white text-primary hover:bg-white/90 shadow-lg text-lg px-8"
          >
            Start Your Journey
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Index;