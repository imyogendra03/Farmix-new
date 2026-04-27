import React, { useState, useRef, useEffect, useCallback } from 'react';
import { MessageSquare, X, Send, Bot, Leaf } from 'lucide-react';
import api from '../../services/api';
import './Chatbot.css';

const INITIAL_MESSAGE = {
  role: 'bot',
  text: 'Hello! I\'m AgriTech AI 🌿 — your smart farming assistant. Ask me about crops, soil, irrigation, pest control, fertilizers, or market prices!'
};

const DEFAULT_QUICK_REPLIES = [
  'What crops to grow?',
  'Irrigation tips',
  'Pest control advice',
  'Fertilizer guide',
  'Market prices'
];

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [conversation, setConversation] = useState([INITIAL_MESSAGE]);
  const [isLoading, setIsLoading] = useState(false);
  const [quickReplies, setQuickReplies] = useState(DEFAULT_QUICK_REPLIES);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [conversation, scrollToBottom]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const sendMessage = useCallback(async (text) => {
    if (!text?.trim() || isLoading) return;

    const userMsg = text.trim();
    setMessage('');
    setConversation((prev) => [...prev, { role: 'user', text: userMsg }]);
    setIsLoading(true);

    try {
      const historyContext = conversation.slice(-6);
      const res = await api.post('/chatbot/query', {
        message: userMsg,
        history: historyContext
      });
      if (res.data.success) {
        setConversation((prev) => [...prev, { role: 'bot', text: res.data.data.reply }]);
        if (res.data.data.quickReplies?.length) {
          setQuickReplies(res.data.data.quickReplies);
        }
      }
    } catch {
      setConversation((prev) => [
        ...prev,
        { role: 'bot', text: 'Sorry, I\'m having trouble connecting right now. Please try again in a moment.' }
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [conversation, isLoading]);

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage(message);
  };

  const handleSmartReply = (reply) => {
    sendMessage(reply);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* Chat Window */}
      {isOpen && (
        <div className="bg-white dark:bg-gray-800 w-80 sm:w-96 rounded-2xl shadow-2xl mb-4 overflow-hidden border border-gray-100 dark:border-gray-700 flex flex-col chatbot-window">
          {/* Header */}
          <div className="bg-gradient-to-r from-nature-600 to-nature-700 text-white p-4 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="bg-white/20 p-1.5 rounded-full">
                <Leaf className="h-4 w-4" />
              </div>
              <div>
                <h3 className="font-semibold tracking-wide text-sm">AgriTech AI</h3>
                <p className="text-xs text-nature-200">Smart Farming Assistant</p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-nature-100 hover:text-white transition-colors focus:outline-none hover:bg-white/10 p-1 rounded-full">
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-grow p-4 overflow-y-auto bg-gray-50 dark:bg-gray-900 h-80 space-y-4 transition-colors scroll-smooth">
            {conversation.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'bot' && (
                  <div className="flex-shrink-0 w-7 h-7 rounded-full bg-nature-100 dark:bg-nature-900/50 flex items-center justify-center mr-2 mt-1">
                    <Bot className="h-4 w-4 text-nature-600 dark:text-nature-400" />
                  </div>
                )}
                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm shadow-sm leading-relaxed
                    ${msg.role === 'user'
                      ? 'bg-nature-600 text-white rounded-tr-none'
                      : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 border border-gray-100 dark:border-gray-700 rounded-tl-none'
                    }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {isLoading && (
              <div className="flex items-end gap-2 justify-start">
                <div className="flex-shrink-0 w-7 h-7 rounded-full bg-nature-100 dark:bg-nature-900/50 flex items-center justify-center">
                  <Bot className="h-4 w-4 text-nature-600 dark:text-nature-400" />
                </div>
                <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl rounded-tl-none px-4 py-3 shadow-sm flex items-center space-x-1.5">
                  <div className="w-2 h-2 bg-nature-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-nature-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-nature-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Smart Replies */}
          <div className="px-3 py-2 bg-gray-50 dark:bg-gray-900 flex gap-2 overflow-x-auto whitespace-nowrap border-t border-gray-100 dark:border-gray-700">
            {quickReplies.map((reply, idx) => (
              <button
                key={idx}
                onClick={() => handleSmartReply(reply)}
                disabled={isLoading}
                className="text-xs bg-white dark:bg-gray-800 border border-nature-200 dark:border-nature-700 text-nature-700 dark:text-nature-300 px-3 py-1.5 rounded-full hover:bg-nature-50 dark:hover:bg-nature-900/50 transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50 flex-shrink-0"
              >
                {reply}
              </button>
            ))}
          </div>

          {/* Input Area */}
          <form onSubmit={handleSubmit} className="p-3 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700 flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Ask about crops, soil, pests..."
              className="flex-grow px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-nature-500 focus:bg-white dark:focus:bg-gray-800 text-gray-900 dark:text-gray-100 transition-all"
            />
            <button
              type="submit"
              disabled={!message.trim() || isLoading}
              className="bg-nature-600 text-white p-2 rounded-full hover:bg-nature-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg hover:scale-105 flex-shrink-0"
            >
              <Send className="h-5 w-5" />
            </button>
          </form>
        </div>
      )}

      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`${isOpen ? 'bg-red-500 hover:bg-red-600' : 'bg-nature-600 hover:bg-nature-700'}
          text-white p-4 rounded-full shadow-xl transition-all duration-300 hover:scale-110 focus:outline-none focus:ring-4 focus:ring-nature-500/40`}
      >
        {isOpen ? <X className="h-6 w-6" /> : <MessageSquare className="h-6 w-6" />}
      </button>
    </div>
  );
};

export default Chatbot;
