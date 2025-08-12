import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FormControl, FormField, FormItem, FormLabel, FormMessage, Form } from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import LikertScale from "./LikertScale";
import { trackingService } from "@/lib/tracking";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
interface PostTaskSurveyForm {
  google_satisfaction: string;
  google_ease: string;
  google_relevance: string;
  google_trust: string;
  topic_familiarity: string;
  tool_effectiveness: string;
  attention_check: string;
  task_duration: string;
  google_open_feedback: string;
}
export default function PostTaskSurvey() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const navigate = useNavigate();
  const form = useForm<PostTaskSurveyForm>({
    defaultValues: {
      google_satisfaction: "",
      google_ease: "",
      google_relevance: "",
      google_trust: "",
      topic_familiarity: "",
      tool_effectiveness: "",
      attention_check: "",
      task_duration: "",
      google_open_feedback: ""
    }
  });

  // Load saved form data on component mount
  useEffect(() => {
    const savedData = localStorage.getItem('post_task_survey_data');
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        form.reset(parsedData);
      } catch (error) {
        console.error('Error parsing saved post-task survey data:', error);
      }
    }
  }, [form]);

  // Save form data whenever form values change
  useEffect(() => {
    const subscription = form.watch((value) => {
      localStorage.setItem('post_task_survey_data', JSON.stringify(value));
    });
    return () => subscription.unsubscribe();
  }, [form]);
  const handleSubmit = () => {
    setShowConfirmDialog(true);
  };
  const handleConfirmSubmission = async () => {
    setIsSubmitting(true);
    try {
      const formData = form.getValues();
      console.log('Submitting post-task survey:', formData);
      
      // Call the correct tracking function for post-task survey
      await trackingService.trackPostTaskSurvey(formData);
      
      console.log('Post-task survey submitted successfully');
      
      // Clear saved form data after successful submission
      localStorage.removeItem('post_task_survey_data');
      
      setShowConfirmDialog(false);
      navigate('/thank-you');
    } catch (error) {
      console.error('Error submitting survey:', error);
      // Still allow navigation even if tracking fails
      setShowConfirmDialog(false);
      navigate('/thank-you');
    } finally {
      setIsSubmitting(false);
    }
  };
  return <>
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
              Search Experience Feedback
            </h1>

            <div className="mb-6 p-4 rounded-lg border border-blue-200 bg-sky-100">
              <p className="text-gray-700 text-sm flex items-start gap-2">
                <span className="text-blue-600 text-lg flex-shrink-0">📝</span>
                <span className="text-justify">
                  Please answer the following questions based on your search experience in this study.<br />
                  (You may return to the previous page using the "Previous Page" button if needed.)
                </span>
              </p>
            </div>

            <Form {...form}>
              <form className="space-y-8">
                {/* Question 16: Google Search Satisfaction */}
                <FormField control={form.control} name="google_satisfaction" rules={{
                required: "This field is required"
              }} render={({
                field
              }) => <LikertScale field={field} question="I was satisfied with my overall search experience." leftLabel="Not satisfied at all" rightLabel="Very satisfied" questionNumber="16" />} />

                {/* Question 17: Google Search Ease */}
                <FormField control={form.control} name="google_ease" rules={{
                required: "This field is required"
              }} render={({
                field
              }) => <LikertScale field={field} question="I found the search interface easy to use." leftLabel="Not easy at all" rightLabel="Very easy" questionNumber="17" />} />

                {/* Question 18: Google Search Relevance */}
                <FormField control={form.control} name="google_relevance" rules={{
                required: "This field is required"
              }} render={({
                field
              }) => <LikertScale field={field} question="The Google search results were relevant to my query." leftLabel="Not relevant at all" rightLabel="Very relevant" questionNumber="18" />} />

                {/* Question 19: Google Search Trust */}
                <FormField control={form.control} name="google_trust" rules={{
                required: "This field is required"
              }} render={({
                field
              }) => <LikertScale field={field} question="I trusted the information provided by the tool in the search results." leftLabel="Do not trust at all" rightLabel="Trust completely" questionNumber="19" />} />

                {/* Question 20: Topic Familiarity */}
                <FormField control={form.control} name="topic_familiarity" rules={{
                required: "This field is required"
              }} render={({
                field
              }) => <LikertScale field={field} question="I was familiar with the topic of this task before starting." leftLabel="Strongly disagree" rightLabel="Strongly agree" questionNumber="20" />} />

                {/* Question 21: Tool Effectiveness */}
                <FormField control={form.control} name="tool_effectiveness" rules={{
                required: "This field is required"
              }} render={({
                field
              }) => <LikertScale field={field} question="The search tool helped me complete the task effectively." leftLabel="Strongly disagree" rightLabel="Strongly agree" questionNumber="21" />} />

                {/* Question 22: Attention Check */}
                <FormField control={form.control} name="attention_check" rules={{
                required: "This field is required"
              }} render={({
                field
              }) => <LikertScale field={field} question="Please select '3' for this question." leftLabel="Strongly disagree" rightLabel="Strongly agree" questionNumber="22" />} />

                {/* Question 23: Task Duration */}
                <FormField control={form.control} name="task_duration" rules={{
                required: "This field is required"
              }} render={({
                field
              }) => <FormItem>
                      <FormLabel className="text-base font-medium text-gray-900">
                        23. Approximately how long did it take you to complete the task? <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select duration" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="less-than-2">Less than 2 minutes</SelectItem>
                            <SelectItem value="3-5">3–5 minutes</SelectItem>
                            <SelectItem value="6-10">6–10 minutes</SelectItem>
                            <SelectItem value="more-than-10">More than 10 minutes</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>} />

                {/* Question 24: Additional Feedback (Optional) */}
                <FormField control={form.control} name="google_open_feedback" render={({
                field
              }) => <FormItem>
                      <FormLabel className="text-base font-medium text-gray-900">
                        24. Please share any additional details about your experience with Google search — for example, did you also use other tools or websites to help with your purchase decision, compare prices, read reviews, or gather product information? <span className="text-sm font-normal text-gray-600">(Optional)</span>
                      </FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Add any additional details about your search experience (optional)"
                          className="min-h-[100px] resize-y"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>} />


                {/* Buttons */}
                <div className="flex justify-between pt-8">
                  <Button type="button" variant="outline" onClick={() => navigate('/search-result-log')} className="px-8 py-2 text-sm font-medium border-2">
                    Previous Page
                  </Button>
                  <Button type="button" onClick={form.handleSubmit(handleSubmit)} className="px-8 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700">
                    Submit Survey
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Submission</DialogTitle>
            <DialogDescription>
              Are you sure you want to submit your survey? Once submitted, you cannot make changes.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
              Return
            </Button>
            <Button onClick={handleConfirmSubmission} disabled={isSubmitting}>
              {isSubmitting ? "Submitting..." : "Yes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>;
}