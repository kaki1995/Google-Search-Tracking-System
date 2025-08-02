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
    navigate("/exit-study");
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
            <h1 className="text-[26px] font-medium leading-8 text-[#1D1B20] mb-6">
              Welcome to Our Project Study
            </h1>
            <div className="text-base leading-6 text-[#1D1B20] space-y-4 max-w-2xl mx-auto text-left">
              <p>
                Thank you for your interest in participating!
              </p>
              <p>
                This study is part of a collaborative research project between <strong>Google's Istanbul Office</strong> and the <strong>Technical University of Munich</strong>. We are investigating how consumers search for products using online tools.
              </p>
              <ul className="space-y-2 ml-6 list-disc">
                <li>The experiment will take approximately <strong>10-15 minutes</strong> to complete.</li>
                <li>Your participation is <strong>voluntary and anonymous</strong>.</li>
                <li>You may exit at any time by closing the window or clicking the "Exit" button.</li>
              </ul>
              <p>
                This study complies with the data protection regulations under the <strong>General Data Protection Regulation (GDPR)</strong>. No personally identifiable information will be collected or stored without your explicit consent.
              </p>
              <p>
                If you choose to continue, we will provide further details about the task and how your responses will contribute to academic research on consumer search behavior.
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
                  I have read the above and voluntarily agree to participate in this study.
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