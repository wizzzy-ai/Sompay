import mongoose from 'mongoose';

const companyJoinRequestSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'cancelled'],
      default: 'pending',
      index: true,
    },
    message: {
      type: String,
      default: null,
    },
    decidedAt: {
      type: Date,
      default: null,
    },
    decidedBy: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'decidedByModel',
      default: null,
    },
    decidedByModel: {
      type: String,
      enum: ['Admin', 'Company'],
      default: null,
    },
  },
  { timestamps: true }
);

companyJoinRequestSchema.index({ user: 1, company: 1, status: 1 });

const CompanyJoinRequest = mongoose.model('CompanyJoinRequest', companyJoinRequestSchema);

export default CompanyJoinRequest;

