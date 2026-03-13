import React from 'react';
import { motion } from 'framer-motion';
import './Message.css';

const Message = ({ message, isSent, formatTime }) => {
  return (
    <motion.div
      className={`message-item ${isSent ? 'sent' : 'received'}`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      <div className="message-content">
        <p>{message.content}</p>
        <span className="message-time">{formatTime(message.createdAt)}</span>
      </div>
    </motion.div>
  );
};

export default Message;
