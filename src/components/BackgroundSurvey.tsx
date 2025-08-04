import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FormControl, FormField, FormItem, FormLabel, FormMessage, Form } from "@/components/ui/form";
import { trackingService } from "@/lib/tracking";
import LikertScale from "./LikertScale";
interface SurveyForm {
  age: string;
  gender: string;
  education: string;
  other_education?: string;
  country: string;
  language: string;
  experience_scale_q7: string;
  familiarity_scale_q8: string;
  search_frequency: string;
}
export default function BackgroundSurvey() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const form = useForm<SurveyForm>();
  const onSubmit = async (data: SurveyForm) => {
    setIsSubmitting(true);
    try {
      await trackingService.trackBackgroundSurvey(data);
      navigate('/task-instructions');
    } catch (error) {
      console.error('Error submitting survey:', error);
    } finally {
      setIsSubmitting(false);
    }
  };
  return <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white border border-border p-8 shadow-sm rounded-none">
          <h1 className="text-2xl font-bold text-center mb-8 text-foreground">
            Background Survey
          </h1>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Question 1: Age */}
              <FormField control={form.control} name="age" rules={{
              required: "This field is required"
            }} render={({
              field
            }) => <FormItem>
                    <FormLabel className="text-base font-medium text-gray-900">
                      1. What is your age? <span className="text-red-500">*</span>
                    </FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select your age group" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="18-24">18-24</SelectItem>
                        <SelectItem value="25-34">25-34</SelectItem>
                        <SelectItem value="35-44">35-44</SelectItem>
                        <SelectItem value="45-54">45-54</SelectItem>
                        <SelectItem value="55-64">55-64</SelectItem>
                        <SelectItem value="65+">65+</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>} />

              {/* Question 2: Gender */}
              <FormField control={form.control} name="gender" rules={{
              required: "This field is required"
            }} render={({
              field
            }) => <FormItem>
                    <FormLabel className="text-base font-medium text-gray-900">
                      2. What is your gender? <span className="text-red-500">*</span>
                    </FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select your gender" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="non-binary">Non-binary</SelectItem>
                        <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>} />

              {/* Question 3: Education */}
              <FormField control={form.control} name="education" rules={{
              required: "This field is required"
            }} render={({
              field
            }) => <FormItem>
                    <FormLabel className="text-base font-medium text-gray-900">
                      3. What is your highest level of education? <span className="text-red-500">*</span>
                    </FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select your education level" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="high-school">High school or equivalent</SelectItem>
                        <SelectItem value="associate">Associate degree</SelectItem>
                        <SelectItem value="bachelor">Bachelor's degree</SelectItem>
                        <SelectItem value="master">Master's degree</SelectItem>
                        <SelectItem value="doctoral">Doctoral degree</SelectItem>
                        <SelectItem value="professional">Professional training school/college</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>} />

              {/* Question 4: Other Education Field */}
              {form.watch("education") === "other" && <FormField control={form.control} name="other_education" render={({
              field
            }) => <FormItem>
                      <FormLabel className="text-base font-medium text-gray-900">
                        4. Please specify: <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Please specify your education" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>} />}

              {/* Question 5: Country */}
              <FormField control={form.control} name="country" rules={{
              required: "This field is required"
            }} render={({
              field
            }) => <FormItem>
                    <FormLabel className="text-base font-medium text-gray-900">
                      5. What country are you currently living in? <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Enter your country" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>} />

              {/* Question 6: Language */}
              <FormField control={form.control} name="language" rules={{
              required: "This field is required"
            }} render={({
              field
            }) => <FormItem>
                    <FormLabel className="text-base font-medium text-gray-900">
                      6. What is your native language? <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Enter your native language" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>} />

              {/* Question 7: Likert Scale */}
              <FormField control={form.control} name="experience_scale_q7" rules={{
              required: "This field is required"
            }} render={({
              field
            }) => <LikertScale field={field} question="How would you rate your overall experience with online shopping?" leftLabel="Very poor" rightLabel="Excellent" questionNumber="7" />} />

              {/* Question 8: Likert Scale */}
              <FormField control={form.control} name="familiarity_scale_q8" rules={{
              required: "This field is required"
            }} render={({
              field
            }) => <LikertScale field={field} question="How familiar are you with researching products online before making a purchase?" leftLabel="Not familiar at all" rightLabel="Extremely familiar" questionNumber="8" />} />

              {/* Question 9: Search Frequency */}
              <FormField control={form.control} name="search_frequency" rules={{
              required: "This field is required"
            }} render={({
              field
            }) => <FormItem>
                    <FormLabel className="text-base font-medium text-gray-900">
                      9. How often do you use Google to search for products? <span className="text-red-500">*</span>
                    </FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select frequency" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="rarely">Rarely</SelectItem>
                        <SelectItem value="never">Never</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>} />

              {/* Buttons */}
              <div className="flex justify-between pt-6">
                <Button type="button" variant="outline" onClick={() => navigate('/')} className="px-6">
                  Previous Page
                </Button>
                <Button type="submit" disabled={isSubmitting} className="px-8">
                  {isSubmitting ? "Loading..." : "Next Page"}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </div>
    </div>;
}