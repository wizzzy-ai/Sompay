import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Search, MoreVertical, Clock, AlertCircle, ArrowLeft, RefreshCw } from 'lucide-react';
import api from '../../api/axios';
import Loading from '../../components/Loading';
import './AdminMessages.css';

const AdminMessages = () => {
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchConversations();
    // Auto-refresh conversations every 5 seconds
    const interval = setInterval(fetchConversations, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const selectedUserId = selectedConversation?.otherUser?._id;

  useEffect(() => {
    if (!selectedUserId) return;

    fetchMessages(selectedUserId);
    const interval = setInterval(() => fetchMessages(selectedUserId), 3000);
    return () => clearInterval(interval);
  }, [selectedUserId]);

  const fetchConversations = async () => {
    try {
      setError(null);
      const response = await api.get('/messages/conversations');
      console.log('Conversations response:', response.data); // Debug log
      const convs = response.data.conversations || [];
      console.log('Setting conversations:', convs);
      setConversations(convs);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching conversations:', error);
      setError('Unable to load conversations. Please try again: ' + (error.response?.data?.error || error.message));
      setConversations([]);
      setLoading(false);
    }
  };

  const fetchMessages = async (userId) => {
    try {
      setError(null);
      const response = await api.get(`/messages/conversation/${userId}`);
      setMessages(response.data.messages || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
      setError('Unable to load messages. Please try again.');
    }
  };

  const handleSelectConversation = (conversation) => {
    setSelectedConversation(conversation);
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || sending || !selectedConversation) return;

    setSending(true);
    try {
      const response = await api.post('/messages/send', {
        receiverId: selectedConversation.otherUser._id,
        content: newMessage.trim(),
        messageType: 'company_to_client'
      });

      setMessages(prev => [...prev, response.data.data]);
      setNewMessage('');
      setError(null);
    } catch (error) {
      console.error('Error sending message:', error);
      setError(error.response?.data?.error || 'Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  };

  if (loading) {
    return (
      <div className="admin-messages-container">
        <div className="container py-5">
          <Loading />
        </div>
      </div>
    );
  }

  return (
    <div className="admin-messages-container">
      {/* Page Header */}
      <div className="page-header">
        <div className="container">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            Support Messages
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            Manage and respond to user support messages
          </motion.p>
        </div>
      </div>

      {/* Messages Content */}
      <div className="container py-4">
        <div className="row g-4">
          {/* Conversations List */}
          <div className="col-lg-4">
            <motion.div
              className="card card-hover"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              {/* Error Alert */}
              {error && (
                <motion.div
                  className="alert alert-danger m-3"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <AlertCircle size={16} className="me-2" />
                  {error}
                </motion.div>
              )}

              {/* Search Header */}
              <div className="conversations-header">
                <div className="conversations-header-top">
                  <h5 className="mb-0">Conversations</h5>
                  <button 
                    className="btn-refresh"
                    onClick={fetchConversations}
                    title="Refresh conversations"
                  >
                    <RefreshCw size={18} />
                  </button>
                </div>
                <div className="search-box mt-3">
                  <Search size={18} />
                  <input
                    type="text"
                    placeholder="Search conversations..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="search-input"
                  />
                </div>
              </div>

              {/* Conversations List */}
              <div className="conversations-list">
                {conversations.length === 0 ? (
                  <div className="empty-state">
                    <Clock size={48} />
                    <p>No conversations yet</p>
                    <small style={{color: '#666666'}}>Messages from users will appear here</small>
                  </div>
                ) : (
                  conversations
                    .filter(conv =>
                      conv.otherUser?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      conv.otherUser?.email?.toLowerCase().includes(searchQuery.toLowerCase())
                    )
                    .map((conversation) => (
                      <motion.div
                        key={conversation.otherUser._id}
                        className={`conversation-item ${selectedConversation?.otherUser._id === conversation.otherUser._id ? 'active' : ''}`}
                        onClick={() => handleSelectConversation(conversation)}
                        whileHover={{ backgroundColor: 'rgba(212, 175, 55, 0.05)' }}
                      >
                        <div className="conversation-avatar">
                          <div className="avatar-letter">
                            {conversation.otherUser.name?.charAt(0).toUpperCase()}
                          </div>
                        </div>
                        <div className="conversation-info">
                          <h6 className="conversation-name">{conversation.otherUser.name}</h6>
                          <p className="conversation-email">{conversation.otherUser.email}</p>
                          <small className="conversation-preview">{conversation.lastMessage?.content || 'No messages yet'}</small>
                        </div>
                        {conversation.unreadCount > 0 && (
                          <div className="unread-badge">{conversation.unreadCount}</div>
                        )}
                      </motion.div>
                    ))
                )}
              </div>
            </motion.div>
          </div>

          {/* Chat Area */}
          <div className="col-lg-8">
            <motion.div
              className="card card-hover messages-card"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              {selectedConversation ? (
                <>
                  {/* Chat Header */}
                  <div className="messages-chat-header">
                    <div className="d-flex align-items-center">
                      <button
                        className="btn btn-sm btn-light d-lg-none me-2"
                        onClick={() => setSelectedConversation(null)}
                      >
                        <ArrowLeft size={18} />
                      </button>
                      <div className="chat-avatar">
                        <div className="avatar-letter">
                          {selectedConversation.otherUser.name?.charAt(0).toUpperCase()}
                        </div>
                      </div>
                      <div className="ms-3">
                        <h5 className="mb-0">{selectedConversation.otherUser.name}</h5>
                        <small className="text-muted">{selectedConversation.otherUser.email}</small>
                      </div>
                    </div>
                    <button className="btn btn-sm btn-light">
                      <MoreVertical size={18} />
                    </button>
                  </div>

                  {/* Error Message */}
                  {error && (
                    <motion.div
                      className="alert alert-danger m-3"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      <AlertCircle size={16} className="me-2" />
                      {error}
                    </motion.div>
                  )}

                  {/* Messages List */}
                  <div className="messages-list">
                    <AnimatePresence>
                      {messages.length === 0 ? (
                        <motion.div
                          className="empty-state"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                        >
                          <Clock size={48} />
                          <h5>No messages yet</h5>
                          <p>Start responding to this conversation</p>
                        </motion.div>
                      ) : (
                        messages.map((message, index) => {
                          const showDate = index === 0 ||
                            formatDate(message.createdAt) !== formatDate(messages[index - 1]?.createdAt);
                          const isSent = message.messageType === 'company_to_client';

                          return (
                            <div key={message._id}>
                              {showDate && (
                                <div className="message-date">
                                  {formatDate(message.createdAt)}
                                </div>
                              )}
                              <motion.div
                                className={`message ${isSent ? 'sent' : 'received'}`}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                              >
                                <div className="message-content">
                                  <div className="message-text">{message.content}</div>
                                  <small className="message-time">{formatTime(message.createdAt)}</small>
                                </div>
                              </motion.div>
                            </div>
                          );
                        })
                      )}
                    </AnimatePresence>
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Message Input */}
                  <form className="message-form" onSubmit={sendMessage}>
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type your response..."
                      className="message-input"
                      disabled={sending}
                    />
                    <button
                      type="submit"
                      className="btn btn-primary btn-icon"
                      disabled={!newMessage.trim() || sending}
                    >
                      <Send size={20} />
                    </button>
                  </form>
                </>
              ) : (
                <div className="empty-state">
                  <AlertCircle size={48} />
                  <h5>No Conversation Selected</h5>
                  <p>Select a conversation from the list to start responding</p>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminMessages;
