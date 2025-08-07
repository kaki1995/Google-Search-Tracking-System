import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { trackingService } from "@/lib/tracking";

const ConsentScreen = () => {
  const [consent, setConsent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async () => {
    if (!consent) return;
    
    setIsSubmitting(true);
    
    try {
      await trackingService.trackConsent(true, {
        timestamp: Date.now(),
        userAgent: navigator.userAgent
      });
      
      navigate('/background-survey');
    } catch (error) {
      console.error('Error tracking consent:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDecline = async () => {
    await trackingService.trackConsent(false);
    // Redirect to a thank you page or close the study
    alert('Thank you for your time. You have declined to participate in this study.');
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Research Study Consent</CardTitle>
          <CardDescription>
            Search Behavior Tracking System - University Research Study
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <ScrollArea className="h-80 w-full border rounded-md p-4">
            <div className="space-y-4 text-sm">
              <div>
                <h3 className="font-semibold mb-2">Study Purpose</h3>
                <p>
                  You are being invited to participate in a research study about search behavior. 
                  This study aims to understand how people search for information online and make decisions 
                  based on search results.
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">What You Will Do</h3>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Complete a brief background survey (2-3 minutes)</li>
                  <li>Perform a specific search task using our Google-like interface (5-10 minutes)</li>
                  <li>Complete a post-task questionnaire (2-3 minutes)</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Data Collection</h3>
                <p>
                  We will collect anonymous data about your search behavior, including:
                </p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Search queries you enter</li>
                  <li>Links you click on</li>
                  <li>How you scroll through results</li>
                  <li>Time spent on each activity</li>
                  <li>Your final decision and reasoning</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Privacy & Anonymity</h3>
                <ul className="list-disc pl-5 space-y-1">
                  <li>No personal identifying information is collected</li>
                  <li>All data is completely anonymous</li>
                  <li>You are identified only by a random session ID</li>
                  <li>Data is stored securely and used only for research purposes</li>
                  <li>You can withdraw at any time without penalty</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Risks & Benefits</h3>
                <p>
                  There are no anticipated risks to participating in this study. 
                  Your participation contributes to research that may help improve 
                  search interfaces and user experience.
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Contact Information</h3>
                <p>
                  If you have questions about this research, please contact the research team 
                  at [research-contact@university.edu].
                </p>
              </div>
            </div>
          </ScrollArea>

          <div className="mt-6 space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="consent" 
                checked={consent} 
                onCheckedChange={(checked) => setConsent(checked as boolean)}
              />
              <label 
                htmlFor="consent" 
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                I have read and understood the information above, and I voluntarily consent 
                to participate in this research study.
              </label>
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex justify-between px-4 py-6">
          <Button variant="outline" onClick={handleDecline} className="px-8 py-2 text-sm font-medium border-2">
            Decline
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={!consent || isSubmitting}
            className="px-8 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            {isSubmitting ? "Processing..." : "I Consent - Continue"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default ConsentScreen;