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
interface PostTaskSurveyForm {
  google_satisfaction: string;
  google_ease: string;
  google_relevance: string;
  google_trust: string;
  google_query_modifications: string;
  attention_check: string;
  google_open_feedback: string;
  task_duration: string;
  search_tool_type: string;
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
      google_query_modifications: "",
      attention_check: "",
      google_open_feedback: "",
      task_duration: "",
      search_tool_type: ""
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

            <Form {...form}>
              <form className="space-y-8">
                {/* Question 16: Google Search Satisfaction */}
                <FormField control={form.control} name="google_satisfaction" rules={{
                required: "This field is required"
              }} render={({
                field
              }) => <LikertScale field={field} question="How satisfied were you with your Google search experience?" leftLabel="Not satisfied at all" rightLabel="Very satisfied" questionNumber="16" />} />

                {/* Question 17: Google Search Ease */}
                <FormField control={form.control} name="google_ease" rules={{
                required: "This field is required"
              }} render={({
                field
              }) => <LikertScale field={field} question="How easy was it to use Google's search interface?" leftLabel="Not easy at all" rightLabel="Very easy" questionNumber="17" />} />

                {/* Question 18: Google Search Relevance */}
                <FormField control={form.control} name="google_relevance" rules={{
                required: "This field is required"
              }} render={({
                field
              }) => <LikertScale field={field} question="How relevant were the Google search results to your query?" leftLabel="Not relevant at all" rightLabel="Very relevant" questionNumber="18" />} />

                {/* Question 19: Google Search Trust */}
                <FormField control={form.control} name="google_trust" rules={{
                required: "This field is required"
              }} render={({
                field
              }) => <LikertScale field={field} question="How much did you trust the Google search results?" leftLabel="Do not trust at all" rightLabel="Trust completely" questionNumber="19" />} />

                {/* Question 20: Google Query Modifications */}
                <FormField control={form.control} name="google_query_modifications" rules={{
                required: "This field is required"
              }} render={({
                field
              }) => <FormItem>
                      <FormLabel className="text-base font-medium text-gray-900">
                        20. How many times did you modify your search query on Google? <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <RadioGroup onValueChange={field.onChange} value={field.value} className="flex flex-row flex-wrap gap-4">
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="0" id="mod-0" />
                            <label htmlFor="mod-0" className="text-sm text-gray-700 cursor-pointer">
                              0
                            </label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="1" id="mod-1" />
                            <label htmlFor="mod-1" className="text-sm text-gray-700 cursor-pointer">
                              1
                            </label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="2" id="mod-2" />
                            <label htmlFor="mod-2" className="text-sm text-gray-700 cursor-pointer">
                              2
                            </label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="3" id="mod-3" />
                            <label htmlFor="mod-3" className="text-sm text-gray-700 cursor-pointer">
                              3
                            </label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="4" id="mod-4" />
                            <label htmlFor="mod-4" className="text-sm text-gray-700 cursor-pointer">
                              4
                            </label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="5+" id="mod-5plus" />
                            <label htmlFor="mod-5plus" className="text-sm text-gray-700 cursor-pointer">
                              5+
                            </label>
                          </div>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>} />

                {/* Question 21: Attention Check */}
                <FormField control={form.control} name="attention_check" rules={{
                required: "This field is required"
              }} render={({
                field
              }) => <LikertScale field={field} question="Please select '3' for this question." leftLabel="Strongly disagree" rightLabel="Strongly agree" questionNumber="21" />} />

                {/* Question 22: Google Open Feedback */}
                <FormField control={form.control} name="google_open_feedback" render={({
                field
              }) => <FormItem>
                      <FormLabel className="text-base font-medium text-gray-900">
                        22. Is there anything else you would like to add about your Google search experience? (Optional)
                      </FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Please share any additional thoughts about your Google search experience..."
                          className="min-h-[100px] resize-y"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>} />

                {/* Question 27: Task Duration */}
                <FormField control={form.control} name="task_duration" rules={{
                required: "This field is required"
              }} render={({
                field
              }) => <FormItem>
                      <FormLabel className="text-base font-medium text-gray-900">
                        27. Approximately how long did it take you to complete the task? <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <RadioGroup onValueChange={field.onChange} value={field.value} className="flex flex-col space-y-2">
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="less-than-2" id="less-than-2" />
                            <label htmlFor="less-than-2" className="text-sm text-gray-700 cursor-pointer">
                              Less than 2 minutes
                            </label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="3-5" id="3-5" />
                            <label htmlFor="3-5" className="text-sm text-gray-700 cursor-pointer">
                              3-5 minutes
                            </label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="6-10" id="6-10" />
                            <label htmlFor="6-10" className="text-sm text-gray-700 cursor-pointer">
                              6-10 minutes
                            </label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="more-than-10" id="more-than-10" />
                            <label htmlFor="more-than-10" className="text-sm text-gray-700 cursor-pointer">
                              More than 10 minutes
                            </label>
                          </div>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>} />

                {/* Question 28: Search Tool Type */}
                <FormField control={form.control} name="search_tool_type" rules={{
                required: "This field is required"
              }} render={({
                field
              }) => <FormItem>
                      <FormLabel className="text-base font-medium text-gray-900">
                        28. Which type of search tool did you use during the task? <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <RadioGroup onValueChange={field.onChange} value={field.value} className="flex flex-col space-y-2">
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="traditional-search" id="traditional-search" />
                            <label htmlFor="traditional-search" className="text-sm text-gray-700 cursor-pointer">
                              A traditional search engine showing a list of clickable links (e.g., Google)
                            </label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="conversational-ai" id="conversational-ai" />
                            <label htmlFor="conversational-ai" className="text-sm text-gray-700 cursor-pointer">
                              A conversational AI that provided direct answers in a chat format (e.g., ChatGPT)
                            </label>
                          </div>
                        </RadioGroup>
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