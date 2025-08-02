import BrowserBar from "@/components/BrowserBar";

export default function ExitStudy() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-[905px] h-auto max-h-[680px] border-8 border-[#CAC4D0] rounded-[29px] bg-[#FEF7FF] overflow-hidden relative">
        {/* Browser Bar */}
        <div className="relative z-10">
          <BrowserBar />
        </div>

        {/* Content */}
        <div className="relative z-10 px-8 py-20 text-center">
          <h1 className="text-[26px] font-medium leading-8 text-[#1D1B20] mb-8">
            Thank you for your time.
          </h1>
          <p className="text-base leading-6 text-[#1D1B20]">
            You have exited the study, and no data has been collected.
          </p>
        </div>
      </div>
    </div>
  );
}