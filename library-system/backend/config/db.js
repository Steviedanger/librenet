import mongoose from 'mongoose';

/**
 * Establish a connection to MongoDB using the URI from the environment.
 * Exits the process on a hard connection failure so the app does not run
 * in a broken half-connected state.
 */
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`MongoDB connection error: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;
