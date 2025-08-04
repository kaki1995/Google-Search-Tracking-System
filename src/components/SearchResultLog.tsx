import { useState } from "react";
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
  price_range: string;
  where_to_buy: string;
  purchase_decision: string;
  decision_reasoning: string;
}

export default function SearchResultLog() {
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
      console.error('Error submitting search log:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto bg-white rounded-lg border border-border shadow-sm p-8">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="outline"
            onClick={() => navigate('/search-interface')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Search
          </Button>
          <h1 className="text-2xl font-bold text-foreground">
            Search Result Log
          </h1>
        </div>

        <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-blue-800 text-sm">
            Based on your search activity, please provide the following information about your smartphone research:
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Question 11: Smartphone Model */}
            <FormField
              control={form.control}
              name="smartphone_model"
              rules={{ required: "This field is required" }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base font-medium text-gray-900">
                    11. Based on your search, which smartphone model are you most interested in? <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Enter the smartphone model" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Question 12: Price Range */}
            <FormField
              control={form.control}
              name="price_range"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base font-medium text-gray-900">
                    12. What price range are you considering? (Optional)
                  </FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select price range" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="under-200">Under $200</SelectItem>
                      <SelectItem value="200-400">$200 - $400</SelectItem>
                      <SelectItem value="400-600">$400 - $600</SelectItem>
                      <SelectItem value="600-800">$600 - $800</SelectItem>
                      <SelectItem value="800-1000">$800 - $1000</SelectItem>
                      <SelectItem value="over-1000">Over $1000</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Question 13: Where to Buy */}
            <FormField
              control={form.control}
              name="where_to_buy"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base font-medium text-gray-900">
                    13. Where do you plan to purchase this smartphone? (Optional)
                  </FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select where to buy" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="online-retailer">Online retailer (Amazon, etc.)</SelectItem>
                      <SelectItem value="manufacturer">Directly from manufacturer</SelectItem>
                      <SelectItem value="physical-store">Physical store</SelectItem>
                      <SelectItem value="carrier-store">Mobile carrier store</SelectItem>
                      <SelectItem value="undecided">Still undecided</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Question 14: Purchase Decision */}
            <FormField
              control={form.control}
              name="purchase_decision"
              rules={{ required: "This field is required" }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base font-medium text-gray-900">
                    14. How likely are you to purchase this smartphone within the next month? <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Enter your likelihood (e.g., Very likely, Somewhat likely, etc.)" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Question 15: Decision Reasoning */}
            <FormField
              control={form.control}
              name="decision_reasoning"
              rules={{ required: "This field is required" }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base font-medium text-gray-900">
                    15. Please explain the main factors that influenced your decision about this smartphone. <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <Textarea 
                      {...field} 
                      placeholder="Describe the key factors that influenced your choice..."
                      className="min-h-[120px]"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Buttons */}
            <div className="flex justify-between pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/search-interface')}
                className="px-6 flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Search
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="px-8"
              >
                {isSubmitting ? "Loading..." : "Next Page"}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}