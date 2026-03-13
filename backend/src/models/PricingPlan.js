import mongoose from 'mongoose';

const pricingPlanSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    priceType: {
      type: String,
      enum: ['free', 'fixed', 'custom'],
      required: true,
      default: 'fixed',
    },
    priceAmount: {
      type: Number,
      default: null,
      min: 0,
    },
    priceLabel: {
      type: String,
      default: null,
      trim: true,
    },
    currencyCode: {
      type: String,
      default: 'NGN',
      trim: true,
      uppercase: true,
    },
    currencySymbol: {
      type: String,
      default: '$',
      trim: true,
    },
    interval: {
      type: String,
      enum: ['month', 'year', 'none'],
      default: 'month',
    },
    periodLabel: {
      type: String,
      default: null,
      trim: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    features: {
      type: [String],
      default: [],
    },
    highlighted: {
      type: Boolean,
      default: false,
    },
    badgeText: {
      type: String,
      default: null,
      trim: true,
    },
    savingsText: {
      type: String,
      default: null,
      trim: true,
    },
    ctaText: {
      type: String,
      default: 'Get Started',
      trim: true,
    },
    ctaHref: {
      type: String,
      default: '/register',
      trim: true,
    },
    sortOrder: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

pricingPlanSchema.index({ isActive: 1, sortOrder: 1 });

export default mongoose.model('PricingPlan', pricingPlanSchema);

