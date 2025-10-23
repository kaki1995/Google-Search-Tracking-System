import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FormControl, FormField, FormItem, FormLabel, FormMessage, Form } from "@/components/ui/form";
import { trackingService } from "@/lib/tracking";
import LikertScale from "./LikertScale";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { sessionManager } from "@/lib/sessionManager";
import useResponsePersistence from "@/hooks/useResponsePersistence";

interface SurveyForm {
  age: string;
  gender: string;
  education: string;
  employment: string;
  nationality: string;
  country: string;
  experience_scale_q7: string;
  familiarity_scale_q8: string;
  search_frequency: string;
  shopping_search_tool: string;
}

export default function BackgroundSurvey() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const navigate = useNavigate();

  const form = useForm<SurveyForm>({
    defaultValues: {
      age: "",
      gender: "",
      education: "",
      employment: "",
      nationality: "",
      country: "",
      experience_scale_q7: "",
      familiarity_scale_q8: "",
      search_frequency: "",
      shopping_search_tool: ""
    }
  });

  // On mount, load saved values and reset the form
  useEffect(() => {
    const loadAndRestoreData = async () => {
      try {
        let participantId = sessionManager.getParticipantId();
        if (!participantId) {
          participantId = sessionManager.createNewSession();
          console.log('🆕 Created new participant ID:', participantId);
        } else {
          console.log('🔍 Using existing participant ID:', participantId);
        }
        
        console.log('🔍 Loading responses for background_survey...');
        const saved = await sessionManager.loadResponses('background_survey');
        console.log('📋 Loaded saved data:', saved);
        
        if (saved && Object.keys(saved).length > 0) {
          console.log('✅ Restoring form with saved data');
          // Create new object with saved values merged with defaults
          const restoredValues = {
            age: saved.age || "",
            gender: saved.gender || "",
            education: saved.education || "",
            employment: saved.employment || "",
            nationality: saved.nationality || "",
            country: saved.country || "",
            experience_scale_q7: saved.experience_scale_q7 || "",
            familiarity_scale_q8: saved.familiarity_scale_q8 || "",
            search_frequency: saved.search_frequency || "",
            shopping_search_tool: saved.shopping_search_tool || ""
          };
          
          // Reset form with restored values
          form.reset(restoredValues);
          console.log('📊 Form restored with values:', restoredValues);
        } else {
          console.log('📭 No saved data found, starting with empty form');
        }
      } catch (error) {
        console.error('❌ Error loading saved responses:', error);
      }
    };

    loadAndRestoreData();
  }, [form]);

  // Use the response persistence hook with auto-save enabled
  const { saveResponses } = useResponsePersistence(form, 'background_survey', {
    autosave: true,
    debounceMs: 1000 // Save 1 second after user stops typing/selecting
  });

  // Track when auto-save occurs by watching form values
  useEffect(() => {
    const subscription = form.watch(() => {
      // Update last saved time when form changes (auto-save will trigger)
      setTimeout(() => {
        setLastSaved(new Date());
      }, 1200); // Slightly after the debounce delay
    });

    return () => subscription.unsubscribe();
  }, [form]);

  // Ensure session is initialized when component mounts
  useEffect(() => {
    const initializeSession = async () => {
      let participantId = sessionManager.getParticipantId();
      
      // If no participant ID exists, create one
      if (!participantId) {
        console.log('BackgroundSurvey: No participant ID found, creating new session');
        participantId = sessionManager.createNewSession();
        console.log('BackgroundSurvey: Created new participant ID:', participantId);
      } else {
        console.log('BackgroundSurvey: Using existing participant ID:', participantId);
      }
    };
    
    initializeSession();
  }, []);

  // Manual save function that we can call explicitly
  const handleSaveResponses = async (formData: any) => {
    try {
      const participantId = sessionManager.getParticipantId();
      if (!participantId) {
        console.error('No participant ID for saving');
        return;
      }

      console.log('💾 [MANUAL SAVE] Saving responses:', formData);
      await sessionManager.saveResponses('background_survey', formData);
      console.log('✅ [MANUAL SAVE] Responses saved successfully');
      setLastSaved(new Date());
    } catch (error) {
      console.error('❌ [MANUAL SAVE] Failed to save:', error);
    }
  };

  const onSubmit = async (data: SurveyForm) => {
    console.log('BackgroundSurvey: onSubmit called with data:', data);
    setIsSubmitting(true);
    try {
      // Save responses locally first for persistence
      await sessionManager.saveResponses('background_survey', data);
      
      // Use existing participant ID from session (should be set from Welcome page)
      const participant_id = sessionManager.getParticipantId();
      if (!participant_id) {
        throw new Error('No participant ID found. Please restart from the welcome page.');
      }
      console.log('BackgroundSurvey: participant_id:', participant_id);

      const responses = {
        q1_age_group: data.age,
        q2_gender: data.gender,
        q3_education: data.education,
        q4_employment_status: data.employment,
        q5_nationality: data.nationality,
        q6_country_residence: data.country,
        q7_ai_familiarity: Number(data.experience_scale_q7 || 0),
        q8_attention_check: Number(data.familiarity_scale_q8 || 0),
        q9_ai_usage_frequency: data.search_frequency,
        q10_shopping_search_tool: data.shopping_search_tool,
      };

      console.log('BackgroundSurvey: submitting responses:', responses);

      const { data: resp, error } = await supabase.functions.invoke('submit-background-survey', {
        body: { participant_id, responses }
      });

      console.log('BackgroundSurvey: function response:', resp);
      console.log('BackgroundSurvey: function error:', error);

      if (error || !resp?.ok) {
        const msg = error?.message || resp?.error || 'Failed to submit background survey';
        console.error('BackgroundSurvey: submission failed:', msg);
        throw new Error(msg);
      }

      console.log('BackgroundSurvey: submission successful, navigating to /task-instructions');
      // Clear saved form data after successful submission
      sessionManager.clearResponses('background_survey');
      setLastSaved(null); // Clear the auto-save indicator
      navigate('/task-instructions');
    } catch (error: any) {
      console.error('BackgroundSurvey: Error submitting survey:', error);
      toast({ title: 'Submission failed', description: error?.message || 'Please try again.', variant: 'destructive' });
      // Keep data for retry
    } finally {
      setIsSubmitting(false);
    }
  };
  // ...existing code...
  return (
    <div className="min-h-screen relative bg-white md:bg-background py-6 px-4 md:py-8 md:px-6 lg:px-12"
      style={{
        backgroundImage: "none"
      }}
      >
      {/* Background overlay for better text readability - desktop only */}
      <div className="hidden md:block absolute inset-0 bg-black bg-opacity-20" 
        style={{
          backgroundImage: "url('/mountain-background.jpg')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      ></div>

      <div className="max-w-4xl mx-auto relative z-10">
        <div className="bg-white md:bg-opacity-95 md:backdrop-blur-sm shadow-lg p-6 md:p-8 lg:p-12 rounded-lg">
          <h1 className="text-xl md:text-2xl font-bold text-center mb-6 md:mb-8 text-foreground">
            Your Personal Background
          </h1>

          {/* Information Box with Person Emoji */}
          <div className="border border-blue-200 rounded-lg p-4 mb-6 md:mb-8 bg-sky-100">
            <div className="flex items-start gap-3">
              <span className="text-blue-600 text-lg">👤</span>
              <span className="text-sm md:text-base text-gray-700 text-justify">
                Please answer the following questions to help us better understand your background. All responses are anonymous and used for research purposes only.
              </span>
            </div>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Question 1: Age */}
              <FormField control={form.control} name="age" rules={{
              required: "This field is required"
            }} render={({
              field
            }) => <FormItem>
                    <FormLabel className="text-sm md:text-base font-medium text-gray-900">
                      1. What is your age group? <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Select onValueChange={(value) => {
                        field.onChange(value);
                        // Trigger manual save after selection
                        setTimeout(() => {
                          handleSaveResponses(form.getValues());
                        }, 100);
                      }} value={field.value}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select your age group" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="under-18">Under 18</SelectItem>
                          <SelectItem value="18-24">18-24</SelectItem>
                          <SelectItem value="25-34">25-34</SelectItem>
                          <SelectItem value="35-44">35-44</SelectItem>
                          <SelectItem value="45-54">45-54</SelectItem>
                          <SelectItem value="55-and-above">55 and above</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>} />

              {/* Question 2: Gender */}
              <FormField control={form.control} name="gender" rules={{
              required: "This field is required"
            }} render={({
              field
            }) => <FormItem>
                    <FormLabel className="text-sm md:text-base font-medium text-gray-900">
                      2. What is your gender? <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Select onValueChange={(value) => {
                        field.onChange(value);
                        setTimeout(() => {
                          handleSaveResponses(form.getValues());
                        }, 100);
                      }} value={field.value}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select your gender" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="female">Female</SelectItem>
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="non-binary">Non-binary / Diverse</SelectItem>
                          <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>} />

              {/* Question 3: Education */}
              <FormField control={form.control} name="education" rules={{
              required: "This field is required"
            }} render={({
              field
            }) => <FormItem>
                    <FormLabel className="text-sm md:text-base font-medium text-gray-900">
                      3. What is your highest level of education? <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Select onValueChange={(value) => {
                        field.onChange(value);
                        setTimeout(() => {
                          handleSaveResponses(form.getValues());
                        }, 100);
                      }} value={field.value}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select education level" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="high-school">High school or below</SelectItem>
                          <SelectItem value="bachelor">Bachelor's degree</SelectItem>
                          <SelectItem value="master">Master's degree</SelectItem>
                          <SelectItem value="doctorate">Doctorate / PhD</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>} />

              {/* Question 4: Employment Status */}
              <FormField control={form.control} name="employment" rules={{
              required: "This field is required"
            }} render={({
              field
            }) => <FormItem>
                    <FormLabel className="text-sm md:text-base font-medium text-gray-900">
                      4. What is your current employment status? <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Select onValueChange={(value) => {
                        field.onChange(value);
                        setTimeout(() => {
                          handleSaveResponses(form.getValues());
                        }, 100);
                      }} value={field.value}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select employment status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="student">Student</SelectItem>
                          <SelectItem value="employed">Employed</SelectItem>
                          <SelectItem value="self-employed">Self-employed</SelectItem>
                          <SelectItem value="unemployed">Unemployed</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>} />

              {/* Question 5: Nationality */}
              <FormField control={form.control} name="nationality" rules={{
              required: "This field is required"
            }} render={({
              field
            }) => <FormItem>
                    <FormLabel className="text-sm md:text-base font-medium text-gray-900">
                      5. What is your nationality? <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input {...field} 
                        placeholder="" 
                        className="border-b border-t-0 border-l-0 border-r-0 rounded-none"
                        onBlur={(e) => {
                          field.onBlur();
                          saveResponses();
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>} />

              {/* Question 6: Country */}
              <FormField control={form.control} name="country" rules={{
              required: "This field is required"
            }} render={({
              field
            }) => <FormItem>
                    <FormLabel className="text-sm md:text-base font-medium text-gray-900">
                      6. What is your current country of residence? <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input {...field} 
                        placeholder="" 
                        className="border-b border-t-0 border-l-0 border-r-0 rounded-none"
                        onBlur={(e) => {
                          field.onBlur();
                          saveResponses();
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>} />

              {/* Question 7: AI Chatbots Familiarity */}
              <FormField control={form.control} name="experience_scale_q7" rules={{
              required: "This field is required"
            }} render={({
              field
            }) => <FormItem>
                    <FormLabel className="text-sm md:text-base font-medium text-gray-900">
                      7. How familiar are you with AI chatbots such as ChatGPT? <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <div className="bg-gray-50 p-3 md:p-4 rounded-lg">
                        <div className="hidden md:flex items-center justify-between mb-4">
                          <span className="text-sm text-gray-600">1-Not familiar at all</span>
                          <span className="text-sm text-gray-600">7-Extremely familiar</span>
                        </div>
                        <div className="flex md:hidden flex-row justify-between items-center mb-3 w-full">
                          <span className="text-xs text-gray-600">1-Not familiar at all</span>
                          <span className="text-xs text-gray-600">7-Extremely familiar</span>
                        </div>
                        <div className="flex justify-between items-center gap-1">
                          {[1, 2, 3, 4, 5, 6, 7].map((value) => (
                            <div key={value} className="flex flex-col items-center">
                              <input 
                                type="radio" 
                                name="experience_scale_q7" 
                                value={value.toString()} 
                                checked={field.value === value.toString()} 
                                onChange={(e) => {
                                  field.onChange(e);
                                  handleSaveResponses(form.getValues());
                                }}
                                className="mb-1 w-4 h-4 md:w-4 md:h-4" 
                                id={`q7-${value}`}
                              />
                              <label 
                                htmlFor={`q7-${value}`} 
                                className="text-xs md:text-sm text-gray-600 cursor-pointer"
                              >
                                {value}
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>} />

              {/* Question 8: Data Quality Note */}
              <FormField control={form.control} name="familiarity_scale_q8" rules={{
              required: "This field is required"
            }} render={({
              field
            }) => <FormItem>
                    <FormLabel className="text-sm md:text-base font-medium text-gray-900">
                      8. Please choose 1 – Strongly Disagree as your answer for this statement. <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <div className="bg-gray-50 p-3 md:p-4 rounded-lg">
                        <div className="hidden md:flex items-center justify-between mb-4">
                          <span className="text-sm text-gray-600">1-Strongly Disagree</span>
                          <span className="text-sm text-gray-600">7-Strongly Agree</span>
                        </div>
                        <div className="flex md:hidden flex-row justify-between items-center mb-3 w-full">
                          <span className="text-xs text-gray-600">1-Strongly Disagree</span>
                          <span className="text-xs text-gray-600">7-Strongly Agree</span>
                        </div>
                        <div className="flex justify-between items-center gap-1">
                          {[1, 2, 3, 4, 5, 6, 7].map((value) => (
                            <div key={value} className="flex flex-col items-center">
                              <input 
                                type="radio" 
                                name="familiarity_scale_q8" 
                                value={value.toString()} 
                                checked={field.value === value.toString()} 
                                onChange={(e) => {
                                  field.onChange(e);
                                  handleSaveResponses(form.getValues());
                                }}
                                className="mb-1 w-4 h-4 md:w-4 md:h-4" 
                                id={`q8-${value}`}
                              />
                              <label 
                                htmlFor={`q8-${value}`} 
                                className="text-xs md:text-sm text-gray-600 cursor-pointer"
                              >
                                {value}
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>} />

              {/* Question 9: AI Chatbot Usage Frequency */}
              <FormField control={form.control} name="search_frequency" rules={{
              required: "This field is required"
            }} render={({
              field
            }) => <FormItem>
                    <FormLabel className="text-sm md:text-base font-medium text-gray-900">
                      9. On average, how often do you use AI chatbots per week? <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Select onValueChange={(value) => {
                        field.onChange(value);
                        setTimeout(() => {
                          handleSaveResponses(form.getValues());
                        }, 100);
                      }} value={field.value}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select frequency" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0-times">0 times</SelectItem>
                          <SelectItem value="1-2-times">1-2 times</SelectItem>
                          <SelectItem value="3-5-times">3-5 times</SelectItem>
                          <SelectItem value="6-10-times">6-10 times</SelectItem>
                          <SelectItem value="more-than-10">More than 10 times</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                } />

              {/* Question 10: Shopping Search Tool */}
              <FormField control={form.control} name="shopping_search_tool" rules={{
              required: "This field is required"
            }} render={({
              field
            }) => <FormItem>
                    <FormLabel className="text-base font-medium text-gray-900">
                      10. Which search tool do you usually use for shopping-related tasks? <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input {...field} 
                        placeholder="e.g., Google, Amazon, price comparison sites, etc." 
                        className="border-b border-t-0 border-l-0 border-r-0 rounded-none"
                        onBlur={(e) => {
                          field.onBlur();
                          saveResponses();
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                } />

              {/* Buttons */}
              <div className="flex justify-between pt-8 px-4 md:px-8 lg:px-12">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={async () => {
                    try {
                      const values = form.getValues();
                      console.log('💾 [SAVE] Form values to save:', values);
                      
                      // Ensure responses are saved before navigation
                      await sessionManager.saveResponses('background_survey', values);
                      console.log('💾 [SAVE] Responses saved successfully before navigation');
                      
                      // Small delay to ensure save completes
                      setTimeout(() => {
                        navigate('/');
                      }, 100);
                    } catch (error) {
                      console.error('❌ [SAVE] Failed to save responses:', error);
                      // Navigate anyway to avoid blocking user
                      navigate('/');
                    }
                  }} 
                  className="px-8 py-2 text-sm font-medium border-2"
                >
                  Previous Page
                </Button>
                <Button 
                  type="submit"
                  disabled={isSubmitting} 
                  className="px-8 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                  {isSubmitting ? "Loading..." : "Next Page"}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
}