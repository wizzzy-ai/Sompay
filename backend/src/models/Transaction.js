import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema({
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: false
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  month: {
    type: Number,
    required: true,
    min: 1,
    max: 12
  },
  year: {
    type: Number,
    required: true
  },
  amount: {
    type: Number,
    required: true,
    default: 100 // Mock amount
  },
  status: {
    type: String,
    enum: ['paid', 'unpaid', 'pending', 'failed'],
    default: 'unpaid'
  },
  date: {
    type: Date,
    default: Date.now
  },
  uuid: {
    type: String,
    unique: true,
    required: true
  },
  transactionType: {
    type: String,
    enum: ['payment', 'refund', 'chargeback'],
    default: 'payment'
  },
  paymentMethod: {
    type: String,
    enum: ['credit_card', 'bank_transfer', 'paypal', 'crypto'],
    default: 'credit_card'
  },
  receipt: {
    name: { type: String },
    accountNo: { type: String },
    outstandingBefore: { type: Number, default: 0 },
    requiredAmount: { type: Number },
    outstandingAfter: { type: Number, default: 0 },
    paidOn: { type: Date, default: Date.now }
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed
  }
}, {
  timestamps: true
});

// UUID is now generated in the controller

// Index for efficient queries
transactionSchema.index({ company: 1, user: 1 });
transactionSchema.index({ company: 1, status: 1 });
transactionSchema.index({ company: 1, month: 1, year: 1 });

const Transaction = mongoose.model('Transaction', transactionSchema);

export default Transaction;
