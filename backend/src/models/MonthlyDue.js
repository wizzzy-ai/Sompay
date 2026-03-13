import mongoose from 'mongoose';

const monthlyDueSchema = new mongoose.Schema(
  {
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: true
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
      min: 0
    },
    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'assignedByModel',
      required: true
    },
    assignedByModel: {
      type: String,
      enum: ['Admin', 'Company'],
      default: 'Company'
    },
    notes: {
      type: String,
      default: null
    }
  },
  { timestamps: true }
);

monthlyDueSchema.index({ company: 1, user: 1, month: 1, year: 1 }, { unique: true });

const MonthlyDue = mongoose.model('MonthlyDue', monthlyDueSchema);

export default MonthlyDue;
