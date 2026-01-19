import { useState, useContext, useRef, useEffect } from 'react';
import { AppContext } from '../App';
import { ArrowLeft, Send, MessageCircle } from 'lucide-react';
import { BottomNav } from './BottomNav';
import { getChatMessages, sendChatMessage, markChatMessageRead } from '../services/api';

export function ChatScreen() {
  const context = useContext(AppContext);
  const [selectedCafe, setSelectedCafe] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Sync with backend when a cafe is selected
  useEffect(() => {
    if (!selectedCafe || !context) return;

    const fetchMessages = async () => {
      try {
        const response = await getChatMessages(Number(selectedCafe));
        if (response.data) {
          const mappedMessages = response.data.map((msg: any) => {
            // Robust mapping for snake_case or camelCase
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

          // Replace context messages for this cafe
          context.setChatMessages?.((prev) => ({
            ...prev,
            [selectedCafe]: mappedMessages,
          }));

          // Mark operator messages as read
          const unreadOperatorMessages = mappedMessages.filter((m: any) => String(m.sender).toLowerCase() === 'operator' && !m.isRead);
          unreadOperatorMessages.forEach(async (msg: any) => {
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
    };

    fetchMessages();
    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
  }, [selectedCafe, context?.setChatMessages]);

  useEffect(() => {
    scrollToBottom();
  }, [context?.chatMessages, selectedCafe]);

  const handleSendMessage = async () => {
    if (!message.trim() || !selectedCafe || isSending) return;

    setIsSending(true);
    const messageText = message.trim();
    setMessage('');

    try {
      const response = await sendChatMessage({
        message: messageText,
        warnet_id: Number(selectedCafe),
      });

      // Handle response data (Adonis returns the object directly)
      if (response) {
        const msgData = response.data || response;
        const senderType = msgData.sender_type || msgData.senderType || ('user' as const);
        const createdAt = msgData.created_at || msgData.createdAt;

        const newMessage = {
          id: String(msgData.id),
          sender: senderType as 'user' | 'operator',
          message: msgData.message,
          timestamp: createdAt ? new Date(createdAt).getTime() : Date.now(),
          isRead: true
        };

        context?.addChatMessage(selectedCafe, newMessage);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      setMessage(messageText); // Restore message on failure
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

  if (!selectedCafe) {
    return (
      <div className="min-h-screen pb-24 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        {/* Animated background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-0 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl" />
        </div>

        {/* Header */}
        <div className="relative z-[100] bg-slate-900/95 backdrop-blur-xl border-b border-slate-800/50 sticky top-0">
          <div className="px-6 py-5">
            <h1 className="text-slate-200 flex items-center gap-2">
              <MessageCircle className="w-6 h-6 text-cyan-400" />
              💬 Obrolan Cafe
            </h1>
            <p className="text-slate-400 text-sm">Hubungi operator warnet</p>
          </div>
        </div>

        {/* Cafe List */}
        <div className="relative z-10 px-6 py-6 space-y-4">
          {context?.cafes.slice(0, 5).map((cafe) => {
            const messages = context.chatMessages[cafe.id] || [];
            const lastMessage = messages[messages.length - 1];
            const unreadCount = messages.filter((m) => String(m.sender).toLowerCase() === 'operator' && !m.isRead).length;

            return (
              <button
                key={cafe.id}
                onClick={() => setSelectedCafe(cafe.id)}
                className="w-full bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 hover:border-cyan-500/50 rounded-3xl p-5 text-left transition-all hover:shadow-lg hover:shadow-cyan-500/10 group"
              >
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-cyan-500/50 rounded-2xl p-3">
                      <MessageCircle className="w-6 h-6 text-cyan-400 group-hover:scale-110 transition-transform" />
                    </div>
                    {unreadCount > 0 && (
                      <div className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[20px] h-5 px-1 flex items-center justify-center">
                        {unreadCount}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-slate-200 mb-1 truncate">{cafe.name}</h3>
                    {lastMessage ? (
                      <p className="text-slate-400 text-sm truncate">
                        {String(lastMessage.sender).toLowerCase() === 'user' ? 'Anda: ' : ''}
                        {lastMessage.message}
                      </p>
                    ) : (
                      <p className="text-slate-500 text-sm">Mulai percakapan</p>
                    )}
                  </div>
                  <div className="text-slate-500 text-xs">
                    {lastMessage && formatTime(lastMessage.timestamp)}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Bottom Navigation */}
        <BottomNav />
      </div>
    );
  }

  const cafe = context?.cafes.find((c) => c.id === selectedCafe);
  const messages = context?.chatMessages[selectedCafe] || [];

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/3 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 right-1/3 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <div className="relative z-[100] bg-slate-900/95 backdrop-blur-xl border-b border-slate-800/50 sticky top-0">
        <div className="px-6 py-5 flex items-center gap-4">
          <button
            onClick={() => setSelectedCafe(null)}
            className="bg-slate-800/50 border border-slate-700/50 p-2.5 rounded-2xl hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-slate-300" />
          </button>
          <div className="flex items-center gap-3 flex-1">
            <div className="bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-cyan-500/50 rounded-xl p-2">
              <MessageCircle className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h1 className="text-slate-200">{cafe?.name}</h1>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                <p className="text-slate-400 text-xs">Operator online</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="relative z-10 flex-1 overflow-y-auto px-6 py-6 space-y-4">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="bg-slate-900/50 border border-slate-800/50 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="w-8 h-8 text-slate-600" />
              </div>
              <p className="text-slate-400 mb-1">Belum ada pesan</p>
              <p className="text-slate-500 text-sm">Mulai percakapan di bawah</p>
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg) => {
              const isMe = String(msg.sender).toLowerCase() === 'user';
              return (
                <div
                  key={msg.id}
                  className={`flex ${isMe ? 'justify-end' : 'justify-start'} mb-1`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-2.5 relative ${isMe
                      ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-tr-none shadow-md'
                      : 'bg-slate-800 border border-slate-700 text-slate-200 rounded-tl-none shadow-md'
                      }`}
                  >
                    <p className="text-[15px] leading-relaxed pr-8">{msg.message}</p>
                    <div className="flex justify-end items-center mt-1 -mr-1">
                      <span className={`text-[10px] ${isMe ? 'text-cyan-100' : 'text-slate-500'}`}>
                        {formatTime(msg.timestamp)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input */}
      <div className="relative z-[100] bg-slate-900/95 backdrop-blur-xl border-t border-slate-800/50 p-6">
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
              placeholder="Ketik pesan Anda…"
              rows={1}
              className="w-full bg-slate-800/50 border border-slate-700/50 rounded-2xl px-4 py-3 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 transition-all resize-none"
            />
          </div>
          <button
            onClick={handleSendMessage}
            disabled={!message.trim() || isSending}
            className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 disabled:from-slate-700 disabled:to-slate-700 disabled:cursor-not-allowed text-white p-3.5 rounded-2xl transition-all shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}