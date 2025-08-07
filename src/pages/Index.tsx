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
    <div className="min-h-screen relative bg-background flex items-center justify-center px-4 md:px-8 lg:px-12"
      style={{
        backgroundImage: "url('/mountain-background.jpg')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}>
      {/* Background overlay for better text readability */}
      <div className="absolute inset-0 bg-black bg-opacity-20"></div>
      
      <div className="text-center relative z-10 bg-white bg-opacity-95 backdrop-blur-sm rounded-lg p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        <p className="mt-4 text-muted-foreground">Initializing research session...</p>
      </div>
    </div>
  );
};

export default Index;
