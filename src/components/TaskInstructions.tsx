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
      navigate('/search-task');
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
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-[905px] h-auto border-8 border-[#CAC4D0] rounded-[29px] bg-[#FEF7FF] overflow-hidden relative">
        {/* Browser Bar */}
        <div className="relative z-10">
          <BrowserBar />
        </div>

        {/* Content */}
        <div className="relative z-10 px-8 py-6">
          <div className="text-center mb-6">
            <h1 className="text-[26px] font-medium leading-8 text-[#1D1B20] mb-4">
              Your Search Task
            </h1>
          </div>

          {/* Scenario Box */}
          <div className="border-2 border-dashed border-blue-500 rounded-lg p-6 mb-6">
            <h3 className="font-semibold text-[#1D1B20] mb-4">Scenario:</h3>
            
            <p className="text-sm text-[#1D1B20] mb-4">
              Imagine you are planning to buy a new smartphone for yourself. Please consider your <strong>real financial situation</strong> and <strong>actual consumption habits</strong>—just as you would in real life.
            </p>

            <p className="text-sm text-[#1D1B20] mb-4">
              On the next page, you will find a <strong>search interface</strong> designed specifically for this study. Use this interface to explore available smartphones, including their <strong>prices, features, and specifications</strong>.
            </p>

            <div className="bg-yellow-100 border-l-4 border-yellow-500 p-4 mb-4">
              <p className="text-sm text-[#1D1B20]">
                <strong>⚠ Important:</strong><br />
                Please conduct <strong>all searches exclusively</strong> through this interface. To ensure we capture your complete search journey, <strong>do not use any external tools</strong> (e.g., Google, Amazon, price comparison websites, etc.).
              </p>
            </div>

            <p className="text-sm text-[#1D1B20] mb-4">
              Once you've completed your research and made a decision, you will be asked to <strong>provide details</strong> about your chosen smartphone, including:
            </p>

            <ul className="list-disc ml-6 mb-4 text-sm text-[#1D1B20]">
              <li>Brand and model</li>
              <li>Storage capacity (optional)</li>
              <li>Color (optional)</li>
              <li>Lowest price you found</li>
              <li>Link to the shopping website</li>
            </ul>

            <p className="text-sm text-[#1D1B20] mb-6 italic">
              You may return to the search page and review your search history at any time before submitting the survey.
            </p>

            <p className="text-sm text-[#1D1B20] mb-4">
              Before beginning your search, please answer the following two preparatory questions:
            </p>

            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {/* Question 10: Budget */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#1D1B20]">
                  10. What is your smartphone budget? <span className="text-red-500">*</span><br />
                  <span className="text-xs font-normal">(Please select one option based on your real-life financial habits.)</span>
                </label>
                <Select 
                  onValueChange={(value) => form.setValue('budget', value)}
                  required
                >
                  <SelectTrigger className="w-full bg-white">
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
          <div className="flex justify-center gap-4">
            <StudyButton
              variant="secondary"
              onClick={handlePreviousPage}
            >
              Previous Page
            </StudyButton>
            <StudyButton
              variant="primary"
              onClick={form.handleSubmit(onSubmit)}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Loading..." : "Next Page"}
            </StudyButton>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskInstructions;