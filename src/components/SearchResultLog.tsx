import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import BrowserBar from "@/components/BrowserBar";
import StudyButton from "@/components/StudyButton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { trackingService } from "@/lib/tracking";

interface SearchLogForm {
  brandModel: string;
  storageCapacity?: string;
  color?: string;
  lowestPrice: string;
  websiteLink: string;
}

const SearchResultLog = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const form = useForm<SearchLogForm>();

  const onSubmit = async (data: SearchLogForm) => {
    setIsSubmitting(true);
    
    try {
      // Save search results data
      console.log('Search results:', data);
      navigate('/post-task-survey');
    } catch (error) {
      console.error('Error saving search results:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePreviousPage = () => {
    navigate('/search-task');
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
              Your Search Results
            </h1>
          </div>

          <p className="text-sm text-[#1D1B20] mb-6 text-center">
            Please fill in the details of the smartphone you chose based on your search using the study interface:<br />
            (You may return to the previous search page using the "Previous Page" button and review your search history if needed)
          </p>

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Question 11: Brand and Model */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#1D1B20]">
                11. What is the brand and model of the smartphone you selected? <span className="text-red-500">*</span><br />
                <span className="text-xs font-normal text-gray-600">(e.g., Samsung Galaxy S24, iPhone 16 Pro)</span>
              </label>
              <Input 
                {...form.register('brandModel', { required: true })}
                className="w-full bg-white"
                placeholder="Enter brand and model"
              />
            </div>

            {/* Question 12: Storage Capacity (Optional) */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#1D1B20]">
                12. What is its storage capacity? <span className="text-gray-500">(Optional)</span>
              </label>
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="64gb"
                    {...form.register('storageCapacity')}
                    value="64GB"
                    className="w-4 h-4"
                  />
                  <label htmlFor="64gb" className="text-sm">64 GB</label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="128gb"
                    {...form.register('storageCapacity')}
                    value="128GB"
                    className="w-4 h-4"
                  />
                  <label htmlFor="128gb" className="text-sm">128 GB</label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="256gb"
                    {...form.register('storageCapacity')}
                    value="256GB"
                    className="w-4 h-4"
                  />
                  <label htmlFor="256gb" className="text-sm">256 GB</label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="512gb"
                    {...form.register('storageCapacity')}
                    value="512GB"
                    className="w-4 h-4"
                  />
                  <label htmlFor="512gb" className="text-sm">512 GB</label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="1tb"
                    {...form.register('storageCapacity')}
                    value="1TB"
                    className="w-4 h-4"
                  />
                  <label htmlFor="1tb" className="text-sm">1 TB and above</label>
                </div>
              </div>
            </div>

            {/* Question 13: Color (Optional) */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#1D1B20]">
                13. What is its color? <span className="text-gray-500">(Optional)</span>
              </label>
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="black"
                    {...form.register('color')}
                    value="Black"
                    className="w-4 h-4"
                  />
                  <label htmlFor="black" className="text-sm">Black</label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="white"
                    {...form.register('color')}
                    value="White"
                    className="w-4 h-4"
                  />
                  <label htmlFor="white" className="text-sm">White</label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="blue"
                    {...form.register('color')}
                    value="Blue"
                    className="w-4 h-4"
                  />
                  <label htmlFor="blue" className="text-sm">Blue</label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="gray"
                    {...form.register('color')}
                    value="Gray/Graphite"
                    className="w-4 h-4"
                  />
                  <label htmlFor="gray" className="text-sm">Gray / Graphite</label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="green"
                    {...form.register('color')}
                    value="Green"
                    className="w-4 h-4"
                  />
                  <label htmlFor="green" className="text-sm">Green</label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="silver"
                    {...form.register('color')}
                    value="Silver"
                    className="w-4 h-4"
                  />
                  <label htmlFor="silver" className="text-sm">Silver</label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="gold"
                    {...form.register('color')}
                    value="Gold"
                    className="w-4 h-4"
                  />
                  <label htmlFor="gold" className="text-sm">Gold</label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="red"
                    {...form.register('color')}
                    value="Red"
                    className="w-4 h-4"
                  />
                  <label htmlFor="red" className="text-sm">Red</label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="other-color"
                    {...form.register('color')}
                    value="Other"
                    className="w-4 h-4"
                  />
                  <label htmlFor="other-color" className="text-sm">Other</label>
                </div>
              </div>
            </div>

            {/* Question 14: Lowest Price */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#1D1B20]">
                14. What is the lowest price you found for this smartphone? <span className="text-red-500">*</span><br />
                <span className="text-xs font-normal text-gray-600">(Please indicate the price in euros, e.g., €749)</span>
              </label>
              <Input 
                {...form.register('lowestPrice', { required: true })}
                className="w-full bg-white"
                placeholder="e.g., €749"
              />
            </div>

            {/* Question 15: Website Link */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#1D1B20]">
                15. Please provide a link to the website offering this price: <span className="text-red-500">*</span>
              </label>
              <Input 
                {...form.register('websiteLink', { required: true })}
                className="w-full bg-white"
                placeholder="Enter website URL"
              />
            </div>
          </form>

          {/* Buttons */}
          <div className="flex justify-center gap-4 mt-8">
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

export default SearchResultLog;