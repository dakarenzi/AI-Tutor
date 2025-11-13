
import React from 'react';
import type { Message } from '../types';

interface MessageBubbleProps {
  message: Message;
  isLoading?: boolean;
}

const UserIcon: React.FC = () => (
  <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center text-sm font-bold text-gray-700 dark:text-gray-200 flex-shrink-0">
    You
  </div>
);

const ModelIcon: React.FC = () => (
  <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M10 2a8 8 0 100 16 8 8 0 000-16zM5 10a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1zm1 4a1 1 0 100-2 1 1 0 000 2zm8-4a1 1 0 11-2 0 1 1 0 012 0z" clipRule="evenodd" />
    </svg>
  </div>
);

const TypingIndicator: React.FC = () => (
  <div className="flex items-center space-x-1">
      <div className="w-2 h-2 bg-blue-300 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
      <div className="w-2 h-2 bg-blue-300 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
      <div className="w-2 h-2 bg-blue-300 rounded-full animate-bounce"></div>
  </div>
);

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, isLoading = false }) => {
  const isUser = message.role === 'user';

  const formatContent = (content: string) => {
    const bolded = content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    const listItems = bolded.replace(/^\*\s/gm, '<li class="ml-4 list-disc">');
    return listItems.split('\n').map((line, i) => (
      <span key={i} dangerouslySetInnerHTML={{ __html: line }} className="block" />
    ));
  };

  if (isUser) {
    return (
      <div className="flex justify-end items-start gap-3">
        <div className="bg-blue-500 text-white p-3 rounded-lg max-w-lg shadow-md">
          {message.image && (
            <img src={message.image} alt="User upload" className="rounded-md mb-2 max-w-xs h-auto" />
          )}
          <p className="whitespace-pre-wrap">{message.content}</p>
        </div>
        <UserIcon />
      </div>
    );
  }

  return (
    <div className="flex items-start gap-3">
      <ModelIcon />
      <div className="bg-gray-200 dark:bg-gray-700 p-3 rounded-lg max-w-lg shadow-md">
        {isLoading ? <TypingIndicator /> : <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">{formatContent(message.content)}</div>}
      </div>
    </div>
  );
};

export default MessageBubble;
