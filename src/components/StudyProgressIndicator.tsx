import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { sessionManager } from '@/lib/sessionManager';
import { CheckCircle, Clock, ArrowRight } from 'lucide-react';

interface StudyProgressIndicatorProps {
  currentPage: string;
}

export default function StudyProgressIndicator({ currentPage }: StudyProgressIndicatorProps) {
  const [progressData, setProgressData] = useState<Record<string, any>>({});

  useEffect(() => {
    const loadProgress = () => {
      const summary = sessionManager.getResponsesSummary();
      setProgressData(summary);
    };

    loadProgress();
    
    // Update progress every 5 seconds to reflect real-time changes
    const interval = setInterval(loadProgress, 5000);
    return () => clearInterval(interval);
  }, []);

  const pages = [
    { id: 'background_survey', name: 'Personal Background', path: '/background-survey' },
    { id: 'task_instruction', name: 'Task Instructions', path: '/task-instructions' },
    { id: 'search_result_log', name: 'Search Results', path: '/search-result-log' },
    { id: 'post_task_survey', name: 'Experience Feedback', path: '/post-task-survey' }
  ];

  const getPageStatus = (pageId: string) => {
    const data = progressData[pageId];
    if (data?.hasData) {
      return { status: 'saved', icon: CheckCircle, color: 'text-green-600' };
    }
    return { status: 'pending', icon: Clock, color: 'text-gray-400' };
  };

  const currentPageIndex = pages.findIndex(page => 
    currentPage.includes(page.id) || currentPage === page.path
  );

  return (
    <div className="bg-white bg-opacity-90 backdrop-blur-sm rounded-lg p-4 mb-6 border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
        <ArrowRight className="h-5 w-5 text-blue-600" />
        Study Progress
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {pages.map((page, index) => {
          const { status, icon: Icon, color } = getPageStatus(page.id);
          const isCurrent = index === currentPageIndex;
          const isCompleted = status === 'saved';
          
          return (
            <div
              key={page.id}
              className={`flex items-center gap-2 p-2 rounded-md transition-colors ${
                isCurrent 
                  ? 'bg-blue-100 border border-blue-300' 
                  : isCompleted 
                    ? 'bg-green-50 border border-green-200' 
                    : 'bg-gray-50 border border-gray-200'
              }`}
            >
              <Icon className={`h-4 w-4 ${color}`} />
              <span className={`text-sm font-medium ${
                isCurrent ? 'text-blue-800' : isCompleted ? 'text-green-700' : 'text-gray-600'
              }`}>
                {page.name}
              </span>
              {isCompleted && (
                <span className="text-xs text-green-600 font-medium">✓ Saved</span>
              )}
              {isCurrent && (
                <span className="text-xs text-blue-600 font-medium">Current</span>
              )}
            </div>
          );
        })}
      </div>
      
      {Object.values(progressData).some(data => data.hasData) && (
        <div className="mt-3 p-2 bg-blue-50 rounded-md border border-blue-200">
          <p className="text-sm text-blue-700">
            💾 Your answers are automatically saved as you type. You can navigate back to previous pages to review and modify your responses.
          </p>
        </div>
      )}
    </div>
  );
}
