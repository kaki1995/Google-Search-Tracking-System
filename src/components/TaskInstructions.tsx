import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, Search, Clock, Target } from "lucide-react";

const TaskInstructions = () => {
  const [understood, setUnderstood] = useState(false);
  const navigate = useNavigate();

  const handleStartTask = () => {
    navigate('/search-task');
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-3xl">
        <CardHeader>
          <CardTitle className="text-2xl font-bold flex items-center gap-2">
            <Target className="h-6 w-6 text-primary" />
            Your Search Task
          </CardTitle>
          <CardDescription>
            Please read these instructions carefully before beginning the search task.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <Alert>
            <Search className="h-4 w-4" />
            <AlertDescription>
              <strong>Your Task:</strong> You are planning a weekend trip to a new city and need to find 
              the best restaurant for a special dinner. Use the search interface to find and decide on 
              the most suitable restaurant option.
            </AlertDescription>
          </Alert>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                What to do:
              </h3>
              <ul className="list-disc pl-6 space-y-2 text-sm">
                <li>Search for restaurant information using the provided search interface</li>
                <li>Browse through search results and click on links that seem relevant</li>
                <li>Consider factors like cuisine type, ratings, price, and location</li>
                <li>Take your time to make an informed decision</li>
                <li>At the end, you'll choose your final restaurant and explain why</li>
              </ul>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Clock className="h-5 w-5 text-blue-600" />
                Important Notes:
              </h3>
              <ul className="list-disc pl-6 space-y-2 text-sm">
                <li>Search naturally - use whatever terms feel right to you</li>
                <li>There's no "correct" answer - choose what appeals to you</li>
                <li>You can search multiple times and refine your queries</li>
                <li>Feel free to click on multiple restaurant links to compare</li>
                <li>The task typically takes 5-10 minutes</li>
              </ul>
            </div>
          </div>

          <div className="bg-muted p-4 rounded-lg">
            <h3 className="font-semibold mb-2">Remember:</h3>
            <p className="text-sm text-muted-foreground">
              We're studying how people search for information, not testing your knowledge. 
              Search and browse naturally, as you would in real life. Your behavior and 
              decision-making process are valuable regardless of which restaurant you ultimately choose.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <input 
              type="checkbox" 
              id="understood" 
              checked={understood}
              onChange={(e) => setUnderstood(e.target.checked)}
              className="rounded"
            />
            <label htmlFor="understood" className="text-sm">
              I have read and understood the task instructions
            </label>
          </div>
        </CardContent>

        <CardFooter>
          <Button 
            onClick={handleStartTask} 
            disabled={!understood}
            className="w-full"
            size="lg"
          >
            Start Search Task
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default TaskInstructions;