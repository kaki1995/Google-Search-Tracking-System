import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FormControl, FormField, FormItem, FormLabel, FormMessage, Form } from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import LikertScale from "./LikertScale";

import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { sessionManager } from "@/lib/sessionManager";
import useResponsePersistence from "@/hooks/useResponsePersistence";
interface PostTaskSurveyForm {
  q19_topic_familiarity: string;
  q20_google_ease: string;
  q21_google_satisfaction: string;
  q22_google_relevance: string;
  q23_google_trust: string;
  q24_contradictory_handling: string[];
  q25_tool_effectiveness: string;
  q26_task_duration: string;
  q27_first_response_satisfaction: string;
  q28_attention_check: string;
  q29_future_usage_feedback: string;
}
export default function PostTaskSurvey() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const navigate = useNavigate();
  const form = useForm<PostTaskSurveyForm>({
    defaultValues: {
      q19_topic_familiarity: "",
      q20_google_ease: "",
      q21_google_satisfaction: "",
      q22_google_relevance: "",
      q23_google_trust: "",
      q24_contradictory_handling: [],
      q25_tool_effectiveness: "",
      q26_task_duration: "",
      q27_first_response_satisfaction: "",
      q28_attention_check: "",
      q29_future_usage_feedback: ""
    }
  });

  // Use the enhanced response persistence hook
  const { saveResponses } = useResponsePersistence(form, 'post_task_survey');
  const handleSubmit = () => {
    setShowConfirmDialog(true);
  };
  const handleConfirmSubmission = async () => {
    setIsSubmitting(true);
    try {
      const values = form.getValues();
      const participant_id = localStorage.getItem('participant_id') || sessionManager.getParticipantId();
      let session_id = sessionManager.getSessionId() || localStorage.getItem('session_id');

      // Fallback to cached session bundle
      if (!session_id) {
        try {
          const cached = JSON.parse(localStorage.getItem('google_search_session') || '{}');
          session_id = cached?.sessionId || null;
        } catch {}
      }

      // As a last resort, try to re-ensure the session on the backend
      if (!session_id && participant_id) {
        const ensured = await sessionManager.ensureSession();
        if (ensured) session_id = ensured;
      }

      if (!participant_id) {
        toast({
          title: 'Missing participant',
          description: 'Participant ID not found. Please start the study from the beginning.',
          variant: 'destructive',
        });
        setShowConfirmDialog(false);
        return;
      }

      if (!session_id) {
        toast({
          title: 'Missing session',
          description: 'Session ID not found. Please start the study from the beginning.',
          variant: 'destructive',
        });
        setShowConfirmDialog(false);
        return;
      }

      const responses = {
        q19_topic_familiarity: Number(values.q19_topic_familiarity || 0),
        q20_google_ease: Number(values.q20_google_ease || 0),
        q21_google_satisfaction: Number(values.q21_google_satisfaction || 0),
        q22_google_relevance: Number(values.q22_google_relevance || 0),
        q23_google_trust: Number(values.q23_google_trust || 0),
        q24_contradictory_handling: String((values.q24_contradictory_handling || []).join(', ')),
        q25_tool_effectiveness: Number(values.q25_tool_effectiveness || 0),
        q26_task_duration: String(values.q26_task_duration || ''),
        q27_first_response_satisfaction: Number(values.q27_first_response_satisfaction || 0),
        q28_attention_check: Number(values.q28_attention_check || 0),
        q29_future_usage_feedback: String(values.q29_future_usage_feedback || ''),
      };

      const { data: resp, error } = await supabase.functions.invoke('submit-post-task-survey', {
        body: { participant_id, session_id, responses },
      });

      if (error || !resp?.ok) {
        const msg = error?.message || resp?.error || 'Failed to submit post-task survey';
        throw new Error(msg);
      }

      // Clear saved form data after successful submission
      sessionManager.clearResponses('post_task_survey');
      toast({ title: 'Thank you!', description: 'Your feedback has been submitted.' });

      setShowConfirmDialog(false);
      navigate('/thank-you');
    } catch (error: any) {
      console.error('Error submitting survey:', error);
      toast({ title: 'Submission failed', description: error?.message || 'Please try again.', variant: 'destructive' });
      setShowConfirmDialog(false);
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

                {/* Q19 */}
                <FormField control={form.control} name="q19_topic_familiarity" rules={{ required: "This field is required" }} render={({ field }) => (
                  <LikertScale field={field} question="How familiar were you with the topic of this task before starting?" leftLabel="Not familiar at all" rightLabel="Very familiar" questionNumber="19" />
                )} />

                {/* Q20 */}
                <FormField control={form.control} name="q20_google_ease" rules={{ required: "This field is required" }} render={({ field }) => (
                  <LikertScale field={field} question="How easy was it to use the search interface?" leftLabel="Not easy at all" rightLabel="Very easy" questionNumber="20" />
                )} />

                {/* Q21 */}
                <FormField control={form.control} name="q21_google_satisfaction" rules={{ required: "This field is required" }} render={({ field }) => (
                  <LikertScale field={field} question="How satisfied were you with your overall search experience?" leftLabel="Not satisfied at all" rightLabel="Very satisfied" questionNumber="21" />
                )} />

                {/* Q22 */}
                <FormField control={form.control} name="q22_google_relevance" rules={{ required: "This field is required" }} render={({ field }) => (
                  <LikertScale field={field} question="How relevant were the search results to your query?" leftLabel="Not relevant at all" rightLabel="Very relevant" questionNumber="22" />
                )} />

                {/* Q23 */}
                <FormField control={form.control} name="q23_google_trust" rules={{ required: "This field is required" }} render={({ field }) => (
                  <LikertScale field={field} question="To what degree do you trust the information provided by the search tool?" leftLabel="Do not trust at all" rightLabel="Trust completely" questionNumber="23" />
                )} />

                {/* Q24 */}
                <FormField control={form.control} name="q24_contradictory_handling" rules={{ required: "Please select at least one option" }} render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base font-medium text-gray-900">
                      24. If you found contradictory information in the responses you received, how did you handle it? (Select all that apply) <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <div className="space-y-2">
                        {[
                          { value: "first_response", label: "I trusted the first response I got" },
                          { value: "additional_sources", label: "I asked more questions or looked for additional sources" },
                          { value: "most_detailed", label: "I chose the response that seemed most detailed or complete" },
                          { value: "own_judgment", label: "I relied on my own knowledge or judgment" },
                          { value: "no_contradictions", label: "I did not find any contradictions" },
                          { value: "other", label: "Other" }
                        ].map((option) => (
                          <label key={option.value} className="flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              value={option.value}
                              checked={field.value?.includes(option.value) || false}
                              onChange={(e) => {
                                const current = field.value || [];
                                if (e.target.checked) {
                                  field.onChange([...current, option.value]);
                                } else {
                                  field.onChange(current.filter(item => item !== option.value));
                                }
                              }}
                              className="mr-2"
                            />
                            <span className="text-sm">{option.label}</span>
                          </label>
                        ))}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                {/* Q25 */}
                <FormField control={form.control} name="q25_tool_effectiveness" rules={{ required: "This field is required" }} render={({ field }) => (
                  <LikertScale field={field} question="How effectively did the search tool help you complete the task?" leftLabel="Not effective at all" rightLabel="Very effective" questionNumber="25" />
                )} />

                {/* Q26 */}
                <FormField control={form.control} name="q26_task_duration" rules={{ required: "This field is required" }} render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base font-medium text-gray-900">
                      26. Approximately how much time (in minutes) did you spend on the search interface before deciding on a smartphone? <span className="text-red-500">*</span>
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
                  </FormItem>
                )} />

                {/* Q27 */}
                <FormField control={form.control} name="q27_first_response_satisfaction" rules={{ required: "This field is required" }} render={({ field }) => (
                  <LikertScale field={field} question="How satisfied were you with the first response?" leftLabel="Not satisfied at all" rightLabel="Very satisfied" questionNumber="27" />
                )} />

                {/* Q28 */}
                <FormField control={form.control} name="q28_attention_check" rules={{ required: "This field is required" }} render={({ field }) => (
                  <LikertScale field={field} question='Please select "3" for this question.' leftLabel="Strongly disagree" rightLabel="Strongly agree" questionNumber="28" />
                )} />

                {/* Q29 */}
                <FormField control={form.control} name="q29_future_usage_feedback" rules={{ required: "This field is required" }} render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base font-medium text-gray-900">
                      29. Thinking about your experience with this version of Google Search, would you consider using it again in the future for other shopping-related tasks? Please explain why or why not. <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Please explain your thoughts about using this search tool in the future"
                        className="min-h-[100px] resize-y"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />


                {/* Buttons */}
                <div className="flex justify-between pt-8">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={async () => {
                      const values = form.getValues();
                      await saveResponses(values);
                      navigate('/search-result-log');
                    }} 
                    className="px-8 py-2 text-sm font-medium border-2"
                  >
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