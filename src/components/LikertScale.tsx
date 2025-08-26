import { FormControl, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

interface LikertScaleProps {
  field: {
    onChange: (value: string) => void;
    value: string;
  };
  question: string;
  leftLabel: string;
  rightLabel: string;
  questionNumber: string;
  required?: boolean;
}

export default function LikertScale({ 
  field, 
  question, 
  leftLabel, 
  rightLabel, 
  questionNumber,
  required = true 
}: LikertScaleProps) {
  return (
    <FormItem>
      <FormLabel className="text-base font-medium text-gray-900">
        {questionNumber}. {question} {required && <span className="text-red-500">*</span>}
      </FormLabel>
      <FormControl>
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-gray-600">1-{leftLabel}</span>
            <span className="text-sm text-gray-600">7-{rightLabel}</span>
          </div>
          <div className="flex justify-between items-center">
            {[1, 2, 3, 4, 5, 6, 7].map((value) => (
              <div key={value} className="flex flex-col items-center">
                <input 
                  type="radio" 
                  name={`question-${questionNumber}`}
                  value={value.toString()} 
                  checked={field.value === value.toString()} 
                  onChange={(e) => {
                    field.onChange(e.target.value);
                  }}
                  className="mb-1 w-4 h-4" 
                  id={`${questionNumber}-${value}`}
                />
                <label 
                  htmlFor={`${questionNumber}-${value}`} 
                  className="text-sm text-gray-600 cursor-pointer"
                >
                  {value}
                </label>
              </div>
            ))}
          </div>
        </div>
      </FormControl>
      <FormMessage />
    </FormItem>
  );
}