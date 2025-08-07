import { useNavigate } from "react-router-dom";
import BrowserBar from "@/components/BrowserBar";
import StudyButton from "@/components/StudyButton";

export default function GoogleSearchInterface() {
  const navigate = useNavigate();

  const handleTaskFinish = () => {
    navigate("/post-task-survey");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6 md:p-8 lg:p-12">
      <div className="w-full max-w-[905px] h-screen max-h-[680px] border-8 border-[#CAC4D0] rounded-[18px] bg-[#FEF7FF] overflow-hidden relative">
        {/* Browser Bar */}
        <div className="relative z-10">
          <BrowserBar />
        </div>

        {/* Google Interface */}
        <div className="relative h-full">
          {/* Google Search Page Simulation */}
          <div className="w-full h-full bg-white relative">
            {/* Google Logo and Search */}
            <div className="flex flex-col items-center pt-20">
              <div className="mb-8">
                <span className="text-8xl font-light">
                  <span className="text-[#4285f4]">G</span>
                  <span className="text-[#ea4335]">o</span>
                  <span className="text-[#fbbc04]">o</span>
                  <span className="text-[#4285f4]">g</span>
                  <span className="text-[#34a853]">l</span>
                  <span className="text-[#ea4335]">e</span>
                </span>
              </div>

              {/* Search Box */}
              <div className="relative mb-8">
                <div className="flex items-center w-[584px] h-[44px] border border-gray-300 rounded-full px-4 shadow-sm hover:shadow-md transition-shadow">
                  <svg className="w-4 h-4 text-gray-400 mr-3" viewBox="0 0 24 24" fill="none">
                    <path d="M21 21L16.514 16.506L21 21ZM19 10.5C19 15.194 15.194 19 10.5 19C5.806 19 2 15.194 2 10.5C2 5.806 5.806 2 10.5 2C15.194 2 19 5.806 19 10.5Z" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                  <input 
                    type="text" 
                    className="flex-1 outline-none"
                    placeholder="Search Google or type a URL"
                  />
                  <svg className="w-4 h-4 text-gray-400 ml-3" viewBox="0 0 24 24" fill="none">
                    <path d="M19 19L14 14M14 14A7 7 0 1 0 14 14Z" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                </div>
              </div>

              {/* Search Buttons */}
              <div className="flex gap-4 mb-8">
                <button className="px-3 md:px-4 py-2 bg-[#f8f9fa] border border-[#f8f9fa] rounded text-sm text-[#3c4043] hover:shadow-sm hover:border-gray-300">
                  Google Search
                </button>
                <button className="px-3 md:px-4 py-2 bg-[#f8f9fa] border border-[#f8f9fa] rounded text-sm text-[#3c4043] hover:shadow-sm hover:border-gray-300">
                  I'm Feeling Lucky
                </button>
              </div>

              {/* Languages */}
              <div className="text-sm text-gray-600">
                Google offered in: 
                <a href="#" className="text-blue-600 hover:underline ml-1">Deutsch</a>
              </div>
            </div>
          </div>

          {/* Task Finish Button Overlay */}
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
            <StudyButton
              variant="primary"
              onClick={handleTaskFinish}
              className="flex items-center gap-2 px-4 md:px-6"
            >
              <svg width="21" height="20" viewBox="0 0 21 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M13.8333 14.1666L12.6458 13L16.4791 9.16663L12.6458 5.33329L13.8333 4.16663L18.8333 9.16663L13.8333 14.1666ZM2.16663 15.8333V12.5C2.16663 11.3472 2.5694 10.368 3.37496 9.56246C4.1944 8.74301 5.18052 8.33329 6.33329 8.33329H11.4791L8.47913 5.33329L9.66663 4.16663L14.6666 9.16663L9.66663 14.1666L8.47913 13L11.4791 9.99996H6.33329C5.63885 9.99996 5.04857 10.243 4.56246 10.7291C4.07635 11.2152 3.83329 11.8055 3.83329 12.5V15.8333H2.16663Z" fill="white"/>
              </svg>
              I have finished the task!
            </StudyButton>
          </div>
        </div>
      </div>
    </div>
  );
}