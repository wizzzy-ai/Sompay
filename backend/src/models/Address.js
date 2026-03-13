import mongoose from "mongoose";

const addressSchema = new mongoose.Schema({
  houseAddress: {
    type: String,
    required: true,
    trim: true
  },
  street: {
    type: String,
    required: true,
    trim: true
  },
  state: {
    type: String,
    trim: true
  },
  country: {
    type: String,
    trim: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  }
}, { timestamps: true });

export default mongoose.model("Address", addressSchema);
