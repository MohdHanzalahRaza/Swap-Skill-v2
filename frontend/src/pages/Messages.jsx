// src/pages/Messages.jsx - Premium Layout & Logic
import { useState, useEffect, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  Search, Send, MoreVertical, Phone, Video, Paperclip, Smile,
  Check, CheckCheck, MessageCircle, ArrowLeft, Image, Mic
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import socketService from "../socket";
import api from "../services/api";
import { getAvatarUrl } from "../utils/imageUtils";
import { timeAgo, formatTime } from "../utils/helpers"; // Ensure these helpers exist or use local
import toast from 'react-hot-toast';

// Local helper if not imported
const formatMessageTime = (date) => {
  const d = new Date(date);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const Messages = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const userIdFromUrl = searchParams.get("userId");

  // State
  const [conversations, setConversations] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [showMobileChat, setShowMobileChat] = useState(false);

  const messagesEndRef = useRef(null);
  const socket = socketService.getSocket();

  // 1. Fetch Conversations
  const fetchConversations = async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/messages/conversations");
      const rawConvs = data.data || [];

      const transformed = rawConvs.map(conv => ({
        _id: conv._id._id,
        userId: conv._id._id,
        userName: conv._id.name || 'Unknown',
        userAvatar: getAvatarUrl(conv._id.avatar),
        userEmail: conv._id.email,
        lastMessage: conv.lastMessage?.content || 'Started a conversation',
        lastMessageTime: conv.lastMessage?.createdAt || new Date(),
        unreadCount: conv.unreadCount || 0,
        isOnline: false // Can be updated via socket later
      }));

      setConversations(transformed);

      // Handle URL param selection
      if (userIdFromUrl) {
        const existing = transformed.find(c => c.userId === userIdFromUrl);
        if (existing) {
          handleChatSelect(existing);
        } else {
          // New chat from URL
          fetchUserAndCreateChat(userIdFromUrl);
        }
      }
    } catch (error) {
      console.error("Fetch conversations error:", error);
      toast.error("Failed to load conversations");
    } finally {
      setLoading(false);
    }
  };

  // 2. Fetch User & Create Temp Chat
  const fetchUserAndCreateChat = async (userId) => {
    try {
      const { data } = await api.get(`/users/${userId}`);
      const userData = data.data || data;

      const newChat = {
        _id: userData._id,
        userId: userData._id,
        userName: userData.name,
        userAvatar: getAvatarUrl(userData.avatar),
        lastMessage: 'Start chatting...',
        lastMessageTime: new Date(),
        unreadCount: 0,
        isTemp: true
      };

      setConversations(prev => [newChat, ...prev]);
      handleChatSelect(newChat);
    } catch (error) {
      console.error("Create chat error:", error);
      toast.error("User not found");
    }
  };

  // 3. Fetch Messages
  const fetchMessages = async (chatId) => {
    if (!chatId) return;
    try {
      setLoadingMessages(true);
      const { data } = await api.get(`/messages/conversation/${chatId}`);
      setMessages(data.data || []);

      // Mark as read locally
      setConversations(prev => prev.map(c =>
        c.userId === chatId ? { ...c, unreadCount: 0 } : c
      ));
    } catch (error) {
      console.error("Fetch messages error:", error);
    } finally {
      setLoadingMessages(false);
    }
  };

  // 4. Handle Send Message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedChat) return;

    const content = newMessage.trim();
    const tempId = `temp-${Date.now()}`;
    const timestamp = new Date().toISOString();

    // Optimistic Update
    const optimisticMsg = {
      _id: tempId,
      content,
      sender: { _id: user._id },
      receiver: selectedChat.userId,
      createdAt: timestamp,
      read: false,
      status: 'sending'
    };

    setMessages(prev => [...prev, optimisticMsg]);
    setNewMessage("");

    // Update conversation list preview
    setConversations(prev => {
      const updated = prev.map(c =>
        c.userId === selectedChat.userId
          ? { ...c, lastMessage: content, lastMessageTime: timestamp }
          : c
      );
      // Move active chat to top
      return [
        updated.find(c => c.userId === selectedChat.userId),
        ...updated.filter(c => c.userId !== selectedChat.userId)
      ];
    });

    try {
      const { data } = await api.post("/messages", {
        receiverId: selectedChat.userId,
        content
      });

      // Replace optimistic message
      setMessages(prev => prev.map(m =>
        m._id === tempId ? data.data : m
      ));
    } catch (error) {
      console.error("Send error:", error);
      toast.error("Failed to send message");
      setMessages(prev => prev.filter(m => m._id !== tempId));
    }
  };

  // 5. Select Chat
  const handleChatSelect = (chat) => {
    setSelectedChat(chat);
    setShowMobileChat(true);
    fetchMessages(chat.userId);

    // Update URL without navigation
    const newUrl = new URL(window.location);
    newUrl.searchParams.set('userId', chat.userId);
    window.history.pushState({}, '', newUrl);
  };

  // 6. Effects
  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Socket Listener
  useEffect(() => {
    if (!socket) return;

    const handleReceiveMessage = (msg) => {
      const senderId = msg.sender._id || msg.sender;

      // Update messages if chat is open
      if (selectedChat?.userId === senderId || (msg.sender._id === user._id && selectedChat?.userId === msg.receiver)) {
        setMessages(prev => {
          if (prev.some(m => m._id === msg._id)) return prev;
          return [...prev, msg];
        });
      }

      // Update conversations list (move to top, update preview)
      setConversations(prev => {
        const otherId = msg.sender._id === user._id ? msg.receiver : msg.sender._id;
        const exists = prev.find(c => c.userId === otherId);

        if (exists) {
          const updated = prev.map(c =>
            c.userId === otherId
              ? {
                ...c,
                lastMessage: msg.content,
                lastMessageTime: msg.createdAt,
                unreadCount: (selectedChat?.userId === otherId) ? 0 : (c.unreadCount + 1)
              }
              : c
          );
          // Move to top
          return [
            updated.find(c => c.userId === otherId),
            ...updated.filter(c => c.userId !== otherId)
          ];
        } else {
          // New conversation incoming (reload to fetch details properly)
          fetchConversations();
          return prev;
        }
      });
    };

    socket.on('receive_message', handleReceiveMessage);
    return () => socket.off('receive_message', handleReceiveMessage);
  }, [selectedChat, user, socket]);

  // Filter conversations
  const filteredConversations = conversations.filter(c =>
    c.userName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="h-[calc(100vh-4rem)] bg-gray-50 dark:bg-gray-900 flex overflow-hidden">

      {/* SIDEBAR - Listed on mobile if no chat open, always on desktop */}
      <div className={`${showMobileChat ? 'hidden' : 'flex'} md:flex flex-col w-full md:w-[380px] bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 z-10`}>

        {/* Sidebar Header */}
        <div className="p-4 border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Messages</h1>
            <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-full text-indigo-600 dark:text-indigo-400">
              <MessageCircle className="w-5 h-5" />
            </div>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-700 border-none rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 dark:text-white"
            />
          </div>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>
          ) : filteredConversations.length === 0 ? (
            <div className="text-center p-8 text-gray-500 text-sm">No conversations found</div>
          ) : (
            filteredConversations.map(conv => (
              <div
                key={conv.userId}
                onClick={() => handleChatSelect(conv)}
                className={`p-4 flex items-center gap-3 cursor-pointer transition-all hover:bg-gray-50 dark:hover:bg-gray-700 ${selectedChat?.userId === conv.userId ? 'bg-indigo-50 dark:bg-indigo-900/20 border-l-4 border-indigo-600' : 'border-l-4 border-transparent'
                  }`}
              >
                <div className="relative">
                  <img src={conv.userAvatar} alt={conv.userName} className="w-12 h-12 rounded-full object-cover border border-gray-200" />
                  {conv.isOnline && <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline mb-1">
                    <h3 className={`font-semibold truncate ${selectedChat?.userId === conv.userId ? 'text-indigo-900 dark:text-indigo-300' : 'text-gray-900 dark:text-white'}`}>
                      {conv.userName}
                    </h3>
                    <span className="text-xs text-gray-400 flex-shrink-0">{timeAgo(conv.lastMessageTime)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <p className={`text-sm truncate ${conv.unreadCount > 0 ? 'font-semibold text-gray-900 dark:text-white' : 'text-gray-500'}`}>
                      {conv.lastMessage}
                    </p>
                    {conv.unreadCount > 0 && (
                      <span className="ml-2 w-5 h-5 bg-indigo-600 text-white text-xs flex items-center justify-center rounded-full">
                        {conv.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* CHAT AREA - Full width on mobile when active, remaining width on desktop */}
      <div className={`${showMobileChat ? 'flex' : 'hidden md:flex'} flex-1 flex-col bg-slate-50 dark:bg-gray-900`}>
        {selectedChat ? (
          <>
            {/* Chat Header */}
            <div className="h-16 px-4 md:px-6 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between shadow-sm z-10">
              <div className="flex items-center gap-3">
                <button onClick={() => setShowMobileChat(false)} className="md:hidden p-2 -ml-2 text-gray-600">
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <img src={selectedChat.userAvatar} alt="" className="w-10 h-10 rounded-full border border-gray-200" />
                <div>
                  <h2 className="font-bold text-gray-900 dark:text-white text-base">{selectedChat.userName}</h2>
                  <p className="text-xs text-green-600 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span> Online
                  </p>
                </div>
              </div>
              <div className="flex gap-2 text-gray-400">
                <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"><Phone className="w-5 h-5" /></button>
                <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"><Video className="w-5 h-5" /></button>
                <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"><MoreVertical className="w-5 h-5" /></button>
              </div>
            </div>

            {/* Messages List using specific wallpaper or pattern if desired */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 bg-[url('https://subtlepatterns.com/patterns/symphony.png')] dark:bg-[url('https://subtlepatterns.com/patterns/dark_matter.png')] bg-fixed">
              {loadingMessages ? (
                <div className="flex justify-center mt-10"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center text-gray-500">
                  <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mb-4">
                    <MessageCircle className="w-8 h-8 text-indigo-500" />
                  </div>
                  <p>Send a message to start chatting with <span className="font-semibold">{selectedChat.userName}</span>!</p>
                </div>
              ) : (
                messages.map((msg, idx) => {
                  const isMe = (msg.sender._id || msg.sender) === user._id;
                  const showAvatar = !isMe && (idx === 0 || messages[idx - 1].sender._id !== msg.sender._id);

                  return (
                    <div key={msg._id || idx} className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'} group`}>
                      <div className={`flex max-w-[80%] md:max-w-[70%] gap-2 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                        {/* Avatar for receiver */}
                        {!isMe && (
                          <div className="flex-shrink-0 w-8">
                            {showAvatar && <img src={selectedChat.userAvatar} className="w-8 h-8 rounded-full" />}
                          </div>
                        )}

                        {/* Message Bubble */}
                        <div className={`relative px-4 py-2.5 rounded-2xl shadow-sm ${isMe
                          ? 'bg-gradient-to-tr from-indigo-600 to-purple-600 text-white rounded-tr-none'
                          : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-tl-none border border-gray-100 dark:border-gray-700'
                          }`}>
                          <p className="whitespace-pre-wrap text-[15px] leading-relaxed break-words">{msg.content}</p>
                          <div className={`text-[10px] mt-1 flex items-center gap-1 ${isMe ? 'text-indigo-100 justify-end' : 'text-gray-400'}`}>
                            {formatMessageTime(msg.createdAt)}
                            {isMe && (
                              msg.read ? <CheckCheck className="w-3 h-3" /> : <Check className="w-3 h-3" />
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
              <form onSubmit={handleSendMessage} className="flex items-end gap-2 max-w-4xl mx-auto">
                <button type="button" className="p-3 text-gray-400 hover:text-indigo-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors">
                  <Paperclip className="w-5 h-5" />
                </button>

                <div className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-2xl flex items-center p-2 focus-within:ring-2 focus-within:ring-indigo-100 dark:focus-within:ring-indigo-900 transition-all">
                  <textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage(e);
                      }
                    }}
                    placeholder="Type a message..."
                    className="w-full bg-transparent border-none focus:ring-0 resize-none max-h-32 min-h-[44px] py-2.5 px-2 text-gray-900 dark:text-white placeholder-gray-500"
                    rows={1}
                  />
                  <button type="button" className="p-2 text-gray-400 hover:text-yellow-500 transition-colors">
                    <Smile className="w-5 h-5" />
                  </button>
                </div>

                {newMessage.trim() ? (
                  <button type="submit" className="p-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 active:scale-95">
                    <Send className="w-5 h-5" />
                  </button>
                ) : (
                  <button type="button" className="p-3 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors">
                    <Mic className="w-5 h-5" />
                  </button>
                )}
              </form>
            </div>
          </>
        ) : (
          /* Empty State */
          <div className="flex-1 flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 text-center p-8">
            <div className="w-32 h-32 bg-indigo-50 dark:bg-indigo-900/20 rounded-full flex items-center justify-center mb-6 animate-pulse">
              <MessageCircle className="w-16 h-16 text-indigo-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Your Messages</h2>
            <p className="text-gray-500 max-w-md">Select a conversation from the sidebar to send a message, or start a new exchange from the marketplace.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Messages;