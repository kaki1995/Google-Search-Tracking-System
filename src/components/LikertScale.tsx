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
      <table className="w-full border-separate" style={{ borderSpacing: 0 }}>
        <thead>
          <tr>
            <th className="text-left font-medium text-base pb-2" style={{ width: '28%' }}>Statement</th>
            {[1,2,3,4,5,6,7].map((value) => (
              <th key={value} className="text-center font-medium text-xs pb-2" style={{ width: '10.3%' }}>
                {value === 1 ? '1 – Strongly Disagree' : value === 7 ? '7 – Strongly Agree' : value}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr className="border-b border-gray-200 bg-gray-100 rounded-lg">
            <td className="align-top text-base py-2 pr-0 text-left whitespace-normal" style={{ verticalAlign: 'top', lineHeight: 1.3, wordBreak: 'break-word' }}>
              <FormLabel className="font-normal text-base text-left block" style={{ lineHeight: 1.3 }}>
                {question} {required && <span className="text-red-500">*</span>}
              </FormLabel>
            </td>
            {[1,2,3,4,5,6,7].map((value) => (
              <td key={value} className="text-center px-2 py-1 text-sm md:text-base" style={{ verticalAlign: 'middle' }}>
                <input
                  type="radio"
                  name={`question-${questionNumber}`}
                  value={value.toString()}
                  checked={field.value === value.toString()}
                  onChange={e => field.onChange(e.target.value)}
                  className="w-5 h-5"
                  id={`${questionNumber}-${value}`}
                  style={{ margin: '0 auto', display: 'block' }}
                />
              </td>
            ))}
          </tr>
        </tbody>
      </table>
      <FormMessage />
    </FormItem>
  );
}