import React, { useState, useEffect, useRef } from 'react';
import type { Message, Conversation, Exercise } from '../types';
import { generateResponse, generateSpeech, generateExercise, evaluateAnswer } from '../services/geminiService';
import { playAudio } from '../utils/audio';
import MessageBubble from './MessageBubble';
import ChatInput from './ChatInput';
import ExerciseView from './ExerciseView';
import { TUTOR_IDENTITY_MESSAGE } from '../constants';

interface ChatWindowProps {
    conversation: Conversation;
    onUpdateConversation: (messages: Message[], userMessage?: string) => void;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ conversation, onUpdateConversation }) => {
  const [messages, setMessages] = useState<Message[]>(conversation.messages);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isDeepThoughtMode, setIsDeepThoughtMode] = useState<boolean>(false);
  const [isTtsEnabled, setIsTtsEnabled] = useState<boolean>(false);
  const [selectedVoice, setSelectedVoice] = useState<string>('Kore');
  const [currentExercise, setCurrentExercise] = useState<Exercise | null>(null);
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Sync messages when conversation prop changes
  useEffect(() => {
    setMessages(conversation.messages);
  }, [conversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Lazily initializes and returns the AudioContext to comply with browser autoplay policies.
  const getAudioContext = (): AudioContext | null => {
      if (typeof window === 'undefined') return null;
      if (!audioContextRef.current) {
          try {
              audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
          } catch(e) {
              console.error("Could not create AudioContext:", e);
              return null;
          }
      }
      return audioContextRef.current;
  }

  // Generates and plays audio for a given text message if TTS is enabled.
  const speakMessage = async (text: string) => {
    if (isTtsEnabled) {
      const audioContext = getAudioContext();
      if (audioContext) {
        try {
          const audioBase64 = await generateSpeech(text, selectedVoice);
          await playAudio(audioBase64, audioContext);
        } catch (ttsError) {
          console.error("TTS generation or playback failed:", ttsError);
        }
      }
    }
  };

  const handleSendMessage = async (userInput: string, image: string | null) => {
    if (!userInput.trim() && !image) return;

    const userMessage: Message = { role: 'user', content: userInput, image: image };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      // Exclude the initial identity message from the history sent to the API
      const history = messages.filter(m => m.content !== TUTOR_IDENTITY_MESSAGE);

      const response = await generateResponse(history, userInput, image, isDeepThoughtMode);
      
      const modelResponse: Message = { role: 'model', content: response.text };
      const finalMessages = [...newMessages, modelResponse];
      setMessages(finalMessages);
      onUpdateConversation(finalMessages, userInput);

      await speakMessage(response.text);

    } catch (error) {
      console.error('Error sending message to Gemini:', error);
      const errorDetails = error instanceof Error ? error.message : String(error);
      console.error('Error details:', errorDetails);
      
      // Parse error to provide better messages
      let userFriendlyMessage = "Oops! Something went wrong. Please try again.";
      
      try {
        const errorObj = typeof errorDetails === 'string' ? JSON.parse(errorDetails) : errorDetails;
        if (errorObj?.error?.code === 503 || errorObj?.error?.status === 'UNAVAILABLE') {
          userFriendlyMessage = "The AI model is currently overloaded. Please wait a moment and try again. This usually resolves quickly!";
        } else if (errorObj?.error?.code === 401 || errorObj?.error?.message?.includes('API key')) {
          userFriendlyMessage = "API key issue. Please check your GEMINI_API_KEY in .env.local file.";
        } else if (errorObj?.error?.message) {
          userFriendlyMessage = `Error: ${errorObj.error.message}. Please try again.`;
        }
      } catch (e) {
        // If parsing fails, check for common error patterns
        if (errorDetails.includes('503') || errorDetails.includes('overloaded') || errorDetails.includes('UNAVAILABLE')) {
          userFriendlyMessage = "The AI model is currently overloaded. Please wait a moment and try again. This usually resolves quickly!";
        } else if (errorDetails.includes('401') || errorDetails.includes('API key')) {
          userFriendlyMessage = "API key issue. Please check your GEMINI_API_KEY in .env.local file.";
        }
      }
      
      const errorMessage: Message = { 
        role: 'model', 
        content: userFriendlyMessage
      };
      const finalMessages = [...newMessages, errorMessage];
      setMessages(finalMessages);
      onUpdateConversation(finalMessages);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartExercise = async () => {
    setIsLoading(true);
    const thinkingMessage: Message = { role: 'model', content: "Great! Let me prepare a question for you based on our conversation..." };
    const newMessages = [...messages, thinkingMessage];
    setMessages(newMessages);

    try {
        const history = messages.filter(m => m.content !== TUTOR_IDENTITY_MESSAGE);
        const response = await generateExercise(history);
        const exerciseData = JSON.parse(response.text) as Exercise;
        
        const questionIntroMessage: Message = { role: 'model', content: "Alright, here is a question for you:" };

        setMessages(prev => [...prev.slice(0, -1), questionIntroMessage]);
        setCurrentExercise(exerciseData);

    } catch (error) {
        console.error('Error generating exercise:', error);
        const errorMessage: Message = { role: 'model', content: "I'm sorry, I had trouble creating a question. Let's try again later." };
        setMessages(prev => [...prev.slice(0, -1), errorMessage]);
    } finally {
        setIsLoading(false);
    }
  };

  const handleExerciseSubmit = async (userAnswer: string) => {
    if (!currentExercise) return;

    setIsEvaluating(true);
    const userAnswerMessage: Message = { role: 'user', content: userAnswer };
    const newMessages = [...messages, userAnswerMessage];
    setMessages(newMessages);

    try {
        const response = await evaluateAnswer(currentExercise, userAnswer);
        const feedbackMessage: Message = { role: 'model', content: response.text };
        const finalMessages = [...newMessages, feedbackMessage];
        setMessages(finalMessages);
        onUpdateConversation(finalMessages);

        await speakMessage(response.text);

    } catch (error) {
        console.error('Error evaluating answer:', error);
        const errorMessage: Message = { role: 'model', content: "Oops, something went wrong while checking your answer. Please try again." };
        const finalMessages = [...newMessages, errorMessage];
        setMessages(finalMessages);
        onUpdateConversation(finalMessages);
    } finally {
        setCurrentExercise(null);
        setIsEvaluating(false);
    }
  };


  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
        {messages.map((msg, index) => (
          <MessageBubble key={index} message={msg} />
        ))}
        {isLoading && <MessageBubble message={{role: 'model', content: '...'}} isLoading={true} />}
        <div ref={messagesEndRef} />
      </div>
      {currentExercise ? (
          <ExerciseView 
            exercise={currentExercise}
            onSubmit={handleExerciseSubmit}
            isEvaluating={isEvaluating}
          />
      ) : (
        <ChatInput
          onSendMessage={handleSendMessage}
          isLoading={isLoading}
          isDeepThoughtMode={isDeepThoughtMode}
          onDeepThoughtToggle={() => setIsDeepThoughtMode(prev => !prev)}
          isTtsEnabled={isTtsEnabled}
          onTtsToggle={() => setIsTtsEnabled(prev => !prev)}
          selectedVoice={selectedVoice}
          onVoiceChange={setSelectedVoice}
          onStartExercise={handleStartExercise}
        />
      )}
    </div>
  );
};

export default ChatWindow;