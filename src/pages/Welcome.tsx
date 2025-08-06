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
  return <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Content */}
        <div className="bg-white rounded-lg shadow-sm border p-8">
          {/* Header with Logos */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-6 mb-6">
              {/* Google Logo */}
              <div className="flex items-center">
                <img 
                  src="/lovable-uploads/e465b544-8fc4-46ac-ace4-0a9db69dbacd.png" 
                  alt="Google" 
                  className="h-12 w-12"
                />
              </div>
              
              {/* TUM Logo */}
              <div className="flex items-center">
                <img 
                  src="/lovable-uploads/d96714fb-70e1-4232-aeb2-184df4ca4cea.png" 
                  alt="Technical University of Munich" 
                  className="h-12 w-auto"
                />
              </div>
            </div>
          </div>

          {/* Title */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-semibold text-gray-900 mb-6">
              Welcome to Our Project Study
            </h1>
            <div className="text-base leading-7 text-gray-700 space-y-4 max-w-3xl mx-auto text-left">
              <p className="text-lg">
                Thank you for your interest in participating! 🙏
              </p>
              <p>
                This study is part of a collaborative research project between <strong>Google's Istanbul Office</strong> and the <strong>Technical University of Munich</strong>. We are investigating how consumers search for products using online tools.
              </p>
              <div className="p-4 rounded-lg border-l-4 border-blue-400 bg-sky-100">
                <ul className="space-y-2 list-none">
                  <li className="flex items-center gap-2">
                    <span className="text-blue-600">⏱️</span>
                    The experiment will take approximately <strong>10-15 minutes</strong> to complete.
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-600">🔒</span>
                    Your participation is <strong>voluntary and anonymous</strong>.
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-red-600">🚪</span>
                    You may exit at any time by closing the window or clicking the "Exit" button.
                  </li>
                </ul>
              </div>
              <p>
                This study complies with the data protection regulations under the <strong>General Data Protection Regulation (GDPR)</strong>. No personally identifiable information will be collected or stored without your explicit consent.
              </p>
              <p>
                If you choose to continue, we will provide further details about the task and how your responses will contribute to academic research on consumer search behavior.
              </p>
            </div>
          </div>

          {/* Consent */}
          <div className="flex flex-col items-center gap-6 mb-8">
            <div className="bg-gray-50 p-4 rounded-lg border max-w-2xl">
              <label className="flex items-start gap-3 cursor-pointer">
                <input type="checkbox" checked={agreed === true} onChange={e => setAgreed(e.target.checked)} className="w-5 h-5 text-primary bg-white border-gray-300 rounded focus:ring-primary mt-0.5" />
                <span className="text-sm text-gray-700 leading-relaxed">
                  I have read the above and voluntarily agree to participate in this study.
                </span>
              </label>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex justify-center gap-6">
            <button onClick={handleExit} className="px-8 py-3 border border-gray-300 text-gray-700 bg-white rounded-lg hover:bg-gray-50 transition-colors font-medium">
              Exit Study
            </button>
            <button onClick={handleContinue} disabled={agreed !== true} className="px-8 py-3 rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed text-slate-50 bg-sky-700 hover:bg-sky-600">
              Continue to Study
            </button>
          </div>
        </div>
      </div>
    </div>;
}