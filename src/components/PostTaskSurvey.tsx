import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { trackingService } from "@/lib/tracking";

interface PostTaskForm {
  satisfaction: number[];
  difficulty: string;
  confidence: number[];
  strategy: string;
  mostImportantFactor: string;
  additionalComments: string;
}

const PostTaskSurvey = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const form = useForm<PostTaskForm>({
    defaultValues: {
      satisfaction: [5],
      confidence: [5],
      additionalComments: ""
    }
  });

  const onSubmit = async (data: PostTaskForm) => {
    setIsSubmitting(true);
    
    try {
      await trackingService.trackPostTaskSurvey({
        ...data,
        satisfaction: data.satisfaction[0],
        confidence: data.confidence[0]
      });
      navigate('/final-decision');
    } catch (error) {
      console.error('Error saving post-task survey:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Post-Task Questions</CardTitle>
          <CardDescription>
            Please reflect on the search task you just completed and answer the following questions.
          </CardDescription>
        </CardHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="satisfaction"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      How satisfied are you with your restaurant choice?
                      <span className="ml-2 text-sm text-muted-foreground">
                        (Current: {field.value?.[0] || 5}/10)
                      </span>
                    </FormLabel>
                    <FormControl>
                      <div className="px-2">
                        <Slider
                          min={1}
                          max={10}
                          step={1}
                          value={field.value}
                          onValueChange={field.onChange}
                          className="w-full"
                        />
                        <div className="flex justify-between text-xs text-muted-foreground mt-1">
                          <span>Very Unsatisfied</span>
                          <span>Very Satisfied</span>
                        </div>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="difficulty"
                rules={{ required: "Please rate the task difficulty" }}
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>How difficult was it to find the information you needed?</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex flex-col space-y-1"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="very-easy" id="very-easy" />
                          <Label htmlFor="very-easy">Very Easy</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="easy" id="easy" />
                          <Label htmlFor="easy">Easy</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="neutral" id="neutral" />
                          <Label htmlFor="neutral">Neither Easy nor Difficult</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="difficult" id="difficult" />
                          <Label htmlFor="difficult">Difficult</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="very-difficult" id="very-difficult" />
                          <Label htmlFor="very-difficult">Very Difficult</Label>
                        </div>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confidence"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      How confident are you in your final decision?
                      <span className="ml-2 text-sm text-muted-foreground">
                        (Current: {field.value?.[0] || 5}/10)
                      </span>
                    </FormLabel>
                    <FormControl>
                      <div className="px-2">
                        <Slider
                          min={1}
                          max={10}
                          step={1}
                          value={field.value}
                          onValueChange={field.onChange}
                          className="w-full"
                        />
                        <div className="flex justify-between text-xs text-muted-foreground mt-1">
                          <span>Not Confident</span>
                          <span>Very Confident</span>
                        </div>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="strategy"
                rules={{ required: "Please describe your search strategy" }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Briefly describe your search strategy. How did you approach finding the right restaurant?
                    </FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="e.g., I started with broad searches and then got more specific..."
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="mostImportantFactor"
                rules={{ required: "Please select the most important factor" }}
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>What was the most important factor in your final decision?</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex flex-col space-y-1"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="ratings" id="ratings" />
                          <Label htmlFor="ratings">Customer ratings/reviews</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="cuisine" id="cuisine" />
                          <Label htmlFor="cuisine">Type of cuisine</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="price" id="price" />
                          <Label htmlFor="price">Price range</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="location" id="location" />
                          <Label htmlFor="location">Location/convenience</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="atmosphere" id="atmosphere" />
                          <Label htmlFor="atmosphere">Atmosphere/ambiance</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="other" id="other" />
                          <Label htmlFor="other">Other</Label>
                        </div>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="additionalComments"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Any additional comments about your search experience? (Optional)
                    </FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Share any thoughts about the search process, interface, or task..."
                        className="min-h-[80px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>

            <CardFooter>
              <Button 
                type="submit" 
                className="w-full" 
                disabled={isSubmitting}
              >
                {isSubmitting ? "Saving..." : "Continue to Final Decision"}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
};

export default PostTaskSurvey;