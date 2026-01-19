import { useState, useContext, useRef, useEffect, useCallback } from 'react';
import { AppContext } from '../../App';
import { ArrowLeft, Send, MessageCircle, User } from 'lucide-react';
import { OperatorBottomNav } from './OperatorBottomNav';
import { getOperatorConversations, getOperatorChatMessages, sendChatMessage, markChatMessageRead } from '../../services/api';

export function OperatorChatScreen() {
    const context = useContext(AppContext);
    const [conversations, setConversations] = useState<any[]>([]);
    const [selectedUser, setSelectedUser] = useState<any | null>(null);
    const [message, setMessage] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    // Fetch all conversations for the operator's warnet
    const fetchConversations = useCallback(async () => {
        try {
            const response = await getOperatorConversations();
            if (response.data) {
                setConversations(response.data);
            }
        } catch (error) {
            console.error('Failed to fetch conversations:', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Fetch messages for a specific user
    const fetchMessages = useCallback(async () => {
        if (!selectedUser) return;
        try {
            const response = await getOperatorChatMessages(selectedUser.id);
            if (response.data) {
                const mappedMessages = response.data.map((msg: any) => {
                    const senderType = msg.sender_type || msg.senderType;
                    const createdAt = msg.created_at || msg.createdAt;
                    const isRead = msg.is_read !== undefined ? msg.is_read : msg.isRead;

                    let ts = Date.now();
                    if (createdAt) {
                        const parsed = new Date(createdAt).getTime();
                        if (!isNaN(parsed)) ts = parsed;
                    }

                    return {
                        id: String(msg.id),
                        sender: senderType,
                        message: msg.message,
                        timestamp: ts,
                        isRead: isRead,
                    };
                });

                context?.setChatMessages?.((prev) => ({
                    ...prev,
                    [`user-${selectedUser.id}`]: mappedMessages,
                }));

                // Mark user messages as read
                const unreadUserMessages = mappedMessages.filter((m: any) => String(m.sender).toLowerCase() === 'user' && !m.isRead);
                unreadUserMessages.forEach(async (msg: any) => {
                    try {
                        await markChatMessageRead(Number(msg.id));
                    } catch (err) {
                        console.error('Failed to mark message as read:', err);
                    }
                });
            }
        } catch (error) {
            console.error('Failed to fetch messages:', error);
        }
    }, [selectedUser, context?.setChatMessages]);

    useEffect(() => {
        fetchConversations();
        const interval = setInterval(fetchConversations, 10000); // UI updates unread counts
        return () => clearInterval(interval);
    }, [fetchConversations]);

    useEffect(() => {
        if (selectedUser) {
            fetchMessages();
            const interval = setInterval(fetchMessages, 5000);
            return () => clearInterval(interval);
        }
    }, [selectedUser, fetchMessages]);

    useEffect(() => {
        scrollToBottom();
    }, [context?.chatMessages, selectedUser]);

    const handleSendMessage = async () => {
        if (!message.trim() || !selectedUser || isSending) return;

        setIsSending(true);
        const messageText = message.trim();
        setMessage('');

        try {
            const response = await sendChatMessage({
                message: messageText,
                user_id: selectedUser.id,
            });

            // Handle response data (Adonis returns the object directly)
            if (response) {
                const msgData = response.data || response;
                const senderType = msgData.sender_type || msgData.senderType || 'operator';
                const createdAt = msgData.created_at || msgData.createdAt;

                const newMessage = {
                    id: String(msgData.id),
                    sender: senderType as 'user' | 'operator',
                    message: msgData.message,
                    timestamp: createdAt ? new Date(createdAt).getTime() : Date.now(),
                    isRead: true
                };

                context?.addChatMessage(`user-${selectedUser.id}`, newMessage);
                fetchConversations(); // Update conversation list
            }
        } catch (error) {
            console.error('Failed to send message:', error);
            setMessage(messageText);
        } finally {
            setIsSending(false);
        }
    };

    const formatTime = (timestamp: any) => {
        if (!timestamp) return '--:--';
        const date = new Date(timestamp);
        if (isNaN(date.getTime())) return '--:--';
        return date.toLocaleTimeString('id-ID', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        });
    };

    if (!selectedUser) {
        return (
            <div className="min-h-screen pb-24 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
                <div className="relative z-10 bg-slate-900/50 backdrop-blur-xl border-b border-slate-800/50 sticky top-0">
                    <div className="px-6 py-5">
                        <h1 className="text-slate-200 flex items-center gap-2">
                            <MessageCircle className="w-6 h-6 text-purple-400" />
                            💬 Pesan Pelanggan
                        </h1>
                        <p className="text-slate-400 text-sm">Pesan masuk dari user</p>
                    </div>
                </div>

                <div className="relative z-10 px-6 py-6 space-y-4">
                    {isLoading ? (
                        <div className="flex justify-center py-10">
                            <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : conversations.length === 0 ? (
                        <div className="text-center py-20">
                            <MessageCircle className="w-12 h-12 text-slate-700 mx-auto mb-4" />
                            <p className="text-slate-500">Belum ada percakapan</p>
                        </div>
                    ) : (
                        conversations.map((conv) => {
                            const lastMsgSender = (conv.lastMessage?.sender_type || conv.lastMessage?.senderType || '').toLowerCase();
                            const lastMsgTime = conv.lastMessage?.created_at || conv.lastMessage?.createdAt;

                            return (
                                <button
                                    key={conv.user.id}
                                    onClick={() => setSelectedUser(conv.user)}
                                    className="w-full bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 hover:border-purple-500/50 rounded-3xl p-5 text-left transition-all hover:shadow-lg hover:shadow-purple-500/10 group"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="relative">
                                            <div className="bg-gradient-to-br from-purple-500/20 to-blue-500/20 border border-purple-500/50 rounded-2xl p-3">
                                                {conv.user.avatar ? (
                                                    <img src={conv.user.avatar} className="w-6 h-6 rounded-lg object-cover" />
                                                ) : (
                                                    <User className="w-6 h-6 text-purple-400" />
                                                )}
                                            </div>
                                            {conv.unreadCount > 0 && (
                                                <div className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[20px] h-5 px-1 flex items-center justify-center">
                                                    {conv.unreadCount}
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-slate-200 mb-1 truncate">{conv.user.username}</h3>
                                            <p className="text-slate-400 text-sm truncate">
                                                {lastMsgSender === 'operator' ? 'Anda: ' : ''}
                                                {conv.lastMessage?.message}
                                            </p>
                                        </div>
                                        <div className="text-slate-500 text-xs text-right">
                                            <div>{lastMsgTime && formatTime(lastMsgTime)}</div>
                                        </div>
                                    </div>
                                </button>
                            );
                        })
                    )}
                </div>
                <OperatorBottomNav />
            </div>
        );
    }

    const messages = context?.chatMessages[`user-${selectedUser.id}`] || [];

    return (
        <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
            <div className="relative z-10 bg-slate-900/50 backdrop-blur-xl border-b border-slate-800/50 sticky top-0">
                <div className="px-6 py-5 flex items-center gap-4">
                    <button
                        onClick={() => setSelectedUser(null)}
                        className="bg-slate-800/50 border border-slate-700/50 p-2.5 rounded-2xl hover:bg-slate-800 transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5 text-slate-300" />
                    </button>
                    <div className="flex items-center gap-3 flex-1">
                        <div className="bg-gradient-to-br from-purple-500/20 to-blue-500/20 border border-purple-500/50 rounded-xl p-2">
                            <User className="w-5 h-5 text-purple-400" />
                        </div>
                        <div>
                            <h1 className="text-slate-200">{selectedUser.username}</h1>
                            <p className="text-slate-400 text-xs">Pelanggan</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="relative z-10 flex-1 overflow-y-auto px-6 py-6 space-y-4">
                {messages.map((msg: any) => {
                    const isMe = String(msg.sender).toLowerCase() === 'operator';
                    return (
                        <div
                            key={msg.id}
                            className={`flex ${isMe ? 'justify-end' : 'justify-start'} mb-1`}
                        >
                            <div
                                className={`max-w-[85%] rounded-2xl px-4 py-2.5 relative ${isMe
                                    ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-tr-none shadow-md'
                                    : 'bg-slate-800 border border-slate-700 text-slate-200 rounded-tl-none shadow-md'
                                    }`}
                            >
                                <p className="text-[15px] leading-relaxed pr-8">{msg.message}</p>
                                <div className="flex justify-end items-center mt-1 -mr-1">
                                    <span className={`text-[10px] ${isMe ? 'text-purple-100' : 'text-slate-500'}`}>
                                        {formatTime(msg.timestamp)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>

            <div className="relative z-10 bg-slate-900/90 backdrop-blur-xl border-t border-slate-800/50 p-6">
                <div className="flex items-end gap-3">
                    <div className="flex-1">
                        <textarea
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            onKeyPress={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSendMessage();
                                }
                            }}
                            placeholder="Balas pesan…"
                            rows={1}
                            className="w-full bg-slate-800/50 border border-slate-700/50 rounded-2xl px-4 py-3 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all resize-none"
                        />
                    </div>
                    <button
                        onClick={handleSendMessage}
                        disabled={!message.trim() || isSending}
                        className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 disabled:from-slate-700 disabled:to-slate-700 disabled:cursor-not-allowed text-white p-3.5 rounded-2xl transition-all shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50"
                    >
                        <Send className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
    );
}
