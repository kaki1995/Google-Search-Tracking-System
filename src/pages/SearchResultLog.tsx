import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FormControl, FormField, FormItem, FormLabel, FormMessage, Form } from "@/components/ui/form";
import { sessionManager } from "@/lib/sessionManager";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface SearchResultForm {
  q11_answer: string;
  q12_answer: string;
  q13_answer: string;
  q14_answer: string;
  q15_answer: string;
}

export default function SearchResultLog() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const form = useForm<SearchResultForm>({
    defaultValues: {
      q11_answer: "",
      q12_answer: "",
      q13_answer: "",
      q14_answer: "",
      q15_answer: ""
    }
  });

  // Load saved form data on component mount
  useEffect(() => {
    const savedData = sessionManager.loadPage('search_result_log');
    if (savedData) {
      form.reset(savedData);
    }
  }, [form]);

  // Save form data whenever form values change
  useEffect(() => {
    const subscription = form.watch((value) => {
      sessionManager.savePage('search_result_log', value);
    });
    return () => subscription.unsubscribe();
  }, [form]);

  const handlePrevious = () => {
    // Save current form data before navigating
    const currentData = form.getValues();
    sessionManager.savePage('search_result_log', currentData);
    navigate('/search-interface');
  };

  const onSubmit = async (data: SearchResultForm) => {
    setIsSubmitting(true);
    try {
      const participant_id = sessionManager.getParticipantId();
      const session_id = sessionManager.getSessionId();

      if (!session_id) {
        toast({
          title: 'Session Error',
          description: 'No active session found. Please start from the beginning.',
          variant: 'destructive',
        });
        return;
      }

      const { error } = await supabase.functions.invoke('result-log', {
        body: {
          participant_id,
          session_id,
          q11_answer: data.q11_answer,
          q12_answer: data.q12_answer,
          q13_answer: data.q13_answer,
          q14_answer: data.q14_answer,
          q15_answer: data.q15_answer
        }
      });

      if (error) {
        throw new Error(error.message || 'Failed to save search results');
      }

      navigate('/post-task-survey');
    } catch (error: any) {
      console.error('Error submitting search result log:', error);
      toast({ 
        title: 'Submission failed', 
        description: error?.message || 'Please try again.', 
        variant: 'destructive' 
      });
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
            Search Results Summary
          </h1>
          
          <div className="border border-blue-200 rounded-lg p-4 mb-8 bg-sky-100">
            <div className="flex items-start gap-3">
              <span className="text-blue-600 text-lg">🔍</span>
              <span className="text-base text-gray-700 text-justify">
                Please answer the following questions about your search experience. These questions help us understand how you used the search results.
              </span>
            </div>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Question 11 */}
              <FormField control={form.control} name="q11_answer" rules={{
                required: "This field is required"
              }} render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base font-medium text-gray-900">
                    11. How many search queries did you perform during this task? <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select number of queries" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1</SelectItem>
                        <SelectItem value="2">2</SelectItem>
                        <SelectItem value="3">3</SelectItem>
                        <SelectItem value="4">4</SelectItem>
                        <SelectItem value="5-or-more">5 or more</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              {/* Question 12 */}
              <FormField control={form.control} name="q12_answer" rules={{
                required: "This field is required"
              }} render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base font-medium text-gray-900">
                    12. How many search result links did you click on? <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select number of clicks" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">0</SelectItem>
                        <SelectItem value="1">1</SelectItem>
                        <SelectItem value="2">2</SelectItem>
                        <SelectItem value="3">3</SelectItem>
                        <SelectItem value="4-or-more">4 or more</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              {/* Question 13 */}
              <FormField control={form.control} name="q13_answer" rules={{
                required: "This field is required"
              }} render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base font-medium text-gray-900">
                    13. Did you find the information you were looking for? <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select your answer" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="yes-completely">Yes, completely</SelectItem>
                        <SelectItem value="yes-partially">Yes, partially</SelectItem>
                        <SelectItem value="no">No</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              {/* Question 14 */}
              <FormField control={form.control} name="q14_answer" rules={{
                required: "This field is required"
              }} render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base font-medium text-gray-900">
                    14. How satisfied were you with the search results? <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select satisfaction level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="very-satisfied">Very satisfied</SelectItem>
                        <SelectItem value="satisfied">Satisfied</SelectItem>
                        <SelectItem value="neutral">Neutral</SelectItem>
                        <SelectItem value="dissatisfied">Dissatisfied</SelectItem>
                        <SelectItem value="very-dissatisfied">Very dissatisfied</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              {/* Question 15 */}
              <FormField control={form.control} name="q15_answer" rules={{
                required: "This field is required"
              }} render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base font-medium text-gray-900">
                    15. Did you scroll through multiple pages of search results? <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select your answer" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="yes-multiple-pages">Yes, I looked at multiple pages</SelectItem>
                        <SelectItem value="yes-second-page">Yes, I looked at the second page</SelectItem>
                        <SelectItem value="no-first-page-only">No, I only looked at the first page</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              {/* Buttons */}
              <div className="flex justify-between pt-8">
                <Button type="button" variant="outline" onClick={handlePrevious} className="px-8 py-2 text-sm font-medium border-2">
                  Previous Page
                </Button>
                <Button type="submit" disabled={isSubmitting} className="px-8 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700">
                  {isSubmitting ? "Saving..." : "Next Page"}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
}