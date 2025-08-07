import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FormControl, FormField, FormItem, FormLabel, FormMessage, Form } from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import LikertScale from "./LikertScale";
import { trackingService } from "@/lib/tracking";
interface PostTaskSurveyForm {
  search_familiarity: string;
  search_confidence: string;
  search_satisfaction: string;
  search_efficiency: string;
  search_ease: string;
  search_usefulness: string;
  search_support: string;
  search_system_ease: string;
  search_again: string;
  advertisement_shameful: string;
  advertisement_hopeful: string;
  task_duration: string;
  search_tool_type: string;
  search_improvement: string;
}
export default function PostTaskSurvey() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const navigate = useNavigate();
  const form = useForm<PostTaskSurveyForm>({
    defaultValues: {
      search_familiarity: "",
      search_confidence: "",
      search_satisfaction: "",
      search_efficiency: "",
      search_ease: "",
      search_usefulness: "",
      search_support: "",
      search_system_ease: "",
      search_again: "",
      advertisement_shameful: "",
      advertisement_hopeful: "",
      task_duration: "",
      search_tool_type: "",
      search_improvement: ""
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
      <div className="min-h-screen bg-background p-6 md:p-8 lg:p-12">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-lg border border-border p-8 md:p-12 lg:p-16 shadow-sm">
            <h1 className="text-2xl font-bold text-center mb-8 text-foreground">
              Search Experience Feedback
            </h1>

            <Form {...form}>
              <form className="space-y-8">
                {/* Question 16: Search Familiarity */}
                <FormField control={form.control} name="search_familiarity" rules={{
                required: "This field is required"
              }} render={({
                field
              }) => <LikertScale field={field} question="How familiar are you with using search interfaces for product research?" leftLabel="Not familiar at all" rightLabel="Extremely familiar" questionNumber="16" />} />

                {/* Question 17: Search Confidence */}
                <FormField control={form.control} name="search_confidence" rules={{
                required: "This field is required"
              }} render={({
                field
              }) => <LikertScale field={field} question="How confident did you feel while using the search interface?" leftLabel="Not confident at all" rightLabel="Extremely confident" questionNumber="17" />} />

                {/* Question 18: Search Satisfaction */}
                <FormField control={form.control} name="search_satisfaction" rules={{
                required: "This field is required"
              }} render={({
                field
              }) => <LikertScale field={field} question="How satisfied are you with your search experience?" leftLabel="Very dissatisfied" rightLabel="Very satisfied" questionNumber="18" />} />

                {/* Question 19: Search Efficiency */}
                <FormField control={form.control} name="search_efficiency" rules={{
                required: "This field is required"
              }} render={({
                field
              }) => <LikertScale field={field} question="How efficiently were you able to find the information you needed?" leftLabel="Very inefficiently" rightLabel="Very efficiently" questionNumber="19" />} />

                {/* Question 20: Search Ease */}
                <FormField control={form.control} name="search_ease" rules={{
                required: "This field is required"
              }} render={({
                field
              }) => <LikertScale field={field} question="How easy was it to use the search interface?" leftLabel="Very difficult" rightLabel="Very easy" questionNumber="20" />} />

                {/* Question 21: Search Usefulness */}
                <FormField control={form.control} name="search_usefulness" rules={{
                required: "This field is required"
              }} render={({
                field
              }) => <LikertScale field={field} question="How useful was the search interface for your task?" leftLabel="Not useful at all" rightLabel="Extremely useful" questionNumber="21" />} />

                {/* Question 22: Search Support */}
                <FormField control={form.control} name="search_support" rules={{
                required: "This field is required"
              }} render={({
                field
              }) => <LikertScale field={field} question="How well did the search interface support your decision-making process?" leftLabel="Very poorly" rightLabel="Very well" questionNumber="22" />} />

                {/* Question 23: System Ease */}
                <FormField control={form.control} name="search_system_ease" rules={{
                required: "This field is required"
              }} render={({
                field
              }) => <LikertScale field={field} question="How easy was it to learn to use the search system?" leftLabel="Very difficult" rightLabel="Very easy" questionNumber="23" />} />

                {/* Question 24: Search Again */}
                <FormField control={form.control} name="search_again" rules={{
                required: "This field is required"
              }} render={({
                field
              }) => <LikertScale field={field} question="How likely would you be to use this search interface again for similar tasks?" leftLabel="Very unlikely" rightLabel="Very likely" questionNumber="24" />} />

                {/* Question 25: Advertisement Shameful */}
                <FormField control={form.control} name="advertisement_shameful" rules={{
                required: "This field is required"
              }} render={({
                field
              }) => <LikertScale field={field} question="The advertisement made me feel" leftLabel="Not Shameful" rightLabel="Shameful" questionNumber="25" />} />

                {/* Question 26: Advertisement Hopeful */}
                <FormField control={form.control} name="advertisement_hopeful" rules={{
                required: "This field is required"
              }} render={({
                field
              }) => <LikertScale field={field} question="The advertisement made me feel" leftLabel="Not hopeful" rightLabel="Hopeful" questionNumber="26" />} />

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
                <div className="flex justify-between pt-8 px-4 md:px-8 lg:px-12">
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