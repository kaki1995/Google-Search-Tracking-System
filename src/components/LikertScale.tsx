import { FormControl, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

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
    <FormItem className="space-y-3">
      <FormLabel className="text-base font-medium text-gray-900">
        {questionNumber}. {question} {required && <span className="text-red-500">*</span>}
      </FormLabel>
      <FormControl>
        <div className="flex items-center gap-4">
          {/* Left label */}
          <div className="text-sm text-gray-600 min-w-[120px] text-left">
            1-{leftLabel}
          </div>
          
          {/* Radio buttons */}
          <RadioGroup
            onValueChange={field.onChange}
            value={field.value}
            className="flex items-center gap-6"
          >
            {[1, 2, 3, 4, 5, 6, 7].map((value) => (
              <div key={value} className="flex flex-col items-center gap-1">
                <RadioGroupItem 
                  value={value.toString()} 
                  id={`${questionNumber}-${value}`}
                  className="w-4 h-4"
                />
                <label 
                  htmlFor={`${questionNumber}-${value}`} 
                  className="text-sm text-gray-600 cursor-pointer"
                >
                  {value}
                </label>
              </div>
            ))}
          </RadioGroup>
          
          {/* Right label */}
          <div className="text-sm text-gray-600 min-w-[120px] text-right">
            7-{rightLabel}
          </div>
        </div>
      </FormControl>
      <FormMessage />
    </FormItem>
  );
}