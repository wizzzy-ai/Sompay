import mongoose from 'mongoose';

const monthlyDueAdjustmentSchema = new mongoose.Schema(
  {
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    month: {
      type: Number,
      required: true,
      min: 1,
      max: 12,
    },
    year: {
      type: Number,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'createdByModel',
      required: true,
    },
    createdByModel: {
      type: String,
      enum: ['Admin', 'Company'],
      default: 'Company',
    },
    notes: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

monthlyDueAdjustmentSchema.index({ company: 1, user: 1, year: 1, month: 1, createdAt: -1 });

const MonthlyDueAdjustment = mongoose.model('MonthlyDueAdjustment', monthlyDueAdjustmentSchema);

export default MonthlyDueAdjustment;

