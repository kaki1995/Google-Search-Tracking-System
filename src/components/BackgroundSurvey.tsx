import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FormControl, FormField, FormItem, FormLabel, FormMessage, Form } from "@/components/ui/form";
import { trackingService } from "@/lib/tracking";
import LikertScale from "./LikertScale";
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
}
export default function BackgroundSurvey() {
  const [isSubmitting, setIsSubmitting] = useState(false);
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
      search_frequency: ""
    }
  });

  // Load saved form data on component mount
  useEffect(() => {
    const savedData = localStorage.getItem('background_survey_data');
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        form.reset(parsedData);
      } catch (error) {
        console.error('Error parsing saved form data:', error);
      }
    }
  }, [form]);

  // Save form data whenever form values change
  useEffect(() => {
    const subscription = form.watch((value) => {
      localStorage.setItem('background_survey_data', JSON.stringify(value));
    });
    return () => subscription.unsubscribe();
  }, [form]);
  const onSubmit = async (data: SurveyForm) => {
    setIsSubmitting(true);
    try {
      // Check if session exists, if not initialize one
      let session = trackingService.loadSession();
      if (!session) {
        console.log('No session found, initializing new session');
        await trackingService.initSession();
        session = trackingService.loadSession();
      }
      
      console.log('Submitting background survey:', data);
      await trackingService.trackBackgroundSurvey(data);
      console.log('Background survey submitted successfully');
      
      // Clear saved form data after successful submission
      localStorage.removeItem('background_survey_data');
      
      navigate('/task-instructions');
    } catch (error) {
      console.error('Error submitting survey:', error);
      // Show error to user but still allow navigation
      alert('There was an issue saving your survey data, but you can continue with the study.');
      navigate('/task-instructions');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="min-h-screen relative bg-background py-8 px-6 md:px-8 lg:px-12"
      style={{
        backgroundImage: "url('/mountain-background.jpg')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}>
      {/* Background overlay for better text readability */}
      <div className="absolute inset-0 bg-black bg-opacity-20"></div>
      
      <div className="max-w-4xl mx-auto relative z-10">
        <div className="bg-white bg-opacity-95 backdrop-blur-sm shadow-lg p-8 md:p-12 lg:p-16 rounded-lg">
          <h1 className="text-2xl font-bold text-center mb-8 text-foreground">
            Your Personal Background
          </h1>
          
          {/* Information Box with Person Emoji */}
          <div className="border border-blue-200 rounded-lg p-4 mb-8 bg-sky-100">
            <div className="flex items-start gap-3">
              <span className="text-blue-600 text-lg">👤</span>
              <span className="text-base text-gray-700 text-justify">
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
                    <FormLabel className="text-base font-medium text-gray-900">
                      1. What is your age group? <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select age group" />
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
                    <FormLabel className="text-base font-medium text-gray-900">
                      2. What is your gender? <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select gender" />
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
                    <FormLabel className="text-base font-medium text-gray-900">
                      3. What is your highest level of education? <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Select onValueChange={field.onChange} value={field.value}>
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
                    <FormLabel className="text-base font-medium text-gray-900">
                      4. What is your current employment status? <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Select onValueChange={field.onChange} value={field.value}>
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
                    <FormLabel className="text-base font-medium text-gray-900">
                      5. What is your nationality? <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="" className="border-b border-t-0 border-l-0 border-r-0 rounded-none" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>} />

              {/* Question 6: Country */}
              <FormField control={form.control} name="country" rules={{
              required: "This field is required"
            }} render={({
              field
            }) => <FormItem>
                    <FormLabel className="text-base font-medium text-gray-900">
                      6. What is your current country of residence? <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="" className="border-b border-t-0 border-l-0 border-r-0 rounded-none" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>} />

              {/* Question 7: AI Chatbots Familiarity */}
              <FormField control={form.control} name="experience_scale_q7" rules={{
              required: "This field is required"
            }} render={({
              field
            }) => <FormItem>
                    <FormLabel className="text-base font-medium text-gray-900">
                      7. How familiar are you with AI chatbots such as ChatGPT? <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex items-center justify-between mb-4">
                          <span className="text-sm text-gray-600">1-Not familiar at all</span>
                          <span className="text-sm text-gray-600">7-Extremely familiar</span>
                        </div>
                        <div className="flex justify-between items-center">
                          {[1, 2, 3, 4, 5, 6, 7].map((value) => (
                            <div key={value} className="flex flex-col items-center">
                              <input 
                                type="radio" 
                                name="experience_scale_q7" 
                                value={value.toString()} 
                                checked={field.value === value.toString()} 
                                onChange={field.onChange} 
                                className="mb-1 w-4 h-4" 
                                id={`q7-${value}`}
                              />
                              <label 
                                htmlFor={`q7-${value}`} 
                                className="text-sm text-gray-600 cursor-pointer"
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
                    <FormLabel className="text-base font-medium text-gray-900">
                      8. Please choose 1 – Strongly Disagree as your answer to this question. <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex items-center justify-between mb-4">
                          <span className="text-sm text-gray-600">1-Strongly Disagree</span>
                          <span className="text-sm text-gray-600">7-Strongly Agree</span>
                        </div>
                        <div className="flex justify-between items-center">
                          {[1, 2, 3, 4, 5, 6, 7].map((value) => (
                            <div key={value} className="flex flex-col items-center">
                              <input 
                                type="radio" 
                                name="familiarity_scale_q8" 
                                value={value.toString()} 
                                checked={field.value === value.toString()} 
                                onChange={field.onChange} 
                                className="mb-1 w-4 h-4" 
                                id={`q8-${value}`}
                              />
                              <label 
                                htmlFor={`q8-${value}`} 
                                className="text-sm text-gray-600 cursor-pointer"
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
                    <FormLabel className="text-base font-medium text-gray-900">
                      9. On average, how often do you use AI chatbots per week? <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Select onValueChange={field.onChange} value={field.value}>
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

              {/* Buttons */}
              <div className="flex justify-between pt-8 px-4 md:px-8 lg:px-12">
                <Button type="button" variant="outline" onClick={() => navigate('/')} className="px-8 py-2 text-sm font-medium border-2">
                  Previous Page
                </Button>
                <Button type="submit" disabled={isSubmitting} className="px-8 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700">
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