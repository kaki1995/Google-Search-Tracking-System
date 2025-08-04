import { useState } from "react";
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
  search_enjoyable: string;
  search_preference: string;
  search_improvement: string;
}

export default function PostTaskSurvey() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const navigate = useNavigate();
  const form = useForm<PostTaskSurveyForm>();

  const handleSubmit = () => {
    setShowConfirmDialog(true);
  };

  const handleConfirmSubmission = async () => {
    setIsSubmitting(true);
    try {
      const formData = form.getValues();
      await trackingService.trackEvent({
        type: 'survey',
        timestamp: Date.now(),
        data: { type: 'post_task_survey_completed', formData }
      });
      setShowConfirmDialog(false);
      navigate('/thank-you');
    } catch (error) {
      console.error('Error submitting survey:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg border border-border p-8 shadow-sm">
            <h1 className="text-2xl font-bold text-center mb-8 text-foreground">
              Search Experience Feedback
            </h1>

            <Form {...form}>
              <form className="space-y-8">
                {/* Question 16: Search Familiarity */}
                <FormField
                  control={form.control}
                  name="search_familiarity"
                  rules={{ required: "This field is required" }}
                  render={({ field }) => (
                    <LikertScale
                      field={field}
                      question="How familiar are you with using search interfaces for product research?"
                      leftLabel="Not familiar at all"
                      rightLabel="Extremely familiar"
                      questionNumber="16"
                    />
                  )}
                />

                {/* Question 17: Search Confidence */}
                <FormField
                  control={form.control}
                  name="search_confidence"
                  rules={{ required: "This field is required" }}
                  render={({ field }) => (
                    <LikertScale
                      field={field}
                      question="How confident did you feel while using the search interface?"
                      leftLabel="Not confident at all"
                      rightLabel="Extremely confident"
                      questionNumber="17"
                    />
                  )}
                />

                {/* Question 18: Search Satisfaction */}
                <FormField
                  control={form.control}
                  name="search_satisfaction"
                  rules={{ required: "This field is required" }}
                  render={({ field }) => (
                    <LikertScale
                      field={field}
                      question="How satisfied are you with your search experience?"
                      leftLabel="Very dissatisfied"
                      rightLabel="Very satisfied"
                      questionNumber="18"
                    />
                  )}
                />

                {/* Question 19: Search Efficiency */}
                <FormField
                  control={form.control}
                  name="search_efficiency"
                  rules={{ required: "This field is required" }}
                  render={({ field }) => (
                    <LikertScale
                      field={field}
                      question="How efficiently were you able to find the information you needed?"
                      leftLabel="Very inefficiently"
                      rightLabel="Very efficiently"
                      questionNumber="19"
                    />
                  )}
                />

                {/* Question 20: Search Ease */}
                <FormField
                  control={form.control}
                  name="search_ease"
                  rules={{ required: "This field is required" }}
                  render={({ field }) => (
                    <LikertScale
                      field={field}
                      question="How easy was it to use the search interface?"
                      leftLabel="Very difficult"
                      rightLabel="Very easy"
                      questionNumber="20"
                    />
                  )}
                />

                {/* Question 21: Search Usefulness */}
                <FormField
                  control={form.control}
                  name="search_usefulness"
                  rules={{ required: "This field is required" }}
                  render={({ field }) => (
                    <LikertScale
                      field={field}
                      question="How useful was the search interface for your task?"
                      leftLabel="Not useful at all"
                      rightLabel="Extremely useful"
                      questionNumber="21"
                    />
                  )}
                />

                {/* Question 22: Search Support */}
                <FormField
                  control={form.control}
                  name="search_support"
                  rules={{ required: "This field is required" }}
                  render={({ field }) => (
                    <LikertScale
                      field={field}
                      question="How well did the search interface support your decision-making process?"
                      leftLabel="Very poorly"
                      rightLabel="Very well"
                      questionNumber="22"
                    />
                  )}
                />

                {/* Question 23: System Ease */}
                <FormField
                  control={form.control}
                  name="search_system_ease"
                  rules={{ required: "This field is required" }}
                  render={({ field }) => (
                    <LikertScale
                      field={field}
                      question="How easy was it to learn to use the search system?"
                      leftLabel="Very difficult"
                      rightLabel="Very easy"
                      questionNumber="23"
                    />
                  )}
                />

                {/* Question 24: Search Again */}
                <FormField
                  control={form.control}
                  name="search_again"
                  rules={{ required: "This field is required" }}
                  render={({ field }) => (
                    <LikertScale
                      field={field}
                      question="How likely would you be to use this search interface again for similar tasks?"
                      leftLabel="Very unlikely"
                      rightLabel="Very likely"
                      questionNumber="24"
                    />
                  )}
                />

                {/* Question 25: Search Enjoyable - Dropdown */}
                <FormField
                  control={form.control}
                  name="search_enjoyable"
                  rules={{ required: "This field is required" }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-medium text-gray-900">
                        25. How enjoyable was your search experience? <span className="text-red-500">*</span>
                      </FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select your answer" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="very-unenjoyable">Very unenjoyable</SelectItem>
                          <SelectItem value="unenjoyable">Unenjoyable</SelectItem>
                          <SelectItem value="neutral">Neutral</SelectItem>
                          <SelectItem value="enjoyable">Enjoyable</SelectItem>
                          <SelectItem value="very-enjoyable">Very enjoyable</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Question 26: Search Preference - Radio buttons */}
                <FormField
                  control={form.control}
                  name="search_preference"
                  rules={{ required: "This field is required" }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-medium text-gray-900">
                        26. Compared to other search methods you typically use, how would you rate this interface? <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          value={field.value}
                          className="flex flex-col space-y-2"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="much-worse" id="much-worse" />
                            <label htmlFor="much-worse" className="text-sm text-gray-700 cursor-pointer">
                              Much worse than usual
                            </label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="worse" id="worse" />
                            <label htmlFor="worse" className="text-sm text-gray-700 cursor-pointer">
                              Worse than usual
                            </label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="about-same" id="about-same" />
                            <label htmlFor="about-same" className="text-sm text-gray-700 cursor-pointer">
                              About the same as usual
                            </label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="better" id="better" />
                            <label htmlFor="better" className="text-sm text-gray-700 cursor-pointer">
                              Better than usual
                            </label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="much-better" id="much-better" />
                            <label htmlFor="much-better" className="text-sm text-gray-700 cursor-pointer">
                              Much better than usual
                            </label>
                          </div>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Buttons */}
                <div className="flex justify-between pt-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate('/search-result-log')}
                    className="px-6"
                  >
                    Previous Page
                  </Button>
                  <Button
                    type="button"
                    onClick={form.handleSubmit(handleSubmit)}
                    className="px-8"
                  >
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
    </>
  );
}