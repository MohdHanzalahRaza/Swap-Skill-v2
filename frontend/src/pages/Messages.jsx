import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Search,
  Send,
  MoreVertical,
  Phone,
  Video,
  Paperclip,
  Smile,
  Check,
  CheckCheck,
  MessageCircle,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import socketService from "../socket";
import api from "../services/api";

const formatTime = (date) => {
  const now = new Date();
  const messageDate = new Date(date);
  const diffInHours = (now - messageDate) / (1000 * 60 * 60);

  if (isNaN(messageDate)) return "";

  if (diffInHours < 24) {
    return messageDate.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  } else if (diffInHours < 48) {
    return "Yesterday";
  } else {
    return messageDate.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  }
};

const Messages = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const userIdFromUrl = searchParams.get("userId");

  const [conversations, setConversations] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const messagesEndRef = useRef(null);

  // Fetch conversations
  const fetchConversations = async () => {
    setLoading(true);
    try {
      const response = await api.get("/messages/conversations");

      if (response.data) {
        const result = response.data;
        console.log('📨 Raw conversations:', result);

        const convData = result.data || [];

        const transformedConvs = convData.map(conv => {
          const otherUser = conv._id;
          const lastMsg = conv.lastMessage;

          return {
            _id: otherUser._id,
            userId: otherUser._id,
            userName: otherUser.name || 'Unknown User',
            userAvatar: otherUser.avatar || '',
            userEmail: otherUser.email || '',
            lastMessage: lastMsg?.content || 'Start a conversation',
            lastMessageTime: lastMsg?.createdAt || new Date(),
            unreadCount: conv.unreadCount || 0
          };
        });

        console.log('✅ Transformed conversations:', transformedConvs);
        setConversations(transformedConvs);

        if (userIdFromUrl) {
          const chatToSelect = transformedConvs.find(c => c.userId === userIdFromUrl);
          if (chatToSelect) {
            console.log('🎯 Auto-selecting chat:', chatToSelect);
            setSelectedChat(chatToSelect);
          } else {
            console.log('🔍 User not in conversations, fetching...');
            await fetchUserAndCreateChat(userIdFromUrl);
          }
        } else if (!selectedChat && transformedConvs.length > 0) {
          setSelectedChat(transformedConvs[0]);
        }
      }
    } catch (error) {
      console.error("❌ Error fetching conversations:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserAndCreateChat = async (userId) => {
    try {
      const response = await api.get(`/users/${userId}`);

      if (response.data) {
        const result = response.data;
        const userData = result.data || result.user || result;

        console.log('👤 Fetched user:', userData);

        const newChat = {
          _id: userData._id,
          userId: userData._id,
          userName: userData.name || 'Unknown User',
          userAvatar: userData.avatar || '',
          userEmail: userData.email || '',
          lastMessage: 'Start a conversation',
          lastMessageTime: new Date(),
          unreadCount: 0
        };

        console.log('✨ Created chat:', newChat);
        setSelectedChat(newChat);
        setConversations(prev => [newChat, ...prev]);
      }
    } catch (error) {
      console.error("❌ Error fetching user:", error);
    }
  };

  const fetchMessages = async (userId, forceRefresh = false) => {
    if (!userId) {
      console.warn('⚠️ No userId provided to fetchMessages');
      return;
    }

    console.log(`📖 Fetching messages for userId: ${userId} (forceRefresh: ${forceRefresh})`);
    setLoadingMessages(true);

    try {
      const response = await api.get(`/messages/conversation/${userId}`);

      if (response.data) {
        const result = response.data;
        console.log('💬 API Response:', result);
        console.log('💬 Messages received:', result.data);

        const fetchedMessages = result.data || [];
        console.log(`✅ Loaded ${fetchedMessages.length} messages`);

        // Log each message for debugging
        fetchedMessages.forEach((msg, idx) => {
          console.log(`Message ${idx}:`, {
            id: msg._id,
            sender: msg.sender?.name || msg.sender,
            receiver: msg.receiver?.name || msg.receiver,
            content: msg.content,
            createdAt: msg.createdAt
          });
        });

        setMessages(fetchedMessages);
      }
    } catch (error) {
      console.error("❌ Error fetching messages:", error);
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    const messageContent = newMessage.trim();
    if (!messageContent || !selectedChat) return;

    const tempMessage = {
      _id: `temp-${Date.now()}`,
      sender: { _id: user._id, name: user.name, avatar: user.avatar },
      receiver: { _id: selectedChat.userId, name: selectedChat.userName },
      content: messageContent,
      createdAt: new Date(),
      read: false
    };

    console.log('📤 Sending message:', tempMessage);
    setMessages((prev) => [...prev, tempMessage]);
    setNewMessage("");

    try {
      const response = await api.post("/messages", {
        receiverId: selectedChat.userId,
        content: messageContent,
      });

      if (response.data) {
        const result = response.data;
        const sentMessage = result.data;

        console.log('✅ Message sent successfully:', sentMessage);

        // Replace temp message with real message
        setMessages((prev) =>
          prev.map(msg => msg._id === tempMessage._id ? sentMessage : msg)
        );

        // Update conversation list
        setConversations((prevConvs) =>
          prevConvs.map((c) =>
            c.userId === selectedChat.userId
              ? {
                ...c,
                lastMessage: messageContent,
                lastMessageTime: new Date().toISOString(),
              }
              : c
          )
        );

        // Refetch messages after a short delay to ensure backend has processed
        setTimeout(() => {
          console.log('🔄 Refetching messages to ensure sync...');
          fetchMessages(selectedChat.userId, true);
        }, 500);
      }
    } catch (error) {
      setMessages((prev) => prev.filter(msg => msg._id !== tempMessage._id));
      console.error("❌ Error sending message:", error);
    }
  };

  // EFFECTS

  useEffect(() => {
    console.log('🚀 Component mounted, fetching conversations...');
    fetchConversations();
  }, []);

  useEffect(() => {
    if (selectedChat && selectedChat.userId) {
      console.log('💬 Selected chat changed:', selectedChat);
      console.log('📖 Fetching messages for:', selectedChat.userName, selectedChat.userId);
      fetchMessages(selectedChat.userId);
    } else {
      console.log('⚠️ No chat selected or no userId');
    }
  }, [selectedChat]);

  useEffect(() => {
    console.log('📊 Messages state updated, count:', messages.length);
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const socket = socketService.getSocket();
    if (!socket) {
      console.warn('⚠️ Socket not available');
      return;
    }

    const handleNewMessage = (message) => {
      console.log('📩 Received real-time message:', message);

      if (!selectedChat) {
        console.log('⚠️ No chat selected, refreshing conversations');
        fetchConversations();
        return;
      }

      const senderId = message.sender?._id || message.sender;
      const receiverId = message.receiver?._id || message.receiver;

      console.log('🔍 Checking message:', {
        senderId,
        receiverId,
        selectedChatUserId: selectedChat.userId,
        currentUserId: user?._id
      });

      const isFromSelectedUser = senderId === selectedChat.userId;
      const isToMe = receiverId === user?._id;
      const isFromMe = senderId === user?._id;
      const isToSelectedUser = receiverId === selectedChat.userId;

      const belongsToCurrentChat = (isFromSelectedUser && isToMe) || (isFromMe && isToSelectedUser);

      console.log('🔍 Message check:', {
        isFromSelectedUser,
        isToMe,
        isFromMe,
        isToSelectedUser,
        belongsToCurrentChat
      });

      if (belongsToCurrentChat) {
        console.log('✅ Adding message to chat');
        setMessages((prev) => {
          const exists = prev.some(m => m._id === message._id);
          if (exists) {
            console.log('⚠️ Message already exists');
            return prev;
          }
          return [...prev, message];
        });
      } else {
        console.log('ℹ️ Message for different chat, refreshing conversations');
      }

      fetchConversations();
    };

    console.log('👂 Listening for real-time messages...');
    socket.on('receive_message', handleNewMessage);

    return () => {
      console.log('🔇 Cleaning up message listener');
      socket.off('receive_message', handleNewMessage);
    };
  }, [selectedChat, user]);

  const filteredConversations = conversations.filter((conv) =>
    conv.userName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="h-[calc(100vh-4rem)] bg-gray-50">
      <div className="h-full max-w-7xl mx-auto flex shadow-2xl rounded-xl overflow-hidden">
        {/* Conversations Sidebar */}
        <div className="w-full md:w-96 bg-white border-r border-gray-200 flex flex-col">
          <div className="p-6 border-b border-gray-200 flex-shrink-0">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <MessageCircle className="w-6 h-6 text-indigo-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 outline-none transition-all"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex justify-center items-center h-full min-h-[200px]">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full min-h-[200px] text-center px-6 py-8">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <MessageCircle className="w-10 h-10 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No conversations yet
                </h3>
                <p className="text-gray-600 text-sm">
                  Start a conversation from an exchange
                </p>
              </div>
            ) : (
              filteredConversations.map((conv) => (
                <div
                  key={conv._id}
                  onClick={() => {
                    console.log('👆 Clicked conversation:', conv);
                    setSelectedChat(conv);
                  }}
                  className={`p-4 border-b border-gray-100 cursor-pointer transition-all ${selectedChat?._id === conv._id
                    ? "bg-indigo-50 border-l-4 border-l-indigo-600"
                    : "hover:bg-gray-50"
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="relative flex-shrink-0">
                      {conv.userAvatar ? (
                        <img
                          src={conv.userAvatar}
                          alt={conv.userName}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                          {conv.userName?.[0]?.toUpperCase() || "U"}
                        </div>
                      )}
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-semibold text-gray-900 truncate">
                          {conv.userName}
                        </h3>
                        <span className="text-xs text-gray-500 flex-shrink-0">
                          {formatTime(conv.lastMessageTime)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-600 truncate">
                          {conv.lastMessage}
                        </p>
                        {conv.unreadCount > 0 && (
                          <span className="ml-2 w-5 h-5 bg-indigo-600 text-white text-xs font-medium rounded-full flex items-center justify-center flex-shrink-0">
                            {conv.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="hidden md:flex flex-1 flex-col bg-white">
          {selectedChat ? (
            <>
              <div className="p-4 border-b border-gray-200 bg-white flex-shrink-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {selectedChat.userAvatar ? (
                      <img
                        src={selectedChat.userAvatar}
                        alt={selectedChat.userName}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                        {selectedChat.userName?.[0]?.toUpperCase() || "U"}
                      </div>
                    )}
                    <div>
                      <h2 className="font-semibold text-gray-900">
                        {selectedChat.userName}
                      </h2>
                      <p className="text-sm text-green-600">Online</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                      <Phone className="w-5 h-5 text-gray-600" />
                    </button>
                    <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                      <Video className="w-5 h-5 text-gray-600" />
                    </button>
                    <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                      <MoreVertical className="w-5 h-5 text-gray-600" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6 bg-gray-50 space-y-4">
                {loadingMessages ? (
                  <div className="flex justify-center items-center h-full">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mb-4">
                      <MessageCircle className="w-10 h-10 text-indigo-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Start your exchange!
                    </h3>
                    <p className="text-gray-600">
                      Send a message to {selectedChat.userName}
                    </p>
                  </div>
                ) : (
                  <>
                    {console.log('🎨 Rendering messages:', messages.length)}
                    {messages.map((message, index) => {
                      const isOwn = (message.sender?._id || message.sender) === user?._id;
                      console.log(`Rendering message ${index}:`, {
                        id: message._id,
                        content: message.content,
                        isOwn,
                        sender: message.sender
                      });

                      return (
                        <div
                          key={message._id || index}
                          className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
                        >
                          <div className="max-w-xs lg:max-w-md">
                            <div
                              className={`rounded-2xl px-4 py-3 shadow-md ${isOwn
                                ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-br-none"
                                : "bg-white border border-gray-200 text-gray-900 rounded-tl-none"
                                }`}
                            >
                              <p className="break-words whitespace-pre-wrap">
                                {message.content}
                              </p>
                            </div>
                            <div
                              className={`flex items-center gap-1 mt-1 ${isOwn ? "justify-end" : "justify-start"
                                }`}
                            >
                              <span className="text-xs text-gray-500">
                                {formatTime(message.createdAt)}
                              </span>
                              {isOwn &&
                                (message.read ? (
                                  <CheckCheck className="w-4 h-4 text-indigo-600" />
                                ) : (
                                  <Check className="w-4 h-4 text-gray-400" />
                                ))}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </>
                )}
                <div ref={messagesEndRef} />
              </div>

              <div className="p-4 border-t border-gray-200 bg-white flex-shrink-0">
                <form onSubmit={handleSendMessage} className="flex items-end gap-3">
                  <button
                    type="button"
                    className="p-2.5 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
                  >
                    <Paperclip className="w-5 h-5 text-gray-600" />
                  </button>

                  <div className="flex-1 bg-gray-100 rounded-2xl px-4 py-2">
                    <textarea
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage(e);
                        }
                      }}
                      placeholder="Type a message..."
                      rows="1"
                      className="w-full bg-transparent resize-none outline-none text-gray-900 placeholder-gray-500 max-h-24"
                    />
                  </div>

                  <button
                    type="button"
                    className="p-2.5 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
                  >
                    <Smile className="w-5 h-5 text-gray-600" />
                  </button>

                  <button
                    type="submit"
                    disabled={!newMessage.trim()}
                    className="p-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center bg-gray-50">
              <div className="text-center">
                <div className="w-24 h-24 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <MessageCircle className="w-12 h-12 text-indigo-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  Select a conversation
                </h3>
                <p className="text-gray-600">
                  Choose a conversation from the sidebar to start chatting
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Messages;