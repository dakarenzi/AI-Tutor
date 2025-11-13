
import React, { useState, useEffect, useCallback } from 'react';
import ChatWindow from './components/ChatWindow';
import ConversationSidebar from './components/ConversationSidebar';
import type { Conversation, Message } from './types';
import { TUTOR_IDENTITY_MESSAGE } from './constants';

const LOCAL_STORAGE_KEY = 'kaelo-conversations';

function App() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);

  const handleNewConversation = useCallback(() => {
    const newConversation: Conversation = {
      id: Date.now().toString(),
      title: 'New Chat',
      messages: [{ role: 'model', content: TUTOR_IDENTITY_MESSAGE }],
      timestamp: Date.now(),
    };
    setConversations(prev => [newConversation, ...prev]);
    setActiveConversationId(newConversation.id);
  }, []);

  // Load conversations from local storage on initial render
  useEffect(() => {
    try {
      const savedConversations = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (savedConversations) {
        const parsed = JSON.parse(savedConversations) as Conversation[];
        if (parsed.length > 0) {
          setConversations(parsed);
          setActiveConversationId(parsed[0].id); // Activate the most recent one
          return;
        }
      }
    } catch (error) {
      console.error("Failed to load conversations from local storage:", error);
    }
    // If no conversations, create a new one
    handleNewConversation();
  }, [handleNewConversation]);

  // Save conversations to local storage whenever they change
  useEffect(() => {
    if (conversations.length > 0) {
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(conversations));
      } catch (error) {
        console.error("Failed to save conversations to local storage:", error);
      }
    } else {
        localStorage.removeItem(LOCAL_STORAGE_KEY);
    }
  }, [conversations]);

  const handleDeleteConversation = useCallback((id: string) => {
    setConversations(prev => {
        const remaining = prev.filter(c => c.id !== id);

        if (remaining.length === 0) {
            // This will be caught by the an effect and a new one will be created.
            // To avoid complexity, we just set to empty and let the system handle it.
            setActiveConversationId(null);
            return [];
        }

        if (activeConversationId === id) {
            setActiveConversationId(remaining[0].id);
        }
        
        return remaining;
    });
  }, [activeConversationId]);
  
  // Effect to handle case where all conversations are deleted
  useEffect(() => {
    if (conversations.length === 0 && activeConversationId === null) {
      handleNewConversation();
    }
  }, [conversations, activeConversationId, handleNewConversation]);


  const handleUpdateConversation = (updatedMessages: Message[], userMessage?: string) => {
    if (!activeConversationId) return;

    setConversations(prev => {
      const newConversations = prev.map(conv => {
        if (conv.id === activeConversationId) {
          // Update title with first user message if it's a "New Chat"
          const title = (conv.title === 'New Chat' && userMessage)
            ? userMessage.split(' ').slice(0, 5).join(' ') + (userMessage.split(' ').length > 5 ? '...' : '')
            : conv.title;
          
          return { ...conv, messages: updatedMessages, title, timestamp: Date.now() };
        }
        return conv;
      });

      // Sort to bring the updated conversation to the top
      return newConversations.sort((a, b) => b.timestamp - a.timestamp);
    });
  };

  const activeConversation = conversations.find(c => c.id === activeConversationId);

  return (
    <div className="bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 min-h-screen flex items-center justify-center font-sans">
      <div className="w-full h-screen md:h-[90vh] md:max-w-6xl lg:max-w-7xl bg-white dark:bg-gray-800 shadow-2xl rounded-lg flex flex-col md:flex-row overflow-hidden">
        <div className="w-full md:w-72 bg-gray-50 dark:bg-gray-900/50 flex flex-col border-b md:border-b-0 md:border-r border-gray-200 dark:border-gray-700">
            <ConversationSidebar
                conversations={conversations}
                activeConversationId={activeConversationId}
                onSelectConversation={setActiveConversationId}
                onNewConversation={handleNewConversation}
                onDeleteConversation={handleDeleteConversation}
            />
        </div>
        <div className="flex-1 flex flex-col">
            <header className="bg-blue-600 dark:bg-blue-800 text-white p-4 flex items-center shadow-md z-10">
           <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mr-3" viewBox="0 0 24 24" fill="currentColor">
            <path d="M0 0h24v24H0z" fill="none"/>
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
            <path d="M12 12m-5 0a5 5 0 1010 0 5 5 0 10-10 0"/>
            <path d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm0 6c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z" fill="none"/>
            <text x="12" y="16" fontSize="8" fill="white" textAnchor="middle">AI</text>
          </svg>
          <h1 className="text-xl font-bold">AI Tutor - Kaelo</h1>
        </header>
            {activeConversation ? (
                 <ChatWindow
                    key={activeConversation.id}
                    conversation={activeConversation}
                    onUpdateConversation={handleUpdateConversation}
                 />
            ) : (
                <div className="flex-1 flex items-center justify-center">
                    <p className="text-gray-500 dark:text-gray-400">Loading conversation...</p>
                </div>
            )}
        </div>
      </div>
    </div>
  );
}

export default App;
