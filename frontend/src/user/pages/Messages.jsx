import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Paperclip, Search, MoreVertical, Phone, Video, Info } from 'lucide-react';
import axios from '../../api/axios';
import Loading from '../../components/Loading';
import Message from '../components/Message';
import './Messages.css';

const Messages = () => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchMessages();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchMessages = async () => {
    try {
      setError(null);
      const response = await axios.get('/messages');
      setMessages(response.data.messages || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
      setError('Unable to load messages. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    setSending(true);
    try {
      const response = await axios.post('/messages/send', {
        content: newMessage.trim(),
        messageType: 'client_to_company'
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
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const dateObj = new Date(dateString);
    const today = new Date();

    if (dateObj.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (dateObj.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return dateObj.toLocaleDateString();
    }
  };

  if (loading) {
    return (
      <div className="messages-container">
        <div className="container py-5">
          <div className="text-center">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="messages-container">
        <div className="container py-5">
          <div className="text-center">
            <div className="alert alert-danger" role="alert">
              <h4 className="alert-heading">Connection Error</h4>
              <p>{error}</p>
              <button className="btn btn-primary" onClick={fetchMessages}>
                Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="messages-container">
      {/* Page Header */}
      <div className="page-header">
        <div className="container">
          <div className="row align-items-center">
            <div className="col-lg-8">
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                Messages
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                Communicate securely with our support team
              </motion.p>
            </div>
            <div className="col-lg-4 text-lg-end mt-3 mt-lg-0">
              <div className="d-flex gap-2 justify-content-lg-end">
                <button className="btn btn-light">
                  <Search size={20} />
                </button>
                <button className="btn btn-light">
                  <MoreVertical size={20} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Messages Content */}
      <div className="container py-4">
        <div className="row">
          <div className="col-12">
            <div className="card card-hover messages-card">
              {/* Chat Header */}
              <div className="messages-chat-header">
                <div className="d-flex align-items-center">
                  <div className="chat-avatar">
                    <div className="icon-wrapper icon-wrapper-lg">
                      <Info size={24} />
                    </div>
                  </div>
                  <div className="ms-3">
                    <h5 className="mb-0">Support Team</h5>
                    <small className="text-muted">Usually replies within minutes</small>
                  </div>
                </div>
                <div className="d-flex gap-2">
                  <button className="btn btn-sm btn-light">
                    <Phone size={18} />
                  </button>
                  <button className="btn btn-sm btn-light">
                    <Video size={18} />
                  </button>
                </div>
              </div>

              {/* Messages List */}
              <div className="messages-list">
                <AnimatePresence>
                  {messages.length === 0 ? (
                    <motion.div
                      className="empty-state"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <Info className="empty-state-icon" />
                      <h5>No messages yet</h5>
                      <p>Start a conversation with our support team</p>
                    </motion.div>
                  ) : (
                    messages.map((message, index) => {
                      const showDate = index === 0 ||
                        formatDate(message.createdAt) !== formatDate(messages[index - 1].createdAt);

                      return (
                        <div key={message._id}>
                          {showDate && (
                            <div className="message-date">
                              {formatDate(message.createdAt)}
                            </div>
                          )}
                          <Message
                            message={message}
                            isSent={message.messageType === 'client_to_company'}
                            formatTime={formatTime}
                          />
                        </div>
                      );
                    })
                  )}
                </AnimatePresence>
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <form className="message-form" onSubmit={sendMessage}>
                <button type="button" className="btn btn-light btn-icon">
                  <Paperclip size={20} />
                </button>
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type your message..."
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Messages;
