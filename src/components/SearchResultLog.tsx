import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FormControl, FormField, FormItem, FormLabel, FormMessage, Form } from "@/components/ui/form";
import { ArrowLeft } from "lucide-react";
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
    const savedData = localStorage.getItem('search_result_log_data');
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        form.reset(parsedData);
      } catch (error) {
        console.error('Error parsing saved search result data:', error);
      }
    }
  }, [form]);

  // Save form data whenever form values change
  useEffect(() => {
    const subscription = form.watch((value) => {
      localStorage.setItem('search_result_log_data', JSON.stringify(value));
    });
    return () => subscription.unsubscribe();
  }, [form]);
  const onSubmit = async (data: SearchLogForm) => {
    setIsSubmitting(true);
    try {
      // Save search results data
      console.log('Search results:', data);
      
      // Clear saved form data after successful submission
      localStorage.removeItem('search_result_log_data');
      
      navigate('/post-task-survey');
    } catch (error) {
      console.error('Error submitting search log:', error);
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
                  </FormLabel>
                  <div className="flex flex-wrap gap-4 mt-2">
                    <label className="flex items-center gap-2">
                      <input type="radio" name="storage_capacity" value="64gb" checked={field.value === "64gb"} onChange={e => {
                  field.onChange(e.target.value);
                }} className="w-4 h-4" />
                      <span className="text-sm">64 GB</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input type="radio" name="storage_capacity" value="128gb" checked={field.value === "128gb"} onChange={e => {
                  field.onChange(e.target.value);
                }} className="w-4 h-4" />
                      <span className="text-sm">128 GB</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input type="radio" name="storage_capacity" value="256gb" checked={field.value === "256gb"} onChange={e => {
                  field.onChange(e.target.value);
                }} className="w-4 h-4" />
                      <span className="text-sm">256 GB</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input type="radio" name="storage_capacity" value="512gb" checked={field.value === "512gb"} onChange={e => {
                  field.onChange(e.target.value);
                }} className="w-4 h-4" />
                      <span className="text-sm">512 GB</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input type="radio" name="storage_capacity" value="1tb" checked={field.value === "1tb"} onChange={e => {
                  field.onChange(e.target.value);
                }} className="w-4 h-4" />
                      <span className="text-sm">1 TB and above</span>
                    </label>
                  </div>
                  <FormMessage />
                </FormItem>} />

            {/* Question 13: Color */}
            <FormField control={form.control} name="color" render={({
            field
          }) => <FormItem>
                  <FormLabel className="text-base font-medium text-gray-900">
                    13. What is its color? <span className="text-sm font-normal text-gray-600 italic">(Optional)</span>
                  </FormLabel>
                  <div className="flex flex-wrap gap-4 mt-2">
                    <label className="flex items-center gap-2">
                      <input type="radio" name="color" value="black" checked={field.value === "black"} onChange={e => {
                  field.onChange(e.target.value);
                }} className="w-4 h-4" />
                      <span className="text-sm">Black</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input type="radio" name="color" value="white" checked={field.value === "white"} onChange={e => {
                  field.onChange(e.target.value);
                }} className="w-4 h-4" />
                      <span className="text-sm">White</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input type="radio" name="color" value="blue" checked={field.value === "blue"} onChange={e => {
                  field.onChange(e.target.value);
                }} className="w-4 h-4" />
                      <span className="text-sm">Blue</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input type="radio" name="color" value="gray" checked={field.value === "gray"} onChange={e => {
                  field.onChange(e.target.value);
                }} className="w-4 h-4" />
                      <span className="text-sm">Gray / Graphite</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input type="radio" name="color" value="green" checked={field.value === "green"} onChange={e => {
                  field.onChange(e.target.value);
                }} className="w-4 h-4" />
                      <span className="text-sm">Green</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input type="radio" name="color" value="silver" checked={field.value === "silver"} onChange={e => {
                  field.onChange(e.target.value);
                }} className="w-4 h-4" />
                      <span className="text-sm">Silver</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input type="radio" name="color" value="gold" checked={field.value === "gold"} onChange={e => {
                  field.onChange(e.target.value);
                }} className="w-4 h-4" />
                      <span className="text-sm">Gold</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input type="radio" name="color" value="red" checked={field.value === "red"} onChange={e => {
                  field.onChange(e.target.value);
                }} className="w-4 h-4" />
                      <span className="text-sm">Red</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input type="radio" name="color" value="other" checked={field.value === "other"} onChange={e => {
                  field.onChange(e.target.value);
                }} className="w-4 h-4" />
                      <span className="text-sm">Other</span>
                    </label>
                  </div>
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