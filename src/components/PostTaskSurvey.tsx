import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { FormControl, FormField, FormItem, FormLabel, FormMessage, Form } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import LikertScale from "./LikertScale";

import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { sessionManager } from "@/lib/sessionManager";
import useResponsePersistence from "@/hooks/useResponsePersistence";

interface PostTaskSurveyForm {
  // Task Section
  q1_task_easy: string;
  q2_task_quick: string;
  q3_task_familiar: string;
  
  // Search Tool Section
  q4_tool_reliable: string;
  q5_tool_practical: string;
  q6_tool_like: string;
  q7_tool_easy_use: string;
  q8_tool_clear_interaction: string;
  q9_tool_control: string;
  q10_tool_provides_info: string;
  q11_tool_helps_complete: string;
  q12_tool_useful: string;
  q13_tool_too_much_info: string;
  q14_tool_hard_focus: string;
  
  // Search Results Section
  q15_results_accurate: string;
  q16_results_trustworthy: string;
  q17_results_complete: string;
  q18_results_relevant: string;
  q19_results_useful: string;
  
  // Purchase Intention Section
  q20_purchase_likelihood: string;
  
  // Additional Questions
  q21_contradictory_handling: string[];
  q22_attention_check: string;
  q23_time_spent: string;
  q24_future_usage_feedback: string;
}

export default function PostTaskSurvey() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const navigate = useNavigate();
  
  const form = useForm<PostTaskSurveyForm>({
    defaultValues: {
      q1_task_easy: "",
      q2_task_quick: "",
      q3_task_familiar: "",
      q4_tool_reliable: "",
      q5_tool_practical: "",
      q6_tool_like: "",
      q7_tool_easy_use: "",
      q8_tool_clear_interaction: "",
      q9_tool_control: "",
      q10_tool_provides_info: "",
      q11_tool_helps_complete: "",
      q12_tool_useful: "",
      q13_tool_too_much_info: "",
      q14_tool_hard_focus: "",
      q15_results_accurate: "",
      q16_results_trustworthy: "",
      q17_results_complete: "",
      q18_results_relevant: "",
      q19_results_useful: "",
      q20_purchase_likelihood: "",
      q21_contradictory_handling: [],
      q22_attention_check: "",
      q23_time_spent: "",
      q24_future_usage_feedback: ""
    }
  });

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

      if (!session_id) {
        try {
          const cached = JSON.parse(localStorage.getItem('google_search_session') || '{}');
          session_id = cached?.sessionId || null;
        } catch {}
      }

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
        q1_task_easy: Number(values.q1_task_easy || 0),
        q2_task_quick: Number(values.q2_task_quick || 0),
        q3_task_familiar: Number(values.q3_task_familiar || 0),
        q4_tool_reliable: Number(values.q4_tool_reliable || 0),
        q5_tool_practical: Number(values.q5_tool_practical || 0),
        q6_tool_like: Number(values.q6_tool_like || 0),
        q7_tool_easy_use: Number(values.q7_tool_easy_use || 0),
        q8_tool_clear_interaction: Number(values.q8_tool_clear_interaction || 0),
        q9_tool_control: Number(values.q9_tool_control || 0),
        q10_tool_provides_info: Number(values.q10_tool_provides_info || 0),
        q11_tool_helps_complete: Number(values.q11_tool_helps_complete || 0),
        q12_tool_useful: Number(values.q12_tool_useful || 0),
        q13_tool_too_much_info: Number(values.q13_tool_too_much_info || 0),
        q14_tool_hard_focus: Number(values.q14_tool_hard_focus || 0),
        q15_results_accurate: Number(values.q15_results_accurate || 0),
        q16_results_trustworthy: Number(values.q16_results_trustworthy || 0),
        q17_results_complete: Number(values.q17_results_complete || 0),
        q18_results_relevant: Number(values.q18_results_relevant || 0),
        q19_results_useful: Number(values.q19_results_useful || 0),
        q20_purchase_likelihood: Number(values.q20_purchase_likelihood || 0),
        q21_contradictory_handling: values.q21_contradictory_handling || [],
        q22_attention_check: Number(values.q22_attention_check || 0),
        q23_time_spent: String(values.q23_time_spent || ''),
        q24_future_usage_feedback: String(values.q24_future_usage_feedback || ''),
      };

      const { data: resp, error } = await supabase.functions.invoke('submit-post-task-survey', {
        body: { participant_id, session_id, responses },
      });

      if (error || !resp?.ok) {
        const msg = error?.message || resp?.error || 'Failed to submit post-task survey';
        throw new Error(msg);
      }

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

              {/* Task Section */}
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900 border-b pb-2">Please indicate how much you agree or disagree with the following statements about your search task.</h2>
                
                <FormField control={form.control} name="q1_task_easy" rules={{ required: "This field is required" }} render={({ field }) => (
                  <LikertScale field={field} question="The task was easy to complete." leftLabel="Strongly Disagree" rightLabel="Strongly Agree" questionNumber="1" />
                )} />

                <FormField control={form.control} name="q2_task_quick" rules={{ required: "This field is required" }} render={({ field }) => (
                  <LikertScale field={field} question="The task took little time to finish." leftLabel="Strongly Disagree" rightLabel="Strongly Agree" questionNumber="2" />
                )} />

                <FormField control={form.control} name="q3_task_familiar" rules={{ required: "This field is required" }} render={({ field }) => (
                  <LikertScale field={field} question="I was familiar with this type of task." leftLabel="Strongly Disagree" rightLabel="Strongly Agree" questionNumber="3" />
                )} />
              </div>

              {/* Search Tool Section */}
              <div className="space-y-6 pt-8">
                <h2 className="text-xl font-semibold text-gray-900 border-b pb-2">Please indicate how much you agree or disagree with the following statements about the search tool.</h2>
                
                <FormField control={form.control} name="q4_tool_reliable" rules={{ required: "This field is required" }} render={({ field }) => (
                  <LikertScale field={field} question="I consider the search tool reliable." leftLabel="Strongly Disagree" rightLabel="Strongly Agree" questionNumber="4" />
                )} />

                <FormField control={form.control} name="q5_tool_practical" rules={{ required: "This field is required" }} render={({ field }) => (
                  <LikertScale field={field} question="The search tool is practical for my needs." leftLabel="Strongly Disagree" rightLabel="Strongly Agree" questionNumber="5" />
                )} />

                <FormField control={form.control} name="q6_tool_like" rules={{ required: "This field is required" }} render={({ field }) => (
                  <LikertScale field={field} question="Overall, I like the search tool." leftLabel="Strongly Disagree" rightLabel="Strongly Agree" questionNumber="6" />
                )} />

                <FormField control={form.control} name="q7_tool_easy_use" rules={{ required: "This field is required" }} render={({ field }) => (
                  <LikertScale field={field} question="The search tool is easy to use." leftLabel="Strongly Disagree" rightLabel="Strongly Agree" questionNumber="7" />
                )} />

                <FormField control={form.control} name="q8_tool_clear_interaction" rules={{ required: "This field is required" }} render={({ field }) => (
                  <LikertScale field={field} question="The search tool offers clear and understandable interaction." leftLabel="Strongly Disagree" rightLabel="Strongly Agree" questionNumber="8" />
                )} />

                <FormField control={form.control} name="q9_tool_control" rules={{ required: "This field is required" }} render={({ field }) => (
                  <LikertScale field={field} question="It is easy to make the search tool do what I want it to do." leftLabel="Strongly Disagree" rightLabel="Strongly Agree" questionNumber="9" />
                )} />

                <FormField control={form.control} name="q10_tool_provides_info" rules={{ required: "This field is required" }} render={({ field }) => (
                  <LikertScale field={field} question="The search tool provides me with the information I need." leftLabel="Strongly Disagree" rightLabel="Strongly Agree" questionNumber="10" />
                )} />

                <FormField control={form.control} name="q11_tool_helps_complete" rules={{ required: "This field is required" }} render={({ field }) => (
                  <LikertScale field={field} question="The search tool makes it easier for me to complete my task." leftLabel="Strongly Disagree" rightLabel="Strongly Agree" questionNumber="11" />
                )} />

                <FormField control={form.control} name="q12_tool_useful" rules={{ required: "This field is required" }} render={({ field }) => (
                  <LikertScale field={field} question="Overall, I find the search tool useful." leftLabel="Strongly Disagree" rightLabel="Strongly Agree" questionNumber="12" />
                )} />

                <FormField control={form.control} name="q13_tool_too_much_info" rules={{ required: "This field is required" }} render={({ field }) => (
                  <LikertScale field={field} question="The tool gave me too much information to make a clear decision." leftLabel="Strongly Disagree" rightLabel="Strongly Agree" questionNumber="13" />
                )} />

                <FormField control={form.control} name="q14_tool_hard_focus" rules={{ required: "This field is required" }} render={({ field }) => (
                  <LikertScale field={field} question="The large volume of information made it difficult to focus on what was important." leftLabel="Strongly Disagree" rightLabel="Strongly Agree" questionNumber="14" />
                )} />
              </div>

              {/* Search Results Section */}
              <div className="space-y-6 pt-8">
                <h2 className="text-xl font-semibold text-gray-900 border-b pb-2">Please indicate how much you agree or disagree with the following statements about the search results provided by the tool.</h2>
                
                <FormField control={form.control} name="q15_results_accurate" rules={{ required: "This field is required" }} render={({ field }) => (
                  <LikertScale field={field} question="The information provided is accurate." leftLabel="Strongly Disagree" rightLabel="Strongly Agree" questionNumber="15" />
                )} />

                <FormField control={form.control} name="q16_results_trustworthy" rules={{ required: "This field is required" }} render={({ field }) => (
                  <LikertScale field={field} question="I can trust the results." leftLabel="Strongly Disagree" rightLabel="Strongly Agree" questionNumber="16" />
                )} />

                <FormField control={form.control} name="q17_results_complete" rules={{ required: "This field is required" }} render={({ field }) => (
                  <LikertScale field={field} question="The results are complete." leftLabel="Strongly Disagree" rightLabel="Strongly Agree" questionNumber="17" />
                )} />

                <FormField control={form.control} name="q18_results_relevant" rules={{ required: "This field is required" }} render={({ field }) => (
                  <LikertScale field={field} question="The search results are relevant to my needs." leftLabel="Strongly Disagree" rightLabel="Strongly Agree" questionNumber="18" />
                )} />

                <FormField control={form.control} name="q19_results_useful" rules={{ required: "This field is required" }} render={({ field }) => (
                  <LikertScale field={field} question="The search results are useful to me." leftLabel="Strongly Disagree" rightLabel="Strongly Agree" questionNumber="19" />
                )} />
              </div>

              {/* Purchase Intention Section */}
              <div className="space-y-6 pt-8">
                <h2 className="text-xl font-semibold text-gray-900 border-b pb-2">Purchase Intention</h2>
                
                <FormField control={form.control} name="q20_purchase_likelihood" rules={{ required: "This field is required" }} render={({ field }) => (
                  <LikertScale field={field} question="If you were to buy a new smartphone now, how likely is it that you would choose the one you selected during this task?" leftLabel="Very Unlikely" rightLabel="Very Likely" questionNumber="20" />
                )} />
              </div>

              {/* Additional Questions Section */}
              <div className="space-y-6 pt-8">
                <h2 className="text-xl font-semibold text-gray-900 border-b pb-2">Additional Questions</h2>
                
                {/* Q21 - Contradictory Information */}
                <FormField control={form.control} name="q21_contradictory_handling" rules={{ required: "Please select at least one option" }} render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base font-medium text-gray-900">
                      21. If you found contradictory information across different search results, how did you handle it? (Select all that apply) <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <div className="space-y-2 bg-gray-50 p-4 rounded-lg">
                        {[
                          { value: "first_result", label: "☐ I trusted the first result I clicked on" },
                          { value: "additional_sources", label: "☐ I searched for and compared additional sources" },
                          { value: "most_detailed", label: "☐ I chose the result that seemed most detailed or complete" },
                          { value: "own_judgment", label: "☐ I relied on my own knowledge or judgment" },
                          { value: "no_contradictions", label: "☐ I did not find any contradictions" },
                          { value: "other", label: "☐ Other" }
                        ].map((option) => (
                          <label key={option.value} className="flex items-start cursor-pointer hover:bg-gray-100 p-2 rounded">
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
                              className="mt-1 mr-3 w-4 h-4"
                            />
                            <span className="text-sm text-gray-700">{option.label}</span>
                          </label>
                        ))}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                {/* Q22 - Attention Check */}
                <FormField control={form.control} name="q22_attention_check" rules={{ required: "This field is required" }} render={({ field }) => (
                  <LikertScale field={field} question='Please select "3" for this question.' leftLabel="Strongly Disagree" rightLabel="Strongly Agree" questionNumber="22" />
                )} />

                {/* Q23 - Time Spent */}
                <FormField control={form.control} name="q23_time_spent" rules={{ required: "This field is required" }} render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base font-medium text-gray-900">
                      23. Approximately how much time (in minutes) did you spend on the search interface before deciding on a smartphone? <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <div className="space-y-2 bg-gray-50 p-4 rounded-lg">
                        {[
                          { value: "less-than-2", label: "☐ Less than 2 minutes" },
                          { value: "3-5", label: "☐ 3–5 minutes" },
                          { value: "6-10", label: "☐ 6–10 minutes" },
                          { value: "more-than-10", label: "☐ More than 10 minutes" }
                        ].map((option) => (
                          <label key={option.value} className="flex items-center cursor-pointer hover:bg-gray-100 p-2 rounded">
                            <input
                              type="radio"
                              name="q23_time_spent"
                              value={option.value}
                              checked={field.value === option.value}
                              onChange={(e) => field.onChange(e.target.value)}
                              className="mr-3 w-4 h-4"
                            />
                            <span className="text-sm text-gray-700">{option.label}</span>
                          </label>
                        ))}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                {/* Q24 - Future Usage */}
                <FormField control={form.control} name="q24_future_usage_feedback" rules={{ required: "This field is required" }} render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base font-medium text-gray-900">
                      24. Thinking about your experience with this version of Google Search, would you consider using it again in the future for other shopping-related tasks? Please explain why or why not. <span className="text-red-500">*</span>
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
              </div>

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
