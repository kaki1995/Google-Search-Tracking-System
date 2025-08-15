import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FormControl, FormField, FormItem, FormLabel, FormMessage, Form } from "@/components/ui/form";
import { sessionManager } from "@/lib/sessionManager";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import useResponsePersistence from "@/hooks/useResponsePersistence";

interface TaskInstructionForm {
  budget_range: string;
}

export default function TaskInstructions() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const form = useForm<TaskInstructionForm>({
    defaultValues: {
      budget_range: ""
    }
  });

  // Use the enhanced response persistence hook
  const { saveResponses } = useResponsePersistence(form, 'task_instruction');

  const handlePrevious = async () => {
    // Save current form data
    const values = form.getValues();
    await saveResponses(values);
    navigate('/background-survey');
  };

  const onSubmit = async (data: TaskInstructionForm) => {
    setIsSubmitting(true);
    try {
      // Save current form data
      await saveResponses(data);

      const participant_id = sessionManager.getParticipantId();
      if (!participant_id) {
        throw new Error('Participant ID not found');
      }

      // Save to task_instruction table
      const { error } = await supabase.functions.invoke('submit-task-instruction', {
        body: { 
          participant_id, 
          q10_response: data.budget_range 
        }
      });

      if (error) {
        throw new Error(error.message || 'Failed to submit task instruction');
      }

      // Clear saved form data after successful submission
      sessionManager.clearResponses('task_instruction');
      navigate('/search-interface');
    } catch (error: any) {
      console.error('Error submitting task instruction:', error);
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
            Task Instructions
          </h1>
          
          <div className="border border-blue-200 rounded-lg p-6 mb-8 bg-sky-100">
            <div className="flex items-start gap-3">
              <span className="text-blue-600 text-lg">📋</span>
              <div className="text-base text-gray-700">
                <p className="font-semibold mb-3">Your Task:</p>
                <p className="text-justify mb-4">
                  Imagine you are planning to buy a new laptop for work and personal use. 
                  Use the Google search interface on the next page to research and find information 
                  about laptops that would meet your needs.
                </p>
                <p className="text-justify mb-4">
                  <strong>Instructions:</strong>
                </p>
                <ul className="list-disc pl-6 space-y-2 text-justify">
                  <li>Search for information about laptops using whatever search terms you think are appropriate</li>
                  <li>Click on search results that seem relevant to help you learn about laptop options</li>
                  <li>You may perform multiple searches if needed</li>
                  <li>Take your time to explore the results thoroughly</li>
                  <li>When you feel you have gathered enough information, click "Finish Task"</li>
                </ul>
              </div>
            </div>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Question 10: Budget Range */}
              <FormField
                control={form.control}
                name="budget_range"
                rules={{ required: "Please select your budget range" }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base font-medium text-gray-900">
                      10. What is your budget range for this laptop purchase? <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select your budget range" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="under-500">Under $500</SelectItem>
                          <SelectItem value="500-1000">$500 - $1,000</SelectItem>
                          <SelectItem value="1000-1500">$1,000 - $1,500</SelectItem>
                          <SelectItem value="1500-2000">$1,500 - $2,000</SelectItem>
                          <SelectItem value="over-2000">Over $2,000</SelectItem>
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
                  {isSubmitting ? "Loading..." : "Continue to Search Task"}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
}