import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Welcome from "./pages/Welcome";
import ExitStudy from "./pages/ExitStudy";
import SearchResults from "./components/SearchResults";
import SearchResultLog from "./pages/SearchResultLog";
import GoogleSearchInterface from "./pages/GoogleSearchInterface";
import SearchInterface from "./pages/SearchInterface";

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
          
          <Route path="/exit-study" element={<ExitStudy />} />
          <Route path="/background-survey" element={<BackgroundSurvey />} />
          <Route path="/task-instructions" element={<TaskInstructions />} />
          <Route path="/search-interface" element={<SearchInterface />} />
          <Route path="/search-result-log" element={<SearchResultLog />} />
          <Route path="/post-task-survey" element={<PostTaskSurvey />} />
          <Route path="/thank-you" element={<div className="min-h-screen relative flex items-center justify-center p-8"
            style={{
              backgroundImage: "url('/mountain-background.jpg')",
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat'
            }}>
            {/* Background overlay for better text readability */}
            <div className="absolute inset-0 bg-black bg-opacity-20"></div>
            
            <div className="max-w-2xl text-center space-y-6 bg-white bg-opacity-95 backdrop-blur-sm border border-border p-8 shadow-lg mx-0 rounded-xl relative z-10">
              <div className="text-4xl mb-4">🎉</div>
              <h1 className="text-3xl font-semibold text-gray-900 mb-6">Thank You for Participating!</h1>
              <p className="text-lg text-gray-700 mb-4">We truly appreciate your time and input. If you have any questions or feedback, feel free to contact us at:</p>
              <p className="text-lg font-medium text-primary">📧 SearchBehaviorTeam@outlook.com</p>
            </div>
          </div>} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>;
export default App;