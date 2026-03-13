import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const seedDatabase = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/psp');
    console.log('Connected to MongoDB');

    // No mock data will be created - using real authentication only
    console.log('Database seeding completed - no mock data created');

  } catch (error) {
    console.error('Error connecting to database:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
};

// Run the seed function
seedDatabase();
