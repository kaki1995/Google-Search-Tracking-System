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
      if (existingSession && existingSession.backgroundSurvey) {
        navigate('/search-task');
      } else {
        navigate('/background-survey');
      }
    };

    initializeSession();
  }, [navigate, searchParams]);

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
      
      <div className="max-w-6xl mx-auto relative z-10 flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <div className="text-center bg-white bg-opacity-95 backdrop-blur-sm rounded-lg p-8 md:p-12 lg:p-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Initializing research session...</p>
        </div>
      </div>
    </div>
  );
};

export default Index;
