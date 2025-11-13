import React, { useState, useRef, useEffect } from 'react';
import { useAudioRecorder } from '../hooks/useAudioRecorder';
import { transcribeAudio } from '../services/geminiService';
import { PREBUILT_VOICES } from '../constants';

interface ChatInputProps {
  onSendMessage: (message: string, image: string | null) => void;
  isLoading: boolean;
  isDeepThoughtMode: boolean;
  onDeepThoughtToggle: () => void;
  isTtsEnabled: boolean;
  onTtsToggle: () => void;
  selectedVoice: string;
  onVoiceChange: (voice: string) => void;
  onStartExercise: () => void;
}

const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, isLoading, isDeepThoughtMode, onDeepThoughtToggle, isTtsEnabled, onTtsToggle, selectedVoice, onVoiceChange, onStartExercise }) => {
  const [inputValue, setInputValue] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { status, audioBlob, startRecording, stopRecording, reset } = useAudioRecorder();

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  useEffect(() => {
      if (status === 'stopped' && audioBlob) {
          const processAudio = async () => {
              setIsTranscribing(true);
              try {
                  const reader = new FileReader();
                  reader.onloadend = async () => {
                      const audioDataUrl = reader.result as string;
                      const transcription = await transcribeAudio(audioDataUrl);
                      setInputValue(prev => prev ? `${prev} ${transcription}` : transcription);
                      reset();
                  };
                  reader.readAsDataURL(audioBlob);
              } catch (error) {
                  console.error("Transcription failed:", error);
                  // Optionally show an error to the user
              } finally {
                  setIsTranscribing(false);
              }
          };
          processAudio();
      }
  }, [status, audioBlob, reset]);


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if ((inputValue.trim() || image) && !isLoading) {
      onSendMessage(inputValue, image);
      setInputValue('');
      setImage(null);
      if(fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
      {image && (
        <div className="mb-2 relative w-24 h-24">
          <img src={image} alt="Preview" className="w-full h-full object-cover rounded-md" />
          <button onClick={() => setImage(null)} className="absolute -top-2 -right-2 bg-gray-700 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs">X</button>
        </div>
      )}
      <div className="flex items-center gap-2">
        <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageChange} className="hidden" />
        <button onClick={() => fileInputRef.current?.click()} className="p-2 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400" aria-label="Attach image">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
        </button>
        
        <button onClick={status === 'recording' ? stopRecording : startRecording} className={`p-2 ${status === 'recording' ? 'text-red-500' : 'text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400'}`} aria-label={status === 'recording' ? 'Stop recording' : 'Start recording'}>
          {status === 'recording' ? 
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a2 2 0 00-2 2v2a2 2 0 104 0V9a2 2 0 00-2-2z" clipRule="evenodd" /></svg> :
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
          }
        </button>

        <textarea
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) handleSubmit(e) }}
          placeholder={isTranscribing ? "Transcribing audio..." : "Type your message here..."}
          rows={1}
          className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-3 resize-none focus:ring-2 focus:ring-blue-500 focus:outline-none transition duration-200"
          disabled={isLoading || status === 'recording' || isTranscribing}
        />
        
        <button onClick={onStartExercise} disabled={isLoading} className="p-2 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 disabled:opacity-50" aria-label="Start exercise">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
            </svg>
        </button>

        <button onClick={onDeepThoughtToggle} className={`p-2 ${isDeepThoughtMode ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'} hover:text-blue-600 dark:hover:text-blue-400`} aria-label="Toggle Deep Thought Mode">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.293 2.293a1 1 0 010 1.414L11 15H9v-2l6.293-6.293a1 1 0 011.414 0L19 9m-4 12h4m-2-2v4" /></svg>
        </button>
        <button onClick={onTtsToggle} className={`p-2 ${isTtsEnabled ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'} hover:text-blue-600 dark:hover:text-blue-400`} aria-label="Toggle Text-to-Speech">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /></svg>
        </button>
        {isTtsEnabled && (
          <div className="relative">
            <select
              value={selectedVoice}
              onChange={(e) => onVoiceChange(e.target.value)}
              className="bg-gray-100 dark:bg-gray-700 rounded-lg py-2 pl-3 pr-8 text-sm appearance-none focus:ring-2 focus:ring-blue-500 focus:outline-none transition duration-200"
              aria-label="Select a voice"
              disabled={isLoading}
            >
              {PREBUILT_VOICES.map((voice) => (
                <option key={voice} value={voice}>{voice}</option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700 dark:text-gray-300">
                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
            </div>
          </div>
        )}
        <button
          type="submit"
          onClick={handleSubmit}
          disabled={isLoading || (!inputValue.trim() && !image) || status === 'recording'}
          className="bg-blue-600 text-white rounded-full p-3 hover:bg-blue-700 disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed transition duration-200 focus:ring-2 focus:ring-blue-500 focus:outline-none flex items-center justify-center"
          aria-label="Send message"
        >
          {isLoading ? (
            <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : (
             <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
               <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
             </svg>
          )}
        </button>
      </div>
    </div>
  );
};

export default ChatInput;
