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
      <div className="min-h-screen relative bg-background flex items-center justify-center p-6 md:p-8 lg:p-12"
        style={{
          backgroundImage: "url('/mountain-background.jpg')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}>
        {/* Background overlay for better text readability */}
        <div className="absolute inset-0 bg-black bg-opacity-20"></div>
        
        <Card className="w-full max-w-4xl relative z-10 bg-white bg-opacity-95 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center flex items-center justify-center gap-2">
              <CheckCircle className="h-8 w-8 text-green-600" />
              Study Complete!
            </CardTitle>
            <CardDescription className="text-center">
              Thank you for participating in our research study.
              <div className="mt-6 text-left text-base text-gray-800">
                <hr className="my-6" />
                <p>
                  For participants from SurveySwap and SurveyCircle, redeem codes are as follows:<br />
                  <strong>SurveySwap:</strong> <a href="https://surveyswap.io/sr/IZG4-KB1A-Q3UE" target="_blank" rel="noopener noreferrer">https://surveyswap.io/sr/IZG4-KB1A-Q3UE</a> (Code: IZG4-KB1A-Q3UE)<br />
                  <strong>SurveyCircle:</strong> <a href="https://www.surveycircle.com" target="_blank" rel="noopener noreferrer">https://www.surveycircle.com</a> (Code: QMUX-TSN6-X6G5-KYS9)
                </p>
              </div>
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
    <div className="min-h-screen relative bg-background py-8 px-6 md:px-8 lg:px-12"
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
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold mb-4">Final Decision</h1>
            <p className="text-gray-600">
              Please tell us about your final restaurant choice and the reasoning behind your decision.
            </p>
          </div>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="space-y-6">
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
            </div>

            <div className="pt-6">
              <Button 
                type="submit" 
                className="w-full px-6 md:px-8 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700" 
                disabled={isSubmitting}
              >
                {isSubmitting ? "Submitting..." : "Submit Final Decision"}
              </Button>
            </div>
          </form>
        </Form>
        </div>
      </div>
    </div>
  );
};

export default FinalDecision;