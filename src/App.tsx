import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Welcome from "./pages/Welcome";
import ExitStudy from "./pages/ExitStudy";
import SearchResults from "./components/SearchResults";
import SearchResultLog from "./components/SearchResultLog";
import GoogleSearchInterface from "./pages/GoogleSearchInterface";
import SearchInterface from "./pages/SearchInterface";
import ConsentScreen from "./components/ConsentScreen";
import BackgroundSurvey from "./components/BackgroundSurvey";
import TaskInstructions from "./components/TaskInstructions";
import PostTaskSurvey from "./components/PostTaskSurvey";
import FinalDecision from "./components/FinalDecision";
import NotFound from "./pages/NotFound";
const queryClient = new QueryClient();
const App = () => <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Welcome />} />
          <Route path="/consent" element={<ConsentScreen />} />
          <Route path="/exit-study" element={<ExitStudy />} />
          <Route path="/background-survey" element={<BackgroundSurvey />} />
          <Route path="/task-instructions" element={<TaskInstructions />} />
          <Route path="/search-interface" element={<SearchInterface />} />
          <Route path="/search-result-log" element={<SearchResultLog />} />
          <Route path="/post-task-survey" element={<PostTaskSurvey />} />
          <Route path="/thank-you" element={<div className="min-h-screen flex items-center justify-center p-8">
            <div className="max-w-2xl text-center space-y-6 bg-white border border-border p-8 shadow-sm mx-0 rounded-xl">
              
              <h1 className="text-3xl font-semibold text-gray-900 mb-4">Thank You for Your Participation!</h1>
              <p className="text-lg text-gray-700 mb-2">If you have questions, reach us at:</p>
              <p className="text-lg font-medium text-primary">research@yourproject.com</p>
            </div>
          </div>} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>;
export default App;