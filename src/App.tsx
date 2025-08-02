import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Welcome from "./pages/Welcome";
import SearchResults from "./components/SearchResults";
import GoogleSearchInterface from "./pages/GoogleSearchInterface";
import ConsentScreen from "./components/ConsentScreen";
import BackgroundSurvey from "./components/BackgroundSurvey";
import TaskInstructions from "./components/TaskInstructions";
import PostTaskSurvey from "./components/PostTaskSurvey";
import FinalDecision from "./components/FinalDecision";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/welcome" element={<Welcome />} />
          <Route path="/consent" element={<ConsentScreen />} />
          <Route path="/background-survey" element={<BackgroundSurvey />} />
          <Route path="/task-instructions" element={<TaskInstructions />} />
          <Route path="/google-search" element={<GoogleSearchInterface />} />
          <Route path="/search-task" element={<SearchResults />} />
          <Route path="/search" element={<SearchResults />} />
          <Route path="/post-task-survey" element={<PostTaskSurvey />} />
          <Route path="/final-decision" element={<FinalDecision />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
