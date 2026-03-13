import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  senderModel: {
    type: String,
    enum: ['User', 'Company'],
    required: true,
    default: 'User'
  },
  receiver: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  receiverModel: {
    type: String,
    enum: ['User', 'Company'],
    required: true,
    default: 'User'
  },
  content: {
    type: String,
    required: true,
    trim: true
  },
  messageType: {
    type: String,
    enum: ['client_to_company', 'company_to_client'],
    required: true
  },
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date
  }
}, { timestamps: true });

messageSchema.path('sender').options.refPath = 'senderModel';
messageSchema.path('receiver').options.refPath = 'receiverModel';

// Index for efficient querying
messageSchema.index({ sender: 1, receiver: 1, createdAt: -1 });
messageSchema.index({ receiver: 1, isRead: 1 });

export default mongoose.model("Message", messageSchema);
