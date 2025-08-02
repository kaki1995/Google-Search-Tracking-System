import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import BrowserBar from "@/components/BrowserBar";
import StudyButton from "@/components/StudyButton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { trackingService } from "@/lib/tracking";

interface SurveyForm {
  ageGroup: string;
  gender: string;
  education: string;
  employment: string;
  nationality: string;
  country: string;
  chatbotFamiliarity: string;
  dataQuality: string;
  chatbotUsage: string;
}

const BackgroundSurvey = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const form = useForm<SurveyForm>();

  const onSubmit = async (data: SurveyForm) => {
    setIsSubmitting(true);
    
    try {
      await trackingService.trackBackgroundSurvey(data);
      navigate('/task-instructions');
    } catch (error) {
      console.error('Error saving survey:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePreviousPage = () => {
    navigate('/');
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
              Your Personal Background
            </h1>
          </div>

          {/* Survey Form in Blue Dotted Box */}
          <div className="border-2 border-dashed border-blue-500 rounded-lg p-6 mb-6">
            <p className="text-sm text-[#1D1B20] mb-6">
              Please answer the following questions to help us better understand your background. All responses are anonymous and used for research purposes only.
            </p>

            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {/* Question 1: Age Group */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#1D1B20]">
                  1. What is your age group? <span className="text-red-500">*</span>
                </label>
                <Select 
                  onValueChange={(value) => form.setValue('ageGroup', value)}
                  required
                >
                  <SelectTrigger className="w-full bg-white">
                    <SelectValue placeholder="Select age group" />
                  </SelectTrigger>
                  <SelectContent className="bg-white z-50">
                    <SelectItem value="under-18">Under 18</SelectItem>
                    <SelectItem value="18-24">18-24</SelectItem>
                    <SelectItem value="25-34">25-34</SelectItem>
                    <SelectItem value="35-44">35-44</SelectItem>
                    <SelectItem value="45-54">45-54</SelectItem>
                    <SelectItem value="55-above">55 and above</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Question 2: Gender */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#1D1B20]">
                  2. What is your gender? <span className="text-red-500">*</span>
                </label>
                <Select 
                  onValueChange={(value) => form.setValue('gender', value)}
                  required
                >
                  <SelectTrigger className="w-full bg-white">
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent className="bg-white z-50">
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="non-binary">Non-binary / Diverse</SelectItem>
                    <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Question 3: Education */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#1D1B20]">
                  3. What is your highest level of education? <span className="text-red-500">*</span>
                </label>
                <Select 
                  onValueChange={(value) => form.setValue('education', value)}
                  required
                >
                  <SelectTrigger className="w-full bg-white">
                    <SelectValue placeholder="Select education level" />
                  </SelectTrigger>
                  <SelectContent className="bg-white z-50">
                    <SelectItem value="high-school">High school or below</SelectItem>
                    <SelectItem value="professional-training">Professional training school/college</SelectItem>
                    <SelectItem value="bachelors">Bachelor's degree</SelectItem>
                    <SelectItem value="masters">Master's degree</SelectItem>
                    <SelectItem value="doctorate">Doctorate / PhD</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Question 4: Employment */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#1D1B20]">
                  4. What is your current employment status? <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="student"
                        {...form.register('employment', { required: true })}
                        value="student"
                        className="w-4 h-4"
                      />
                      <Label htmlFor="student" className="text-sm">Student</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="employed"
                        {...form.register('employment')}
                        value="employed"
                        className="w-4 h-4"
                      />
                      <Label htmlFor="employed" className="text-sm">Employed or self-employed</Label>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="unemployed"
                        {...form.register('employment')}
                        value="unemployed"
                        className="w-4 h-4"
                      />
                      <Label htmlFor="unemployed" className="text-sm">Unemployed</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="other-employment"
                        {...form.register('employment')}
                        value="other"
                        className="w-4 h-4"
                      />
                      <Label htmlFor="other-employment" className="text-sm">Other: _________</Label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Question 5: Nationality */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#1D1B20]">
                  5. What is your nationality? <span className="text-red-500">*</span>
                </label>
                <Input 
                  {...form.register('nationality', { required: true })}
                  className="w-full bg-white"
                  placeholder="Enter your nationality"
                />
              </div>

              {/* Question 6: Country of Residence */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#1D1B20]">
                  6. What is your current country of residence? <span className="text-red-500">*</span>
                </label>
                <Input 
                  {...form.register('country', { required: true })}
                  className="w-full bg-white"
                  placeholder="Enter your country of residence"
                />
              </div>

              {/* Question 7: AI Chatbot Familiarity */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#1D1B20]">
                  7. How familiar are you with AI chatbots such as ChatGPT? <span className="text-red-500">*</span>
                </label>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-[#1D1B20]">1 - Not familiar at all</span>
                  <span className="text-xs text-[#1D1B20]">7 - Extremely familiar</span>
                </div>
                <RadioGroup
                  onValueChange={(value) => form.setValue('chatbotFamiliarity', value)}
                  className="flex justify-between"
                  required
                >
                  {[1, 2, 3, 4, 5, 6, 7].map((num) => (
                    <div key={num} className="flex flex-col items-center space-y-1">
                      <RadioGroupItem value={num.toString()} id={`familiarity-${num}`} />
                      <Label htmlFor={`familiarity-${num}`} className="text-xs">{num}</Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              {/* Question 8: Data Quality */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#1D1B20]">
                  8. To ensure high data quality, please select "1 - Strongly Disagree" for this question. <span className="text-red-500">*</span>
                </label>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-[#1D1B20]">1 - Strongly Disagree</span>
                  <span className="text-xs text-[#1D1B20]">7 - Strongly Agree</span>
                </div>
                <RadioGroup
                  onValueChange={(value) => form.setValue('dataQuality', value)}
                  className="flex justify-between"
                  required
                >
                  {[1, 2, 3, 4, 5, 6, 7].map((num) => (
                    <div key={num} className="flex flex-col items-center space-y-1">
                      <RadioGroupItem value={num.toString()} id={`quality-${num}`} />
                      <Label htmlFor={`quality-${num}`} className="text-xs">{num}</Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              {/* Question 9: AI Chatbot Usage */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#1D1B20]">
                  9. On average, how often do you use AI chatbots per week? <span className="text-red-500">*</span>
                </label>
                <Select 
                  onValueChange={(value) => form.setValue('chatbotUsage', value)}
                  required
                >
                  <SelectTrigger className="w-full bg-white">
                    <SelectValue placeholder="Select usage frequency" />
                  </SelectTrigger>
                  <SelectContent className="bg-white z-50">
                    <SelectItem value="0-times">0 times</SelectItem>
                    <SelectItem value="1-2-times">1-2 times</SelectItem>
                    <SelectItem value="3-5-times">3-5 times</SelectItem>
                    <SelectItem value="6-10-times">6-10 times</SelectItem>
                    <SelectItem value="more-than-10">More than 10 times</SelectItem>
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
              {isSubmitting ? "Saving..." : "Next Page"}
            </StudyButton>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BackgroundSurvey;