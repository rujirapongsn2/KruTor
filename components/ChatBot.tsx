import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { SummaryData, ChatMessage } from '../types';
import { chatWithTeacher } from '../services/geminiService';
import Mascot from './Mascot';

interface ChatBotProps {
    summary: SummaryData;
}

export const ChatBot: React.FC<ChatBotProps> = ({ summary }) => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const userMessage: ChatMessage = { role: 'user', text: input };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        // Convert history for API
        const history = messages.map(m => ({
            role: m.role,
            parts: [{ text: m.text }]
        }));

        try {
            const responseText = await chatWithTeacher(userMessage.text, history, summary);
            setMessages(prev => [...prev, { role: 'model', text: responseText }]);
        } catch (error) {
            console.error("Chat failed", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSend();
        }
    };

    return (
        <div className="bg-white rounded-2xl shadow-xl mt-8 border-4 border-yellow-100 overflow-hidden flex flex-col h-[500px]">
            {/* Header */}
            <div className="bg-yellow-100 p-4 flex items-center gap-3">
                <Mascot emotion="happy" className="w-12 h-12" />
                <div>
                    <h3 className="text-xl font-bold text-yellow-800 fun-font">ห้องพักครู (ถาม-ตอบ)</h3>
                    <p className="text-sm text-yellow-700">สงสัยตรงไหน ถามครูได้เลยจ้ะ!</p>
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
                {messages.length === 0 && (
                    <div className="text-center text-slate-400 mt-10">
                        <p>👋 สวัสดีจ้ะ! หนูมีคำถามอะไรเกี่ยวกับเรื่อง</p>
                        <p className="font-bold">"{summary.originalTopic}"</p>
                        <p>ถามครูได้เลยนะจ๊ะ</p>
                    </div>
                )}

                {messages.map((msg, index) => (
                    <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] rounded-2xl p-4 text-base leading-relaxed ${msg.role === 'user'
                            ? 'bg-blue-500 text-white rounded-br-none'
                            : 'bg-white border border-slate-200 text-slate-700 rounded-bl-none shadow-sm'
                            }`}>
                            {msg.role === 'model' ? (
                                <ReactMarkdown
                                    components={{
                                        p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                                        strong: ({ children }) => <span className="font-bold text-yellow-700 bg-yellow-100 px-1 rounded">{children}</span>,
                                        ul: ({ children }) => <ul className="list-disc pl-5 mb-2 space-y-1">{children}</ul>,
                                        ol: ({ children }) => <ol className="list-decimal pl-5 mb-2 space-y-1">{children}</ol>,
                                        li: ({ children }) => <li className="pl-1 marker:text-yellow-500">{children}</li>,
                                    }}
                                >
                                    {msg.text}
                                </ReactMarkdown>
                            ) : (
                                msg.text
                            )}
                        </div>
                    </div>
                ))}

                {isLoading && (
                    <div className="flex justify-start">
                        <div className="bg-white border border-slate-200 text-slate-500 rounded-2xl rounded-bl-none p-4 shadow-sm flex items-center gap-2">
                            <Mascot emotion="thinking" className="w-6 h-6 animate-spin" />
                            <span className="text-sm">ครูกำลังคิดคำตอบ...</span>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white border-t border-slate-100 flex gap-2">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="พิมพ์คำถามที่นี่..."
                    className="flex-1 px-4 py-2 border-2 border-slate-200 rounded-xl focus:border-yellow-400 focus:outline-none transition-colors"
                    disabled={isLoading}
                />
                <button
                    onClick={handleSend}
                    disabled={isLoading || !input.trim()}
                    className="bg-yellow-400 hover:bg-yellow-500 text-white p-3 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    🚀
                </button>
            </div>
        </div>
    );
};
