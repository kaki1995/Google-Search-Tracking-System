import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import BrowserBar from "@/components/BrowserBar";
import StudyButton from "@/components/StudyButton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
interface TaskForm {
  budget: string;
}
const TaskInstructions = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const form = useForm<TaskForm>();
  const onSubmit = async (data: TaskForm) => {
    setIsSubmitting(true);
    try {
      // Save task preferences if needed
      navigate('/search-result-log');
    } catch (error) {
      console.error('Error saving task data:', error);
    } finally {
      setIsSubmitting(false);
    }
  };
  const handlePreviousPage = () => {
    navigate('/background-survey');
  };
  return <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Content */}
        <div className="bg-white shadow-sm border p-8 rounded-none">
          <div className="text-center mb-8">
            <div className="text-5xl mb-4">📱</div>
            <h1 className="text-3xl font-semibold text-gray-900 mb-6">
              Task Instructions
            </h1>
          </div>

          {/* Scenario Box */}
          <div className="border border-blue-200 rounded-lg p-6 mb-8 bg-transparent">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl">🎯</span>
              <h3 className="font-semibold text-gray-900">Scenario:</h3>
            </div>
            
            <p className="text-base text-gray-700 mb-4 leading-relaxed">
              Imagine you are planning to buy a new smartphone for yourself. Please consider your <strong>real financial situation</strong> and <strong>actual consumption habits</strong>—just as you would in real life.
            </p>

            <p className="text-base text-gray-700 mb-4 leading-relaxed">
              On the next page, you will find a <strong>search interface</strong> designed specifically for this study. Use this interface to explore available smartphones, including their <strong>prices, features, and specifications</strong>.
            </p>

            <div className="bg-amber-50 border-l-4 border-amber-400 p-4 mb-4">
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

            <p className="text-base text-gray-700 mb-4 leading-relaxed">
              Once you've completed your research and made a decision, you will be asked to <strong>provide details</strong> about your chosen smartphone, including:
            </p>

            <ul className="list-disc ml-6 mb-4 text-base text-gray-700 space-y-1">
              <li>Brand and model</li>
              <li>Storage capacity (optional)</li>
              <li>Color (optional)</li>
              <li>Lowest price you found</li>
              <li>Link to the shopping website</li>
            </ul>

            <div className="bg-green-50 border border-green-200 rounded-md p-3 mb-6">
              <p className="text-sm text-green-800 italic flex items-center gap-2">
                <span>💡</span>
                You may return to the search page and review your search history at any time before submitting the survey.
              </p>
            </div>

            <p className="text-base text-gray-700 mb-4 font-medium">
              Before beginning your search, please answer the following question:
            </p>

            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Question 10: Budget */}
              <div className="space-y-3">
                <label className="text-base font-medium text-gray-900 block">
                  10. What is your smartphone budget? <span className="text-red-500">*</span><br />
                  <span className="text-sm font-normal text-gray-600">(Please select one option based on your real-life financial habits.)</span>
                </label>
                <Select onValueChange={value => form.setValue('budget', value)} required>
                  <SelectTrigger className="w-full bg-white border-gray-300">
                    <SelectValue placeholder="Select your budget range" />
                  </SelectTrigger>
                  <SelectContent className="bg-white z-50">
                    <SelectItem value="under-150">Under €150</SelectItem>
                    <SelectItem value="150-299">€150-299</SelectItem>
                    <SelectItem value="300-449">€300-449</SelectItem>
                    <SelectItem value="450-599">€450-599</SelectItem>
                    <SelectItem value="600-799">€600-799</SelectItem>
                    <SelectItem value="over-800">Over €800</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </form>
          </div>

          {/* Buttons */}
          <div className="flex justify-between pt-6">
            <button onClick={handlePreviousPage} className="px-6 py-3 border border-gray-300 text-gray-700 bg-white rounded-lg hover:bg-gray-50 transition-colors font-medium">
              Previous Page
            </button>
            <button onClick={form.handleSubmit(data => {
            setIsSubmitting(true);
            navigate('/search-interface');
          })} disabled={isSubmitting} className="px-8 py-3 text-primary-foreground rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed bg-sky-700 hover:bg-sky-600">
              {isSubmitting ? "Loading..." : "Next Page"}
            </button>
          </div>
        </div>
      </div>
    </div>;
};
export default TaskInstructions;