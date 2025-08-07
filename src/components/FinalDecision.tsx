import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle } from "lucide-react";
import { trackingService } from "@/lib/tracking";

interface FinalDecisionForm {
  restaurantName: string;
  restaurantLocation: string;
  reasoning: string;
}

const FinalDecision = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const form = useForm<FinalDecisionForm>();

  const onSubmit = async (data: FinalDecisionForm) => {
    setIsSubmitting(true);
    
    try {
      await trackingService.trackFinalDecision(data);
      setIsCompleted(true);
    } catch (error) {
      console.error('Error saving final decision:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isCompleted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6 md:p-8 lg:p-12">
        <Card className="w-full max-w-6xl">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center flex items-center justify-center gap-2">
              <CheckCircle className="h-8 w-8 text-green-600" />
              Study Complete!
            </CardTitle>
            <CardDescription className="text-center">
              Thank you for participating in our research study.
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Your responses have been recorded successfully. Your participation contributes 
                valuable insights to our understanding of search behavior.
              </AlertDescription>
            </Alert>

            <div className="text-center space-y-2">
              <h3 className="font-semibold">What happens next?</h3>
              <p className="text-sm text-muted-foreground">
                Your anonymous data will be analyzed alongside other participants' data to understand 
                patterns in search behavior. Results from this study may be published in academic 
                journals or presented at conferences.
              </p>
            </div>

            <div className="text-center space-y-2">
              <h3 className="font-semibold">Questions?</h3>
              <p className="text-sm text-muted-foreground">
                If you have any questions about this study, please contact our research team 
                at research-contact@university.edu
              </p>
            </div>
          </CardContent>

          <CardFooter>
            <Button 
              onClick={() => window.close()} 
              className="w-full"
              variant="outline"
            >
              Close Window
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6 md:p-8 lg:p-12">
      <Card className="w-full max-w-6xl">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Final Decision</CardTitle>
          <CardDescription>
            Please tell us about your final restaurant choice and the reasoning behind your decision.
          </CardDescription>
        </CardHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="restaurantName"
                rules={{ required: "Please enter the restaurant name" }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>What restaurant did you choose?</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter the name of your chosen restaurant"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="restaurantLocation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location/Address (if known)</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter the restaurant's location or address (optional)"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="reasoning"
                rules={{ required: "Please explain your reasoning" }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Why did you choose this restaurant? Please explain your reasoning.
                    </FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Describe what made you choose this particular restaurant over others you considered..."
                        className="min-h-[120px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Alert>
                <AlertDescription>
                  This is the final step of the study. Once you submit your decision, 
                  the study will be complete.
                </AlertDescription>
              </Alert>
            </CardContent>

            <CardFooter className="px-4 md:px-6 lg:px-8 py-6">
              <Button 
                type="submit" 
                className="w-full px-6 md:px-8 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700" 
                disabled={isSubmitting}
              >
                {isSubmitting ? "Submitting..." : "Submit Final Decision"}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
};

export default FinalDecision;