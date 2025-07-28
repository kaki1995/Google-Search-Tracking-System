import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { trackingService } from "@/lib/tracking";

const Index = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const initializeSession = async () => {
      const token = searchParams.get('token');
      const sessionId = await trackingService.initSession(token);
      
      // Check if returning user with existing session
      const existingSession = trackingService.loadSession();
      if (existingSession && existingSession.consentGiven) {
        if (existingSession.backgroundSurvey) {
          navigate('/search-task');
        } else {
          navigate('/background-survey');
        }
      } else {
        navigate('/consent');
      }
    };

    initializeSession();
  }, [navigate, searchParams]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        <p className="mt-4 text-muted-foreground">Initializing research session...</p>
      </div>
    </div>
  );
};

export default Index;
