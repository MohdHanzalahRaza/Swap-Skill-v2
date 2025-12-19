import { useState, useEffect, useRef } from "react";
import {
  Search,
  Send,
  MoreVertical,
  Phone,
  Video,
  Paperclip,
  Smile,
  X,
  Check,
  CheckCheck,
  MessageCircle,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import socket from "../socket";
// NOTE: Replacing direct fetch with a centralized API service import is usually better,
// but sticking to the provided direct fetch pattern for the implementation.
// import api from '../services/api';

// Helper function to format message time
const formatTime = (date) => {
  const now = new Date();
  const messageDate = new Date(date);
  const diffInHours = (now - messageDate) / (1000 * 60 * 60);

  if (isNaN(messageDate)) return ""; // Handle invalid date

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
  // Conversation structure is expected to be:
  // { _id: string, userId: string, userName: string, userAvatar: string, lastMessage: string, lastMessageTime: Date, unreadCount: number }
  const [conversations, setConversations] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  // Message structure is expected to be:
  // { _id: string, senderId: string, content: string, createdAt: Date, read: boolean }
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);

  // --- API Functions (Using direct fetch as per your snippet) ---

  const fetchConversations = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      // NOTE: Using the hardcoded URL from the snippet. Adjust path if necessary.
      const response = await fetch(
        "http://localhost:5000/api/messages/conversations",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.ok) {
        const data = await response.json();
        // Assuming the response structure is { conversations: [...] }
        const convs = data.conversations || [];
        setConversations(convs);

        // Auto-select the first conversation if none is selected
        if (!selectedChat && convs.length > 0) {
          setSelectedChat(convs[0]);
        }
      }
    } catch (error) {
      console.error("Error fetching conversations:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (conversationId) => {
    if (!conversationId) return;
    setMessages([]); // Clear previous messages
    try {
      const token = localStorage.getItem("token");
      // NOTE: Using the hardcoded URL from the snippet.
      const response = await fetch(
        `http://localhost:5000/api/messages/${conversationId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.ok) {
        const data = await response.json();
        // Assuming the response structure is { messages: [...] }
        setMessages(data.messages || []);
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    const messageContent = newMessage.trim();
    if (!messageContent || !selectedChat) return;

    try {
      const token = localStorage.getItem("token");
      // NOTE: Using the hardcoded URL from the snippet.
      const response = await fetch("http://localhost:5000/api/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          receiverId: selectedChat.userId, // The ID of the person we are chatting with
          content: messageContent,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        // data.message is the newly created message object
        setMessages((prevMessages) => [...prevMessages, data.message]);
        setNewMessage("");

        // Optionally update the last message in the conversations list
        setConversations((prevConvs) =>
          prevConvs.map((c) =>
            c._id === selectedChat._id
              ? {
                  ...c,
                  lastMessage: messageContent,
                  lastMessageTime: new Date().toISOString(),
                }
              : c
          )
        );
      } else {
        const errorData = await response.json();
        console.error("Send message error:", errorData.message);
      }
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  // --- Effects ---

  // 1. Fetch conversations on mount
  useEffect(() => {
    fetchConversations();
  }, []);

  // 2. Fetch messages when a chat is selected
  useEffect(() => {
    if (selectedChat) {
      fetchMessages(selectedChat._id);
    }
  }, [selectedChat]);

  // 3. Scroll to the latest message whenever messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 4. Real-time incoming messages
  useEffect(() => {
    socket.on("receive_message", (message) => {
      // Only add message if it belongs to the currently open chat
      if (
        selectedChat &&
        (message.sender === selectedChat.userId ||
          message.receiver === selectedChat.userId)
      ) {
        setMessages((prev) => [...prev, message]);
      }
    });

    return () => {
      socket.off("receive_message");
    };
  }, [selectedChat]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // --- Component Logic ---

  const filteredConversations = conversations.filter((conv) =>
    conv.userName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="h-[calc(100vh-4rem)] bg-gray-50">
      {" "}
      {/* Adjusted height to account for a typical 4rem navbar */}
      <div className="h-full max-w-7xl mx-auto flex shadow-2xl rounded-xl overflow-hidden">
        {/* Conversations Sidebar */}
        <div className="w-full md:w-96 bg-white border-r border-gray-200 flex flex-col">
          {/* Sidebar Header & Search */}
          <div className="p-6 border-b border-gray-200 flex-shrink-0">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <MessageCircle className="w-6 h-6 text-indigo-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
            </div>

            {/* Search Input */}
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

          {/* Conversations List */}
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
                  Start a conversation from the marketplace
                </p>
              </div>
            ) : (
              filteredConversations.map((conv) => (
                <div
                  key={conv._id}
                  onClick={() => setSelectedChat(conv)}
                  className={`p-4 border-b border-gray-100 cursor-pointer transition-all ${
                    selectedChat?._id === conv._id
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
                          {conv.userName?.[0] || "U"}
                        </div>
                      )}
                      {/* Optional: Online Status Dot */}
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-semibold text-gray-900 truncate">
                          {conv.userName || "Unknown User"}
                        </h3>
                        <span className="text-xs text-gray-500 flex-shrink-0">
                          {formatTime(conv.lastMessageTime)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-600 truncate">
                          {conv.lastMessage || "No messages yet"}
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

        {/* Chat Area (Right Pane) */}
        <div className="hidden md:flex flex-1 flex-col bg-white">
          {selectedChat ? (
            <>
              {/* Chat Header */}
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
                        {selectedChat.userName?.[0] || "U"}
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
                    {/* Call/Video buttons (non-functional placeholders) */}
                    <button
                      className="p-2 hover:bg-gray-100 rounded-full transition-colors hidden sm:block"
                      title="Call"
                    >
                      <Phone className="w-5 h-5 text-gray-600" />
                    </button>
                    <button
                      className="p-2 hover:bg-gray-100 rounded-full transition-colors hidden sm:block"
                      title="Video Call"
                    >
                      <Video className="w-5 h-5 text-gray-600" />
                    </button>
                    <button
                      className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                      title="More Options"
                    >
                      <MoreVertical className="w-5 h-5 text-gray-600" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-6 bg-gray-50 space-y-4">
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mb-4">
                      <MessageCircle className="w-10 h-10 text-indigo-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Start your exchange!
                    </h3>
                    <p className="text-gray-600">
                      Send a message to start the conversation with{" "}
                      {selectedChat.userName}.
                    </p>
                  </div>
                ) : (
                  messages.map((message, index) => {
                    const isOwn = message.sender === user?._id;
                    return (
                      <div
                        key={message._id || index} // Use message._id if available, otherwise index (less ideal)
                        className={`flex ${
                          isOwn ? "justify-end" : "justify-start"
                        }`}
                      >
                        <div
                          className={`max-w-xs lg:max-w-md ${
                            isOwn ? "order-2" : "order-1"
                          }`}
                        >
                          <div
                            className={`rounded-2xl px-4 py-3 shadow-md ${
                              isOwn
                                ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-br-none"
                                : "bg-white border border-gray-200 text-gray-900 rounded-tl-none"
                            }`}
                          >
                            <p className="break-words whitespace-pre-wrap">
                              {message.content}
                            </p>
                          </div>
                          <div
                            className={`flex items-center gap-1 mt-1 ${
                              isOwn ? "justify-end" : "justify-start"
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
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div className="p-4 border-t border-gray-200 bg-white flex-shrink-0">
                <form
                  onSubmit={handleSendMessage}
                  className="flex items-end gap-3"
                >
                  {/* Attachment button (placeholder) */}
                  <button
                    type="button"
                    className="p-2.5 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
                    title="Attach File"
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

                  {/* Emoji button (placeholder) */}
                  <button
                    type="button"
                    className="p-2.5 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
                    title="Insert Emoji"
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
