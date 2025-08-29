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
interface SearchLogForm {
  smartphone_model: string;
  storage_capacity: string;
  color: string;
  lowest_price: string;
  website_link: string;
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
      website_link: ""
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

      // Save questions 11-15 to search_result_log table using sessionManager
      const success = await sessionManager.saveResultLog(
        data.smartphone_model,
        data.storage_capacity || '',
        data.color || '',
        data.lowest_price,
        data.website_link
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
  return <div className="min-h-screen relative bg-background py-8 px-6 md:px-8 lg:px-12"
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
          <h1 className="text-2xl font-bold text-foreground text-center mb-8">Your Search Results</h1>

        <div className="mb-6 p-4 rounded-lg border border-blue-200 bg-sky-100">
          <p className="text-gray-700 text-sm flex items-start gap-2">
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
                  <FormLabel className="text-base font-medium text-gray-900">
                    11. What is the brand and model of the smartphone you selected? <span className="text-red-500">*</span><br />
                    <span className="text-sm font-normal text-gray-600 italic">(e.g., Samsung Galaxy S24, iPhone 16 Pro)</span>
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
                    12. What is its storage capacity? <span className="text-sm font-normal text-gray-600 italic">(Optional)</span>
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
                    13. What is its color? <span className="text-sm font-normal text-gray-600 italic">(Optional)</span>
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
                    14. What is the lowest price you found for this smartphone? <span className="text-red-500">*</span><br />
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
                    15. Please provide a link to the website offering this price: <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="" className="border-b border-t-0 border-l-0 border-r-0 rounded-none bg-transparent" />
                  </FormControl>
                  <FormMessage />
                </FormItem>} />

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