import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { trackingService } from "@/lib/tracking";

const postTaskFormSchema = z.object({
  familiarity: z.string().min(1, "This field is required"),
  satisfaction: z.string().min(1, "This field is required"),
  relevance: z.string().min(1, "This field is required"),
  understanding: z.string().min(1, "This field is required"),
  easeOfUse: z.string().min(1, "This field is required"),
  trust: z.string().min(1, "This field is required"),
  usefulness: z.string().min(1, "This field is required"),
  dataQuality: z.string().min(1, "This field is required"),
  difficulty: z.string().min(1, "This field is required"),
  timeSpent: z.string().min(1, "This field is required"),
  searchType: z.string().min(1, "This field is required"),
});

type PostTaskForm = z.infer<typeof postTaskFormSchema>;

export default function PostTaskSurvey() {
  const navigate = useNavigate();
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<PostTaskForm>({
    resolver: zodResolver(postTaskFormSchema),
  });

  const onSubmit = (data: PostTaskForm) => {
    setShowConfirmDialog(true);
  };

  const handleConfirmSubmission = async () => {
    setIsSubmitting(true);
    try {
      const formData = form.getValues();
      await trackingService.trackEvent('post_task_survey_completed');
      setShowConfirmDialog(false);
      navigate('/thank-you');
    } catch (error) {
      console.error('Error submitting survey:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReturnToPrevious = () => {
    setShowConfirmDialog(false);
  };

  const scaleOptions = [
    { value: "1", label: "1 - Not at all familiar" },
    { value: "2", label: "2" },
    { value: "3", label: "3" },
    { value: "4", label: "4" },
    { value: "5", label: "5" },
    { value: "6", label: "6" },
    { value: "7", label: "7 - Extremely familiar" }
  ];

  const satisfactionOptions = [
    { value: "1", label: "1 - Not at all satisfied" },
    { value: "2", label: "2" },
    { value: "3", label: "3" },
    { value: "4", label: "4" },
    { value: "5", label: "5" },
    { value: "6", label: "6" },
    { value: "7", label: "7 - Extremely satisfied" }
  ];

  const relevanceOptions = [
    { value: "1", label: "1 - Not relevant at all" },
    { value: "2", label: "2" },
    { value: "3", label: "3" },
    { value: "4", label: "4" },
    { value: "5", label: "5" },
    { value: "6", label: "6" },
    { value: "7", label: "7 - Highly relevant" }
  ];

  const easeOptions = [
    { value: "1", label: "1 - Not easy at all" },
    { value: "2", label: "2" },
    { value: "3", label: "3" },
    { value: "4", label: "4" },
    { value: "5", label: "5" },
    { value: "6", label: "6" },
    { value: "7", label: "7 - Very easy" }
  ];

  const trustOptions = [
    { value: "1", label: "1 - Not trust at all" },
    { value: "2", label: "2" },
    { value: "3", label: "3" },
    { value: "4", label: "4" },
    { value: "5", label: "5" },
    { value: "6", label: "6" },
    { value: "7", label: "7 - Completely trust" }
  ];

  const usefulnessOptions = [
    { value: "1", label: "1 - Not useful at all" },
    { value: "2", label: "2" },
    { value: "3", label: "3" },
    { value: "4", label: "4" },
    { value: "5", label: "5" },
    { value: "6", label: "6" },
    { value: "7", label: "7 - Extremely useful" }
  ];

  const difficultyOptions = [
    { value: "1", label: "1 - Not difficult at all" },
    { value: "2", label: "2" },
    { value: "3", label: "3" },
    { value: "4", label: "4" },
    { value: "5", label: "5" },
    { value: "6", label: "6" },
    { value: "7", label: "7 - Very difficult" }
  ];

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <Card className="bg-white shadow-sm">
          <CardHeader className="text-center pb-6">
            <CardTitle className="text-3xl font-semibold text-gray-900">Search Experience Feedback</CardTitle>
            <p className="text-gray-600 mt-2">Please answer the following questions based on your experience during the task.</p>
          </CardHeader>
          <CardContent className="space-y-8">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                
                {/* Question 16 */}
                <FormField
                  control={form.control}
                  name="familiarity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-medium text-gray-900">
                        16. How familiar were you with the topic of this task before starting? <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          value={field.value}
                          className="grid grid-cols-1 gap-2"
                        >
                          {scaleOptions.map((option) => (
                            <div key={option.value} className="flex items-center space-x-2">
                              <RadioGroupItem value={option.value} id={`familiarity-${option.value}`} />
                              <label htmlFor={`familiarity-${option.value}`} className="text-sm text-gray-700 cursor-pointer">
                                {option.label}
                              </label>
                            </div>
                          ))}
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Question 17 */}
                <FormField
                  control={form.control}
                  name="satisfaction"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-medium text-gray-900">
                        17. How satisfied were you with your overall search experience? <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          value={field.value}
                          className="grid grid-cols-1 gap-2"
                        >
                          {satisfactionOptions.map((option) => (
                            <div key={option.value} className="flex items-center space-x-2">
                              <RadioGroupItem value={option.value} id={`satisfaction-${option.value}`} />
                              <label htmlFor={`satisfaction-${option.value}`} className="text-sm text-gray-700 cursor-pointer">
                                {option.label}
                              </label>
                            </div>
                          ))}
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Question 18 */}
                <FormField
                  control={form.control}
                  name="relevance"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-medium text-gray-900">
                        18. How relevant were the search results you received? <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          value={field.value}
                          className="grid grid-cols-1 gap-2"
                        >
                          {relevanceOptions.map((option) => (
                            <div key={option.value} className="flex items-center space-x-2">
                              <RadioGroupItem value={option.value} id={`relevance-${option.value}`} />
                              <label htmlFor={`relevance-${option.value}`} className="text-sm text-gray-700 cursor-pointer">
                                {option.label}
                              </label>
                            </div>
                          ))}
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Question 19 */}
                <FormField
                  control={form.control}
                  name="understanding"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-medium text-gray-900">
                        19. How easy was it to understand the information in the search results? <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          value={field.value}
                          className="grid grid-cols-1 gap-2"
                        >
                          {easeOptions.map((option) => (
                            <div key={option.value} className="flex items-center space-x-2">
                              <RadioGroupItem value={option.value} id={`understanding-${option.value}`} />
                              <label htmlFor={`understanding-${option.value}`} className="text-sm text-gray-700 cursor-pointer">
                                {option.label}
                              </label>
                            </div>
                          ))}
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Question 20 */}
                <FormField
                  control={form.control}
                  name="easeOfUse"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-medium text-gray-900">
                        20. How easy was it to use the search tool? <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          value={field.value}
                          className="grid grid-cols-1 gap-2"
                        >
                          {easeOptions.map((option) => (
                            <div key={option.value} className="flex items-center space-x-2">
                              <RadioGroupItem value={option.value} id={`easeOfUse-${option.value}`} />
                              <label htmlFor={`easeOfUse-${option.value}`} className="text-sm text-gray-700 cursor-pointer">
                                {option.label}
                              </label>
                            </div>
                          ))}
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Question 21 */}
                <FormField
                  control={form.control}
                  name="trust"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-medium text-gray-900">
                        21. How much did you trust the results provided by the search tool? <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          value={field.value}
                          className="grid grid-cols-1 gap-2"
                        >
                          {trustOptions.map((option) => (
                            <div key={option.value} className="flex items-center space-x-2">
                              <RadioGroupItem value={option.value} id={`trust-${option.value}`} />
                              <label htmlFor={`trust-${option.value}`} className="text-sm text-gray-700 cursor-pointer">
                                {option.label}
                              </label>
                            </div>
                          ))}
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Question 22 */}
                <FormField
                  control={form.control}
                  name="usefulness"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-medium text-gray-900">
                        22. How useful was the search tool in helping you complete the task? <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          value={field.value}
                          className="grid grid-cols-1 gap-2"
                        >
                          {usefulnessOptions.map((option) => (
                            <div key={option.value} className="flex items-center space-x-2">
                              <RadioGroupItem value={option.value} id={`usefulness-${option.value}`} />
                              <label htmlFor={`usefulness-${option.value}`} className="text-sm text-gray-700 cursor-pointer">
                                {option.label}
                              </label>
                            </div>
                          ))}
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Question 23 */}
                <FormField
                  control={form.control}
                  name="dataQuality"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-medium text-gray-900">
                        23. To help us ensure data quality, please select "2" for this question. <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          value={field.value}
                          className="grid grid-cols-1 gap-2"
                        >
                          {[1,2,3,4,5,6,7].map((num) => (
                            <div key={num} className="flex items-center space-x-2">
                              <RadioGroupItem value={num.toString()} id={`dataQuality-${num}`} />
                              <label htmlFor={`dataQuality-${num}`} className="text-sm text-gray-700 cursor-pointer">
                                {num}
                              </label>
                            </div>
                          ))}
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Question 24 */}
                <FormField
                  control={form.control}
                  name="difficulty"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-medium text-gray-900">
                        24. Did you find the task difficult? <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          value={field.value}
                          className="grid grid-cols-1 gap-2"
                        >
                          {difficultyOptions.map((option) => (
                            <div key={option.value} className="flex items-center space-x-2">
                              <RadioGroupItem value={option.value} id={`difficulty-${option.value}`} />
                              <label htmlFor={`difficulty-${option.value}`} className="text-sm text-gray-700 cursor-pointer">
                                {option.label}
                              </label>
                            </div>
                          ))}
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Question 25 */}
                <FormField
                  control={form.control}
                  name="timeSpent"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-medium text-gray-900">
                        25. Approximately how long did it take you to complete the task? <span className="text-red-500">*</span>
                      </FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select time range" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="less-than-2">Less than 2 minutes</SelectItem>
                          <SelectItem value="3-5">3-5 minutes</SelectItem>
                          <SelectItem value="6-10">6-10 minutes</SelectItem>
                          <SelectItem value="more-than-10">More than 10 minutes</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Question 26 */}
                <FormField
                  control={form.control}
                  name="searchType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-medium text-gray-900">
                        26. Which type of search tool did you use during the task? <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          value={field.value}
                          className="space-y-2"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="traditional" id="traditional" />
                            <label htmlFor="traditional" className="text-sm text-gray-700 cursor-pointer">
                              A traditional search engine showing a list of clickable links (e.g., Google)
                            </label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="conversational" id="conversational" />
                            <label htmlFor="conversational" className="text-sm text-gray-700 cursor-pointer">
                              A conversational AI that provided direct answers in a chat format (e.g., ChatGPT)
                            </label>
                          </div>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-between pt-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate('/search-result-log')}
                    className="px-6"
                  >
                    Previous Page
                  </Button>
                  <Button type="submit" className="px-8">
                    Submission
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirm Submission</DialogTitle>
            <DialogDescription>
              Are you sure you want to submit your responses? Once submitted, you cannot make changes.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={handleReturnToPrevious}>
              Return
            </Button>
            <Button onClick={handleConfirmSubmission} disabled={isSubmitting}>
              {isSubmitting ? "Submitting..." : "Yes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}