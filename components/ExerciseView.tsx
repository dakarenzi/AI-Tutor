import React, { useState } from 'react';
import type { Exercise } from '../types';

interface ExerciseViewProps {
  exercise: Exercise;
  onSubmit: (answer: string) => void;
  isEvaluating: boolean;
}

const ExerciseView: React.FC<ExerciseViewProps> = ({ exercise, onSubmit, isEvaluating }) => {
  const [userAnswer, setUserAnswer] = useState('');
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (exercise.questionType === 'MCQ') {
        if (selectedOption) onSubmit(selectedOption);
    } else {
        if (userAnswer.trim()) onSubmit(userAnswer);
    }
  };
  
  const renderInput = () => {
    switch (exercise.questionType) {
      case 'MCQ':
        return (
          <div className="space-y-2">
            {exercise.options?.map((option, index) => (
              <label key={index} className="flex items-center p-3 bg-gray-100 dark:bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                <input
                  type="radio"
                  name="mcq-option"
                  value={option}
                  checked={selectedOption === option}
                  onChange={() => setSelectedOption(option)}
                  disabled={isEvaluating}
                  className="w-4 h-4 text-blue-600 bg-gray-200 border-gray-300 focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-600 dark:border-gray-500"
                />
                <span className="ml-3 text-sm font-medium text-gray-900 dark:text-gray-300">{option}</span>
              </label>
            ))}
          </div>
        );
      case 'FILL_IN_THE_BLANK':
      case 'SHORT_ANSWER':
        return (
          <input
            type="text"
            value={userAnswer}
            onChange={(e) => setUserAnswer(e.target.value)}
            placeholder="Type your answer here..."
            disabled={isEvaluating}
            autoFocus
            className="w-full bg-gray-100 dark:bg-gray-700 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none transition duration-200"
          />
        );
      default:
        return null;
    }
  };

  const isSubmitDisabled = isEvaluating || (exercise.questionType === 'MCQ' ? !selectedOption : !userAnswer.trim());

  return (
    <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
           <p className="font-semibold text-gray-800 dark:text-gray-200 whitespace-pre-wrap">{exercise.questionText}</p>
        </div>
        <div>{renderInput()}</div>
        <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSubmitDisabled}
              className="bg-blue-600 text-white font-semibold py-2 px-6 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed transition duration-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              {isEvaluating ? 'Evaluating...' : 'Submit Answer'}
            </button>
        </div>
      </form>
    </div>
  );
};

export default ExerciseView;
