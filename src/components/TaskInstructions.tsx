import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import BrowserBar from "@/components/BrowserBar";
import StudyButton from "@/components/StudyButton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trackingService } from "@/lib/tracking";
interface TaskForm {
  budget: string;
}
const TaskInstructions = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [budgetRange, setBudgetRange] = useState<string>("");
  const navigate = useNavigate();
  const form = useForm<TaskForm>();
  
  const onSubmit = async (data: TaskForm) => {
    setIsSubmitting(true);
    try {
      console.log("Budget range selected:", budgetRange);
      
      // Track the budget range selection
      if (budgetRange) {
        await trackingService.trackBudgetRange(budgetRange);
        // Store budget range in sessionStorage for later use
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
      
      <div className="max-w-6xl mx-auto relative z-10">
        {/* Content */}
        <div className="bg-white bg-opacity-95 backdrop-blur-sm shadow-lg p-8 md:p-12 lg:p-16 rounded-lg">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-semibold text-gray-900 mb-6">
              Your Search Task
            </h1>
          </div>

          <div className="space-y-6 mx-auto text-left">
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
            <div className="bg-amber-50 border-l-4 border-amber-400 p-4">
              <div className="flex items-start gap-2">
                <span className="text-xl">⚠️</span>
                <div>
                  <p className="text-sm text-amber-800">
                    <strong>Important:</strong><br />
                    Please conduct <strong>all searches exclusively</strong> through this interface. To ensure we capture your complete search journey, <strong>do not use any external tools</strong> (e.g., Google, Amazon, price comparison websites, etc.).
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
              Before beginning your search, please answer the following two preparatory questions:
            </p>

            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Question 10: Budget */}
              <div className="space-y-3">
                <label className="text-base font-medium text-gray-900 block">
                  10. What is your smartphone budget? <span className="text-red-500">*</span><br />
                  <span className="text-sm font-normal text-gray-600">(Please select one option based on your real-life financial habits.)</span>
                </label>
                <div className="flex flex-wrap gap-4 mt-2">
                  <label className="flex items-center gap-2">
                    <input 
                      type="radio" 
                      name="budget" 
                      value="under-150" 
                      checked={budgetRange === "under-150"} 
                      onChange={(e) => setBudgetRange(e.target.checked ? e.target.value : "")} 
                      className="w-4 h-4" 
                    />
                    <span className="text-sm">Under €150</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input 
                      type="radio" 
                      name="budget" 
                      value="150-299" 
                      checked={budgetRange === "150-299"} 
                      onChange={(e) => setBudgetRange(e.target.checked ? e.target.value : "")} 
                      className="w-4 h-4" 
                    />
                    <span className="text-sm">€150-299</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input 
                      type="radio" 
                      name="budget" 
                      value="300-449" 
                      checked={budgetRange === "300-449"} 
                      onChange={(e) => setBudgetRange(e.target.checked ? e.target.value : "")} 
                      className="w-4 h-4" 
                    />
                    <span className="text-sm">€300-449</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input 
                      type="radio" 
                      name="budget" 
                      value="450-599" 
                      checked={budgetRange === "450-599"} 
                      onChange={(e) => setBudgetRange(e.target.checked ? e.target.value : "")} 
                      className="w-4 h-4" 
                    />
                    <span className="text-sm">€450-599</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input 
                      type="radio" 
                      name="budget" 
                      value="600-799" 
                      checked={budgetRange === "600-799"} 
                      onChange={(e) => setBudgetRange(e.target.checked ? e.target.value : "")} 
                      className="w-4 h-4" 
                    />
                    <span className="text-sm">€600-799</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input 
                      type="radio" 
                      name="budget" 
                      value="over-800" 
                      checked={budgetRange === "over-800"} 
                      onChange={(e) => setBudgetRange(e.target.checked ? e.target.value : "")} 
                      className="w-4 h-4" 
                    />
                    <span className="text-sm">Over €800</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input 
                      type="radio" 
                      name="budget" 
                      value="not-sure" 
                      checked={budgetRange === "not-sure"} 
                      onChange={(e) => setBudgetRange(e.target.checked ? e.target.value : "")} 
                      className="w-4 h-4" 
                    />
                    <span className="text-sm">Not Sure</span>
                  </label>
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