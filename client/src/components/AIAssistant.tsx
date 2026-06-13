import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User as UserIcon, Sparkles } from 'lucide-react';
import { User, HealthRecord } from '../App';
import { useLanguage } from '../context/LanguageContext';

type Message = {
  id: number;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  loading?: boolean;
};

interface AIAssistantProps {
  user: User | null;
  healthRecords: HealthRecord[];
}

// API 基础地址（从环境变量读取，本地开发回退到 localhost）
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export function AIAssistant({ user, healthRecords }: AIAssistantProps) {
  const { t } = useLanguage();
 // 找到 systemPrompt 构建的部分，把开头的问候语改成英文
const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      text: `Hello ${user?.name || 'User'}! I am your AI health assistant "Xiao Jian" 👋\n\nI can help you answer health questions, analyze your health data, and provide diet and exercise advice. How can I help you today?`,
      sender: 'ai',
      timestamp: new Date(),
    },
]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    
    const userMessage: Message = {
      id: messages.length + 1,
      text: input,
      sender: 'user',
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    
    const loadingMessage: Message = {
      id: messages.length + 2,
      text: t('thinking'),
      sender: 'ai',
      timestamp: new Date(),
      loading: true,
    };
    setMessages(prev => [...prev, loadingMessage]);
    
    try {
      const response = await fetch(`${API_BASE}/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input, user: user, healthRecords: healthRecords })
      });
      
      const data = await response.json();
      
      if (!response.ok) throw new Error(data.error || '请求失败');
      
      setMessages(prev => prev.filter(m => !m.loading));
      const aiMessage: Message = {
        id: messages.length + 3,
        text: data.reply,
        sender: 'ai',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, aiMessage]);
      
    } catch (error) {
      setMessages(prev => prev.filter(m => !m.loading));
      const errorMessage: Message = {
        id: messages.length + 3,
        text: t('aiUnavailable'),
        sender: 'ai',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const quickQuestions = [
    t('askAdvice'), t('askBMI'), t('askSleep'), t('askExercise'), t('askWeight'), t('askHeartRate')
  ];

  return (
    <div className="max-w-4xl mx-auto">
      <header className="mb-8">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-3 rounded-2xl">
            <Bot className="text-white" size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white">{t('aiHealthAssistant')}</h1>
            <p className="text-gray-500 dark:text-gray-400">{t('personalizedAdvice')}</p>
          </div>
        </div>
      </header>

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl flex flex-col h-[600px] overflow-hidden">
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((message) => (
            <div key={message.id} className={`flex gap-3 ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              {message.sender === 'ai' && (
                <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Bot className="text-white" size={18} />
                </div>
              )}
              <div className={`max-w-[80%] p-4 rounded-2xl whitespace-pre-wrap ${
                message.sender === 'user'
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-tr-sm'
                  : message.loading
                  ? 'bg-gray-100 dark:bg-gray-700 text-gray-500'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-tl-sm'
              }`}>
                <p className="text-sm leading-relaxed">{message.text}</p>
                <p className={`text-xs mt-2 ${message.sender === 'user' ? 'text-indigo-200' : 'text-gray-400 dark:text-gray-500'}`}>
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              {message.sender === 'user' && (
                <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-xl flex items-center justify-center flex-shrink-0">
                  <UserIcon className="text-gray-600 dark:text-gray-400" size={18} />
                </div>
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {messages.length <= 2 && (
          <div className="px-6 pb-4">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-3 flex items-center gap-2">
              <Sparkles size={14} /> {t('tryAsking')}
            </p>
            <div className="grid grid-cols-2 gap-2">
              {quickQuestions.map((question, index) => (
                <button key={index} onClick={() => setInput(question)} className="text-left p-3 bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl text-sm text-gray-700 dark:text-gray-300 transition-colors">
                  {question}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="border-t border-gray-200 dark:border-gray-700 p-4">
          <div className="flex gap-3">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder={t('typeMessage')}
              rows={1}
              className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              style={{ minHeight: '48px', maxHeight: '120px' }}
            />
            <button onClick={handleSend} disabled={isLoading || !input.trim()} className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
              <Send size={20} />
            </button>
          </div>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">💡 {t('aiNote')}</p>
        </div>
      </div>
    </div>
  );
}