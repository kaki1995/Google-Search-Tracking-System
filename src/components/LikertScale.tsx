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
          <RadioGroup
            onValueChange={field.onChange}
            value={field.value}
            className="flex justify-between items-center"
          >
            {[1, 2, 3, 4, 5, 6, 7].map((value) => (
              <div key={value} className="flex flex-col items-center">
                <RadioGroupItem 
                  value={value.toString()} 
                  id={`${questionNumber}-${value}`}
                  className="mb-1 w-4 h-4"
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
        </div>
      </FormControl>
      <FormMessage />
    </FormItem>
  );
}