import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import BrowserBar from "@/components/BrowserBar";
import StudyButton from "@/components/StudyButton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { sessionManager } from "@/lib/sessionManager";
interface TaskForm {
  budget: string;
}
const TaskInstructions = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [budgetRange, setBudgetRange] = useState<string>("");
  const navigate = useNavigate();
  const form = useForm<TaskForm>();
  
  // Load saved budget on mount
  useEffect(() => {
    const saved = localStorage.getItem('preparatory_question');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed?.budget) setBudgetRange(parsed.budget);
      } catch {}
    } else {
      const ss = sessionStorage.getItem('selectedBudgetRange');
      if (ss) setBudgetRange(ss);
    }
  }, []);

  // Persist budget on change
  useEffect(() => {
    localStorage.setItem('preparatory_question', JSON.stringify({ budget: budgetRange }));
  }, [budgetRange]);
  
  const onSubmit = async (data: TaskForm) => {
    setIsSubmitting(true);
    try {
      console.log("Budget range selected:", budgetRange);
      
      if (budgetRange) {
        // Use existing participant ID from session
        const participant_id = sessionManager.getParticipantId();
        if (!participant_id) {
          console.warn('No participant ID found during task instruction');
          return;
        }
        const { data: resp, error } = await supabase.functions.invoke('submit-task-instruction', {
          body: { participant_id, q10_response: budgetRange }
        });
        if (error || !resp?.ok) {
          const msg = error?.message || resp?.error || 'Failed to save your answer';
          throw new Error(msg);
        }
        sessionStorage.setItem('selectedBudgetRange', budgetRange);
      }
      
      navigate('/search-interface');
    } catch (error) {
      console.error('Error saving task data:', error);
    } finally {
      setIsSubmitting(false);
    }
  };
  const handlePreviousPage = () => {
    localStorage.setItem('preparatory_question', JSON.stringify({ budget: budgetRange }));
    navigate('/background-survey');
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
        {/* Content */}
        <div className="bg-white bg-opacity-95 backdrop-blur-sm shadow-lg p-8 md:p-12 lg:p-16 rounded-lg">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-semibold text-gray-900 mb-6">
              Your Search Task
            </h1>
          </div>

          <div className="space-y-6 mx-auto text-justify">
            {/* Scenario */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Scenario:</h3>
              <p className="text-base text-gray-700 leading-relaxed">
                Imagine you are planning to buy a new smartphone for yourself. Please consider your <strong>real financial situation</strong> and <strong>actual consumption habits</strong>—just as you would in real life.
              </p>
            </div>

            <p className="text-base text-gray-700 leading-relaxed">
              On the next page, you will find a <strong>search interface</strong> designed specifically for this study. Use this interface to explore available smartphones, including their <strong>prices, features, and specifications</strong>.
            </p>

            {/* Important Warning */}
            <div className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded-r-md">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <svg className="w-5 h-5 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-sm text-amber-800">
                    <strong>Important:</strong><br />
                    Please conduct <strong>all searches exclusively</strong> through this interface. To ensure we capture your complete search journey, do not use any external search tools.
                  </p>
                  <p className="text-sm text-amber-800 mt-2">
                    After submitting a query, you <strong>may click on any links</strong> displayed in the responses to view additional information about the product. This is encouraged and will be considered <strong>part of your search process</strong>.
                  </p>
                </div>
              </div>
            </div>

            <p className="text-base text-gray-700 leading-relaxed">
              Once you've completed your research and made a decision, you will be asked to <strong>provide details</strong> about your chosen smartphone, including:
            </p>

            <ul className="list-disc ml-6 text-base text-gray-700 space-y-1">
              <li>Brand and model</li>
              <li>Storage capacity (optional)</li>
              <li>Color (optional)</li>
              <li>Lowest price you found</li>
              <li>Link to the shopping website</li>
            </ul>

            <div className="bg-green-50 border border-green-200 rounded-md p-3">
              <p className="text-sm text-green-800 flex items-center gap-2">
                <span>💡</span>
                You may return to the search page and review your search history at any time before submitting the survey.
              </p>
            </div>

            <p className="text-base text-gray-700 font-medium">
              Before beginning your search, please answer the following preparatory question:
            </p>

            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Question 10: Budget */}
              <div className="space-y-3">
                <label className="text-base font-medium text-gray-900 block">
                  10. What is your smartphone budget? <span className="text-red-500">*</span><br />
                  <span className="text-sm font-normal text-gray-600">(Please select one option based on your real-life financial habits.)</span>
                </label>
                <div className="mt-2">
                  <Select onValueChange={(v) => setBudgetRange(v)} value={budgetRange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select your budget" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="under-150">Under €150</SelectItem>
                      <SelectItem value="150-299">€150-299</SelectItem>
                      <SelectItem value="300-449">€300-449</SelectItem>
                      <SelectItem value="450-599">€450-599</SelectItem>
                      <SelectItem value="600-799">€600-799</SelectItem>
                      <SelectItem value="over-800">Over €800</SelectItem>
                      <SelectItem value="not-sure">Not Sure</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </form>
          </div>

          {/* Buttons */}
          <div className="flex justify-between pt-8">
            <button onClick={handlePreviousPage} className="px-8 py-2 text-sm font-medium border-2 border-gray-300 text-gray-700 bg-white rounded-lg hover:bg-gray-50 transition-colors">
              Previous Page
            </button>
            <button 
              onClick={form.handleSubmit(onSubmit)} 
              disabled={isSubmitting || !budgetRange} 
              className="px-8 py-2 text-sm font-medium text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-blue-600 hover:bg-blue-700"
            >
              {isSubmitting ? "Loading..." : "Next Page"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskInstructions;