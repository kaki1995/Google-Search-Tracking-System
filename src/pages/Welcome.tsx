import { useState } from "react";
import { useNavigate } from "react-router-dom";
import BrowserBar from "@/components/BrowserBar";
import StudyButton from "@/components/StudyButton";

export default function Welcome() {
  const [agreed, setAgreed] = useState<boolean | null>(null);
  const navigate = useNavigate();

  const handleContinue = () => {
    if (agreed === true) {
      navigate("/background-survey");
    }
  };

  const handleExit = () => {
    navigate("/");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-[905px] h-auto max-h-[680px] border-8 border-[#CAC4D0] rounded-[29px] bg-[#FEF7FF] overflow-hidden relative">
        {/* Browser Bar */}
        <div className="relative z-10">
          <BrowserBar />
        </div>

        {/* Content */}
        <div className="relative z-10 px-8 py-6">
          {/* Logos */}
          <div className="flex items-center justify-center mb-6">
            <div className="flex items-center gap-4">
              {/* Google Logo */}
              <div className="flex p-2.5 items-center">
                <span className="text-4xl font-light">
                  <span className="text-[#4285f4]">G</span>
                  <span className="text-[#ea4335]">o</span>
                  <span className="text-[#fbbc04]">o</span>
                  <span className="text-[#4285f4]">g</span>
                  <span className="text-[#34a853]">l</span>
                  <span className="text-[#ea4335]">e</span>
                </span>
              </div>
              {/* TUM Logo Placeholder */}
              <div className="flex w-[95px] p-2.5 flex-col items-start">
                <div className="h-[44px] w-full bg-[#0065BD] rounded flex items-center justify-center">
                  <span className="text-white font-bold text-xs">TUM</span>
                </div>
              </div>
            </div>
          </div>

          {/* Title */}
          <div className="text-center mb-6">
            <h1 className="text-[26px] font-medium leading-8 text-[#1D1B20] mb-4">
              Research Study: Google Search Behavior
            </h1>
            <div className="text-base leading-6 text-[#1D1B20] space-y-4 max-w-2xl mx-auto">
              <p>
                Thank you for participating in our research study on search behavior. 
                This study will help us understand how people interact with search interfaces.
              </p>
              <p>
                The study will take approximately 10-15 minutes to complete. You will be asked to:
              </p>
              <ul className="text-left space-y-2 ml-6">
                <li>• Complete a brief background survey</li>
                <li>• Perform search tasks</li>
                <li>• Answer questions about your experience</li>
              </ul>
              <p>
                Your participation is voluntary and all data will be kept confidential.
              </p>
            </div>
          </div>

          {/* Consent */}
          <div className="flex flex-col items-center gap-4 mb-6">
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreed === true}
                  onChange={(e) => setAgreed(e.target.checked)}
                  className="w-4 h-4 text-primary bg-gray-100 border-gray-300 rounded focus:ring-primary"
                />
                <span className="text-sm text-[#1D1B20]">
                  I agree to participate in this research study
                </span>
              </label>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex justify-center gap-4">
            <StudyButton
              variant="secondary"
              onClick={handleExit}
            >
              Exit Study
            </StudyButton>
            <StudyButton
              variant="primary"
              onClick={handleContinue}
              disabled={agreed !== true}
            >
              Continue to Study
            </StudyButton>
          </div>
        </div>
      </div>
    </div>
  );
}