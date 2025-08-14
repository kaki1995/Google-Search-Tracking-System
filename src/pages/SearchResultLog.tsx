import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FormControl, FormField, FormItem, FormLabel, FormMessage, Form } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { sessionManager } from "@/lib/sessionManager";
import { toast } from "@/hooks/use-toast";

interface SearchResultLogForm {
  q11_answer: string;
  q12_answer: string; 
  q13_answer: string;
  q14_answer: string;
  q15_answer: string;
}

export default function SearchResultLog() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const form = useForm<SearchResultLogForm>({
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
    const savedData = localStorage.getItem('search_result_log_data');
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        form.reset(parsedData);
      } catch (error) {
        console.error('Error parsing saved search result log data:', error);
      }
    }
  }, [form]);

  // Save form data whenever form values change
  useEffect(() => {
    const subscription = form.watch((value) => {
      localStorage.setItem('search_result_log_data', JSON.stringify(value));
    });
    return () => subscription.unsubscribe();
  }, [form]);

  const handlePrevious = async () => {
    // Save current form data
    const values = form.getValues();
    await sessionManager.savePage('search_result_log', values);
    navigate('/search-interface');
  };

  const handleNext = async (data: SearchResultLogForm) => {
    setIsSubmitting(true);
    try {
      // Save current form data
      await sessionManager.savePage('search_result_log', data);
      
      // Save to search_result_log table
      const success = await sessionManager.saveResultLog(
        data.q11_answer,
        data.q12_answer,
        data.q13_answer,
        data.q14_answer,
        data.q15_answer
      );

      if (!success) {
        throw new Error('Failed to save search result log');
      }

      // Clear saved form data after successful submission
      localStorage.removeItem('search_result_log_data');
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
        <div className="bg-white bg-opacity-95 backdrop-blur-sm rounded-lg shadow-lg p-8 md:p-12 lg:p-16">
          <h1 className="text-2xl font-bold text-center mb-8 text-foreground">
            Search Results Review
          </h1>

          <div className="mb-6 p-4 rounded-lg border border-blue-200 bg-sky-100">
            <p className="text-gray-700 text-sm flex items-start gap-2">
              <span className="text-blue-600 text-lg flex-shrink-0">🔍</span>
              <span className="text-justify">
                Please reflect on your search experience and answer the following questions about the results you found.
              </span>
            </p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleNext)} className="space-y-6">
              {/* Question 11 */}
              <FormField
                control={form.control}
                name="q11_answer"
                rules={{ required: "This field is required" }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base font-medium text-gray-900">
                      11. Which search result(s) did you find most helpful for your task? <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Please describe the most helpful search results"
                        className="min-h-[100px] resize-y"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Question 12 */}
              <FormField
                control={form.control}
                name="q12_answer"
                rules={{ required: "This field is required" }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base font-medium text-gray-900">
                      12. How did you decide which search results to click on? <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Please describe your decision-making process"
                        className="min-h-[100px] resize-y"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Question 13 */}
              <FormField
                control={form.control}
                name="q13_answer"
                rules={{ required: "This field is required" }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base font-medium text-gray-900">
                      13. Did you modify your search terms during the task? If so, why? <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Please describe any search term modifications"
                        className="min-h-[100px] resize-y"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Question 14 */}
              <FormField
                control={form.control}
                name="q14_answer"
                rules={{ required: "This field is required" }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base font-medium text-gray-900">
                      14. What information were you looking for that was difficult to find? <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Please describe any information that was hard to find"
                        className="min-h-[100px] resize-y"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Question 15 */}
              <FormField
                control={form.control}
                name="q15_answer"
                rules={{ required: "This field is required" }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base font-medium text-gray-900">
                      15. Overall, how satisfied were you with the search results quality? <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select satisfaction level" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="very-dissatisfied">Very Dissatisfied</SelectItem>
                          <SelectItem value="dissatisfied">Dissatisfied</SelectItem>
                          <SelectItem value="neutral">Neutral</SelectItem>
                          <SelectItem value="satisfied">Satisfied</SelectItem>
                          <SelectItem value="very-satisfied">Very Satisfied</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Buttons */}
              <div className="flex justify-between pt-8">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={handlePrevious}
                  className="px-8 py-2 text-sm font-medium border-2"
                >
                  Previous Page
                </Button>
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="px-8 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
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