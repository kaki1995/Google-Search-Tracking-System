import BrowserBar from "@/components/BrowserBar";

export default function ExitStudy() {
  return (
    <div className="min-h-screen relative bg-background flex items-center justify-center p-6 md:p-8 lg:p-12"
      style={{
        backgroundImage: "url('/mountain-background.jpg')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}>
      {/* Background overlay for better text readability */}
      <div className="absolute inset-0 bg-black bg-opacity-20"></div>
      
      <div className="max-w-6xl mx-auto text-center bg-white bg-opacity-95 backdrop-blur-sm rounded-lg shadow-lg p-8 md:p-10 lg:p-12 relative z-10">
        <div className="text-6xl mb-8">👋</div>
        <h1 className="text-3xl font-semibold text-gray-900 mb-6">
          Thank you for your time.
        </h1>
        <p className="text-lg text-gray-700 leading-relaxed">
          You have exited the study, and no data has been collected.<br/>
          If you have any questions, please contact us at <a href="mailto:SearchBehaviorTeam@outlook.com" className="text-blue-600 underline">SearchBehaviorTeam@outlook.com</a>.
        </p>
      </div>
    </div>
  );
}