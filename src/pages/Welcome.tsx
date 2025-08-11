import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import BrowserBar from "@/components/BrowserBar";
import StudyButton from "@/components/StudyButton";
import { trackingService } from "@/lib/tracking";
import { enhancedTrackingService } from "@/lib/tracking_enhanced";
export default function Welcome() {
  const [agreed, setAgreed] = useState<boolean | null>(null);
  const [sessionInitialized, setSessionInitialized] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  useEffect(() => {
    const initializeSession = async () => {
      try {
        const token = searchParams.get('token');
        
        // Initialize both tracking services with error handling
        let sessionId, enhancedSessionId;
        
        try {
          sessionId = await trackingService.initSession(token);
          console.log('Basic tracking initialized:', sessionId);
        } catch (error) {
          console.error('Basic tracking failed:', error);
        }
        
        try {
          enhancedSessionId = await enhancedTrackingService.initializeSession(
            token || 'anonymous',
            undefined, // budget_range
            undefined, // location
            undefined  // device_type
          );
          console.log('Enhanced tracking initialized:', enhancedSessionId);
        } catch (error) {
          console.error('Enhanced tracking failed:', error);
        }
        
        console.log('Sessions initialized:', { sessionId, enhancedSessionId });
        
        // Track that user is on welcome page (try-catch to not block UI)
        try {
          await trackingService.trackWelcomePageAction('in_progress');
        } catch (error) {
          console.error('Failed to track welcome page action:', error);
        }
        
        // Always allow the session to be considered initialized
        setSessionInitialized(true);
      } catch (error) {
        console.error('Failed to initialize session:', error);
        // Still set as initialized to not block the UI
        setSessionInitialized(true);
      }
    };
    initializeSession();

    // Track page exit if user leaves without completing
    const handleBeforeUnload = async () => {
      if (agreed !== true) {
        await trackingService.trackWelcomePageAction('exited');
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [searchParams, agreed]);
  const handleContinue = async () => {
    if (agreed === true) {
      try {
        // Track consent given (final consent action)
        await trackingService.trackConsent(true);
      } catch (error) {
        console.error('Failed to track consent:', error);
      }
      navigate("/background-survey");
    }
  };
  const handleExit = async () => {
    // Track exit button click specifically
    await trackingService.trackExitButtonClick();
    // Also mark as final exit action
    await trackingService.trackWelcomePageAction('exited');
    // Track exit study event for enhanced metrics
    await trackingService.trackExitStudy('user_clicked_exit_study');
    navigate("/exit-study");
  };

  const handleConsentChange = async (checked: boolean) => {
    setAgreed(checked);
    // Track checkbox interaction
    await trackingService.trackConsentCheckbox(checked);
  };

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
        {/* Content */}
        <div className="bg-white bg-opacity-95 backdrop-blur-sm rounded-lg shadow-lg p-8 md:p-12 lg:p-16">
          {/* Header with Logos */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-8 mb-6">
              {/* Google Logo */}
              <div className="flex items-center">
                <img src="/lovable-uploads/acd96fcf-765a-409c-9b4e-21f07b00c747.png" alt="Google Logo" className="w-16 h-16 object-contain" />
              </div>
              {/* TUM Logo */}
              <div className="flex items-center">
                <img src="/lovable-uploads/189f5203-a64b-43cb-aa46-339285dc29e0.png" alt="TUM Logo" className="w-20 h-16 object-contain" />
              </div>
            </div>
          </div>
          {/* Title */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-semibold text-gray-900 mb-6">
              Welcome to Our Project Study
            </h1>
          </div>
          {/* Content */}
          <div className="text-base leading-7 text-gray-700 space-y-4 mx-auto text-justify">
            <p>
              Thank you for your interest in participating! 🙋
            </p>
            <p>
              This study is part of a collaborative research project between <strong>Google's Istanbul Office</strong> and the <strong>Technical University of Munich</strong>. We are investigating how consumers search for products using online tools.
            </p>
            {/* Information Box */}
            <div className="border border-blue-200 rounded-lg p-4 my-6 bg-sky-100">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <span className="text-blue-600">🕐</span>
                  <span>The experiment will take approximately <strong>10-15 minutes</strong> to complete.</span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-orange-600">⚠️</span>
                  <span>Your participation is <strong>voluntary and anonymous</strong>.</span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-red-600">📤</span>
                  <span>You may exit at any time by closing the window or clicking the "Exit" button.</span>
                </div>
              </div>
            </div>
            <p>
              This study complies with the data protection regulations under the <strong>General Data Protection Regulation (GDPR)</strong>. No personally identifiable information will be collected or stored without your explicit consent.
            </p>
            <p>
              If you choose to continue, we will provide further details about the task and how your responses will contribute to academic research on consumer search behavior.
            </p>
          </div>
          {/* Consent */}
          <div className="flex flex-col items-start gap-6 mb-8 mx-auto mt-8">
            <div className="flex items-start gap-3">
              <input type="checkbox" id="consent" checked={agreed === true} onChange={e => handleConsentChange(e.target.checked)} className="w-4 h-4 text-blue-600 bg-white border-gray-300 rounded focus:ring-blue-500 mt-1" />
              <label htmlFor="consent" className="text-base text-gray-700 cursor-pointer">
                I have read the above and voluntarily agree to participate in this study.
              </label>
            </div>
          </div>
          {/* Buttons */}
          <div className="flex justify-between pt-8">
            <button onClick={handleExit} className="px-8 py-2 text-sm font-medium border-2 border-gray-300 text-gray-700 bg-white rounded-lg hover:bg-gray-50 transition-colors">
              Exit Study
            </button>
            <button onClick={handleContinue} disabled={agreed !== true} className="px-8 py-2 text-sm font-medium text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-blue-600 hover:bg-blue-700">
              Continue to Study
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
