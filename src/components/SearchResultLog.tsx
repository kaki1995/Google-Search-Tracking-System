import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FormControl, FormField, FormItem, FormLabel, FormMessage, Form } from "@/components/ui/form";
import { ArrowLeft } from "lucide-react";
import { sessionManager } from "@/lib/sessionManager";
import LikertScale from "@/components/LikertScale";
import { Checkbox } from "@/components/ui/checkbox";
interface SearchLogForm {
  smartphone_model: string;
  storage_capacity: string;
  color: string;
  lowest_price: string;
  website_link: string;
  q17_price_importance: string;
  q18_smartphone_features: string[];
  q18_other_text?: string;
}
export default function SearchResultLog() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const form = useForm<SearchLogForm>({
    defaultValues: {
      smartphone_model: "",
      storage_capacity: "",
      color: "",
      lowest_price: "",
      website_link: "",
      q17_price_importance: "",
      q18_smartphone_features: [],
      q18_other_text: ""
    }
  });

  // Load saved form data on component mount
  useEffect(() => {
    const loadSavedData = async () => {
      // Try to load from sessionManager first (supports navigation back/forward)
      const savedData = await sessionManager.loadPage('search_result_log');
      if (savedData) {
        form.reset(savedData);
      } else {
        // Fallback to localStorage for backwards compatibility
        const localData = localStorage.getItem('search_result_log_data');
        if (localData) {
          try {
            const parsedData = JSON.parse(localData);
            form.reset(parsedData);
          } catch (error) {
            console.error('Error parsing saved search result data:', error);
          }
        }
      }
    };
    loadSavedData();
  }, [form]);

  // Save form data whenever form values change (retain answers for navigation)
  useEffect(() => {
    const subscription = form.watch(async (value) => {
      // Save to both localStorage and sessionManager for robust answer retention
      localStorage.setItem('search_result_log_data', JSON.stringify(value));
      const participantId = localStorage.getItem('participant_id');
      if (participantId) {
        await sessionManager.savePage('search_result_log', value);
      }
    });
    return () => subscription.unsubscribe();
  }, [form]);
  const onSubmit = async (data: SearchLogForm) => {
    setIsSubmitting(true);
    try {
      // Save to localStorage for persistence across navigation
      localStorage.setItem('search_result_log_data', JSON.stringify(data));
      
      console.log('🚀 Submitting Q11-15 data:', data);

      // Save questions 11-18 to search_result_log table using sessionManager
      const success = await sessionManager.saveResultLog(
        data.smartphone_model,
        data.storage_capacity || '',
        data.color || '',
        data.lowest_price,
        data.website_link,
        '', // q16 - no satisfaction rating in this component
        data.q17_price_importance || '',
        JSON.stringify(data.q18_smartphone_features || [])
      );
      
      if (success) {
        console.log('✅ Search results saved to database successfully:', data);
      } else {
        console.error('❌ Failed to save search results to database, continuing anyway');
        // Let's log the session state for debugging
        const participantId = localStorage.getItem('participant_id');
        const sessionId = localStorage.getItem('session_id');
        console.error('Debug - participant_id:', participantId);
        console.error('Debug - session_id:', sessionId);
      }
      
      // Clear saved form data after successful submission
      localStorage.removeItem('search_result_log_data');
      
      navigate('/post-task-survey');
    } catch (error) {
      console.error('Error submitting search log:', error);
      // Continue to next page even if save fails
      navigate('/post-task-survey');
    } finally {
      setIsSubmitting(false);
    }
  };
  return <div className="min-h-screen relative bg-white md:bg-background py-6 px-4 md:py-8 md:px-6 lg:px-12"
      style={{
        backgroundImage: "none"
      }}
      >
      {/* Background overlay for better text readability - desktop only */}
      <div className="hidden md:block absolute inset-0 bg-black bg-opacity-20" 
        style={{
          backgroundImage: "url('/mountain-background.jpg')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      ></div>
      
      <div className="max-w-4xl mx-auto relative z-10">
        <div className="bg-white md:bg-opacity-95 md:backdrop-blur-sm rounded-lg shadow-lg p-6 md:p-8 lg:p-12">
          <h1 className="text-xl md:text-2xl font-bold text-foreground text-center mb-6 md:mb-8">Your Search Results</h1>

        <div className="mb-6 p-4 rounded-lg border border-blue-200 bg-sky-100">
          <p className="text-gray-700 text-xs md:text-sm flex items-start gap-2">
            <span className="text-blue-600 text-lg flex-shrink-0">📝</span>
            <span className="text-justify">
              Please fill in the details of the smartphone you chose based on your search using the study interface:<br />
              (You may return to the previous search page using the "Previous Page" button and review your search history if needed)
            </span>
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Question 11: Smartphone Model */}
            <FormField control={form.control} name="smartphone_model" rules={{
            required: "This field is required"
          }} render={({
            field
          }) => <FormItem>
                  <FormLabel className="text-sm md:text-base font-medium text-gray-900">
                    12. What is the brand and model of the smartphone you selected? <span className="text-red-500">*</span><br />
                    <span className="text-xs md:text-sm font-normal text-gray-600 italic">(e.g., Samsung Galaxy S24, iPhone 16 Pro)</span>
                  </FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="" className="border-b border-t-0 border-l-0 border-r-0 rounded-none bg-transparent" />
                  </FormControl>
                  <FormMessage />
                </FormItem>} />

            {/* Question 12: Storage Capacity */}
            <FormField control={form.control} name="storage_capacity" render={({
            field
          }) => <FormItem>
                  <FormLabel className="text-base font-medium text-gray-900">
                    13. What is its storage capacity? <span className="text-sm font-normal text-gray-600 italic">(Optional)</span>
                    <br />
                    <span className="text-sm font-normal text-gray-600 italic">(e.g., 64 GB, 128 GB, 256 GB, 512 GB, 1TB)</span>
                  </FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="" className="border-b border-t-0 border-l-0 border-r-0 rounded-none bg-transparent" />
                  </FormControl>
                  <FormMessage />
                </FormItem>} />

            {/* Question 13: Color */}
            <FormField control={form.control} name="color" render={({
            field
          }) => <FormItem>
                  <FormLabel className="text-base font-medium text-gray-900">
                    14. What is its color? <span className="text-sm font-normal text-gray-600 italic">(Optional)</span>
                    <br />
                    <span className="text-sm font-normal text-gray-600 italic">(e.g., Black, White, Silver, Titanium, Blue, Pink Gold, Ultramarine, Teal)</span>
                  </FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="" className="border-b border-t-0 border-l-0 border-r-0 rounded-none bg-transparent" />
                  </FormControl>
                  <FormMessage />
                </FormItem>} />

            {/* Question 14: Lowest Price */}
            <FormField control={form.control} name="lowest_price" rules={{
            required: "This field is required"
          }} render={({
            field
          }) => <FormItem>
                  <FormLabel className="text-base font-medium text-gray-900">
                    15. What is the lowest price you found for this smartphone? <span className="text-red-500">*</span><br />
                    <span className="text-sm font-normal text-gray-600 italic">(Please indicate the price in euros, e.g., €749)</span>
                  </FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="" className="border-b border-t-0 border-l-0 border-r-0 rounded-none bg-transparent" />
                  </FormControl>
                  <FormMessage />
                </FormItem>} />

            {/* Question 15: Website Link */}
            <FormField control={form.control} name="website_link" rules={{
            required: "This field is required"
          }} render={({
            field
          }) => <FormItem>
                  <FormLabel className="text-base font-medium text-gray-900">
                    16. Please provide a link to the website offering this price: <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="" className="border-b border-t-0 border-l-0 border-r-0 rounded-none bg-transparent" />
                  </FormControl>
                  <FormMessage />
                </FormItem>} />

            {/* Question 17: Price vs Technical Specifications */}
            <div className="w-full py-6">
              <FormField
                control={form.control}
                name="q17_price_importance"
                rules={{ required: "This field is required" }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm md:text-base font-medium text-gray-900 mb-2 block">
                      17. When making a smartphone purchase decision, price is a more important factor to you than technical specifications? <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      {/* Desktop/tablet Likert scale: 7-column grid, no overlays, large tap targets */}
                      <div className="hidden md:grid grid-cols-7 gap-2 w-full" style={{ minWidth: '308px' }}>
                        {[1,2,3,4,5,6,7].map((value) => (
                          <div key={value} className="flex flex-col items-center" style={{ pointerEvents: 'auto', minWidth: '44px' }}>
                            <label htmlFor={`q17_price_importance-${value}`} className="flex flex-col items-center cursor-pointer w-full" style={{ minWidth: '44px', minHeight: '44px', justifyContent: 'center', touchAction: 'manipulation' }}>
                              <span className="text-xs text-gray-600 mb-1">{value === 1 ? '1 – Strongly Disagree' : value === 7 ? '7 – Strongly Agree' : value}</span>
                              <input
                                type="radio"
                                name="q17_price_importance"
                                value={value.toString()}
                                checked={field.value === value.toString()}
                                onChange={e => field.onChange(e.target.value)}
                                className="w-7 h-7 accent-blue-600 focus:ring-2 focus:ring-blue-500"
                                id={`q17_price_importance-${value}`}
                                style={{ minWidth: '44px', minHeight: '44px', margin: '0 auto', display: 'block', touchAction: 'manipulation' }}
                              />
                            </label>
                          </div>
                        ))}
                      </div>
                      {/* Mobile: 7-column grid, no overlays over radios, large tap targets, labels inside grid */}
                      <div className="md:hidden w-full" style={{ minWidth: '308px' }}>
                        <div className="flex flex-row justify-between items-center mb-2 w-full">
                          <span className="text-xs text-gray-600">1 – Strongly Disagree</span>
                          <span className="text-xs text-gray-600">7 – Strongly Agree</span>
                        </div>
                        <div className="grid grid-cols-7 gap-2 w-full" style={{ minWidth: '308px' }}>
                          {[1,2,3,4,5,6,7].map((value) => (
                            <div key={value} className="flex flex-col items-center" style={{ pointerEvents: 'auto', minWidth: '44px' }}>
                              <label htmlFor={`q17_price_importance-${value}`} className="flex flex-col items-center cursor-pointer w-full" style={{ minWidth: '44px', minHeight: '44px', justifyContent: 'center', touchAction: 'manipulation' }}>
                                <span className="text-xs text-gray-600 mb-1">{value}</span>
                                <input
                                  type="radio"
                                  name="q17_price_importance"
                                  value={value.toString()}
                                  checked={field.value === value.toString()}
                                  onChange={e => field.onChange(e.target.value)}
                                  className="w-7 h-7 accent-blue-600 focus:ring-2 focus:ring-blue-500"
                                  id={`q17_price_importance-${value}`}
                                  style={{ minWidth: '44px', minHeight: '44px', margin: '0 auto', display: 'block', touchAction: 'manipulation' }}
                                />
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Question 18: Smartphone Features */}
            <FormField
              control={form.control}
              name="q18_smartphone_features"
              rules={{ required: "Please select at least one feature" }}
              render={({ field }) => {
                // Alphabetically sorted except 'Other' last
                const features = [
                  { value: "battery", label: "Battery life/ fast charging" },
                  { value: "camera", label: "Camera quality" },
                  { value: "display", label: "Display Quality" },
                  { value: "performance", label: "Performance/ speed" },
                  { value: "software", label: "Software support & updates" },
                  { value: "storage", label: "Storage capacity" }
                ].sort((a, b) => a.label.localeCompare(b.label));
                features.push({ value: "other", label: "Other" });
                return (
                  <FormItem>
                    <FormLabel className="text-base font-medium text-gray-900">
                      18. Please choose up to 3 features that are most important to you when selecting a smartphone. <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <div className="space-y-3">
                        {features.map((feature) => (
                          <div key={feature.value} className="flex items-center space-x-2">
                            <Checkbox
                              id={feature.value}
                              checked={field.value?.includes(feature.value) || false}
                              onCheckedChange={(checked) => {
                                const current = field.value || [];
                                if (checked) {
                                  if (current.length < 3) {
                                    field.onChange([...current, feature.value]);
                                  }
                                } else {
                                  field.onChange(current.filter(item => item !== feature.value));
                                }
                              }}
                              disabled={field.value?.length >= 3 && !field.value?.includes(feature.value)}
                              className="h-5 w-5 rounded-none border border-gray-400" // force square
                            />
                            <label
                              htmlFor={feature.value}
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                              {feature.label}
                            </label>
                            {feature.value === "other" && field.value?.includes("other") && (
                              <input
                                type="text"
                                className="ml-2 border rounded px-2 py-1 text-sm"
                                placeholder="Please specify"
                                value={form.getValues("q18_other_text") || ""}
                                onChange={e => form.setValue("q18_other_text", e.target.value)}
                              />
                            )}
                          </div>
                        ))}
                        {field.value?.length >= 3 && (
                          <p className="text-sm text-gray-600">Maximum 3 features selected</p>
                        )}
                        <p className="text-sm text-gray-600">Selected: {field.value?.length || 0}/3</p>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                );
              }}
            />

            {/* Buttons */}
            <div className="flex justify-between pt-8">
              <Button type="button" variant="outline" onClick={() => navigate('/search-interface')} className="px-8 py-2 text-sm font-medium border-2">
                Previous Page
              </Button>
              <Button type="submit" disabled={isSubmitting} className="px-8 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700">
                {isSubmitting ? "Loading..." : "Next Page"}
              </Button>
            </div>
          </form>
        </Form>
        </div>
      </div>
    </div>;
}