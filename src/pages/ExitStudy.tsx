import BrowserBar from "@/components/BrowserBar";

export default function ExitStudy() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6 md:p-8 lg:p-12">
      <div className="max-w-6xl mx-auto text-center bg-white rounded-lg shadow-sm border p-8 md:p-10 lg:p-12">
        <div className="text-6xl mb-8">👋</div>
        <h1 className="text-3xl font-semibold text-gray-900 mb-6">
          Thank you for your time.
        </h1>
        <p className="text-lg text-gray-700 leading-relaxed">
          You have exited the study, and no data has been collected.
        </p>
      </div>
    </div>
  );
}