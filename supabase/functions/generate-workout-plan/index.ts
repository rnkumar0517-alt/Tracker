import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { goal, fitnessLevel, availableTime } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    console.log(`Generating workout plan: goal=${goal}, level=${fitnessLevel}, time=${availableTime}min`);

    const systemPrompt = `You are a professional fitness coach. Generate a personalized 4-week adaptive workout plan based on the user's profile. 
    
Return your response in this exact JSON format with 3-4 specific workout steps:
{
  "plan_name": "Clear, motivating plan name",
  "workouts": [
    {
      "week": 1,
      "day": "Monday",
      "exercise": "Specific exercise name",
      "sets": 3,
      "reps": "10-12 or time duration",
      "notes": "Form tips or modifications"
    }
  ]
}

Keep the plan realistic, progressive, and achievable for the user's level.`;

    const userPrompt = `Create a personalized workout plan for:
- Goal: ${goal}
- Fitness Level: ${fitnessLevel}
- Available Time: ${availableTime} minutes per day

Provide 3-4 key workout steps that are specific and actionable.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limits exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Payment required. Please add credits to your workspace.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    console.log('AI response:', content);

    // Parse the JSON response from AI
    let workoutPlan;
    try {
      // Try to extract JSON from markdown code blocks if present
      const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/) || content.match(/```\n([\s\S]*?)\n```/);
      const jsonStr = jsonMatch ? jsonMatch[1] : content;
      workoutPlan = JSON.parse(jsonStr);
    } catch (e) {
      console.error('Failed to parse AI response:', e);
      // Fallback plan if parsing fails
      workoutPlan = {
        plan_name: `${goal.replace('_', ' ')} Plan`,
        workouts: [
          {
            week: 1,
            day: 'Monday',
            exercise: 'Warm-up & Basic Cardio',
            sets: 1,
            reps: '10 minutes',
            notes: 'Start at a comfortable pace'
          },
          {
            week: 1,
            day: 'Wednesday',
            exercise: 'Strength Training',
            sets: 3,
            reps: '10-12',
            notes: 'Focus on form over speed'
          },
          {
            week: 1,
            day: 'Friday',
            exercise: 'Full Body Workout',
            sets: 3,
            reps: '8-10',
            notes: 'Rest 60 seconds between sets'
          }
        ]
      };
    }

    return new Response(
      JSON.stringify(workoutPlan),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error generating workout plan:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});