import mongoose from 'mongoose';

/**
 * @description Establishes a resilient connection to MongoDB.
 * MONGO_URI must be defined before this is called (loaded by server.js entry point).
 * This function will crash the process on failure — silent failures are
 * unacceptable in an emergency response system.
 */
const connectDB = async () => {
    if (!process.env.MONGO_URI) {
        console.error('❌ MONGO_URI is not defined. Check your .env file.');
        process.exit(1);
    }

    try {
        const conn = await mongoose.connect(process.env.MONGO_URI, {
            serverSelectionTimeoutMS: 5000, // Fail fast if no server responds
            socketTimeoutMS: 45000,
            maxPoolSize: 10,
        });

        console.log(`✅ MongoDB connected: ${conn.connection.host}`);
        console.log(`📂 Database: ${conn.connection.name}`);

        mongoose.connection.on('disconnected', () => {
            console.warn('⚠️  MongoDB disconnected. Check your network or Atlas status.');
        });

        mongoose.connection.on('error', (err) => {
            console.error(`❌ MongoDB runtime error: ${err.message}`);
        });

    } catch (error) {
        console.error(`❌ MongoDB connection failed: ${error.message}`);
        process.exit(1); // Fail loudly. Do not fake a working database.
    }
};

export default connectDB;
