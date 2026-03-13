import Address from '../models/Address.js';
import User from '../models/User.js';

export const addAddress = async (req, res) => {
  try {
    const { houseAddress, street, state, country } = req.body;
    const userId = req.user.id;

    // Check if user already has an address
    const existingAddress = await Address.findOne({ user: userId });
    if (existingAddress) {
      return res.status(400).json({ error: "User already has an address. Use update instead." });
    }

    const address = await Address.create({
      houseAddress,
      street,
      state,
      country,
      user: userId,
    });

    // Update user with address reference
    await User.findByIdAndUpdate(userId, { address: address._id });

    res.json({ message: "Address added successfully", address });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

export const updateAddress = async (req, res) => {
  try {
    const { houseAddress, street, state, country } = req.body;
    const userId = req.user.id;

    const address = await Address.findOneAndUpdate(
      { user: userId },
      { houseAddress, street, state, country },
      { new: true }
    );

    if (!address) {
      return res.status(404).json({ error: "Address not found" });
    }

    res.json({ message: "Address updated successfully", address });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

export const getAddress = async (req, res) => {
  try {
    const userId = req.user.id;
    const address = await Address.findOne({ user: userId });

    res.json({ 
      address: address || null 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};


export const deleteAddress = async (req, res) => {
  try {
    const userId = req.user.id;

    const address = await Address.findOneAndDelete({ user: userId });
    if (!address) {
      return res.status(404).json({ error: "Address not found" });
    }

    // Remove address reference from user
    await User.findByIdAndUpdate(userId, { $unset: { address: 1 } });

    res.json({ message: "Address deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};
