import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config();

const connectToDB = async () => {
    try {
        const uri = process.env.MONGO_URI;

        if (!uri) {
            throw new Error('MONGODB_URI is not defined in the environment variables');
        }

        const options = {
            
            maxpoolSize: 10,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        };

        await mongoose.connect(uri, options);
        console.log("MongoDB connected successfully");
        mongoose.connection.on('connected', () => {
            console.log('Mongoose connected to DB');
        });

        mongoose.connection.on('error', (err) => {
            console.error('Mongoose connection error:', err);
        });

        mongoose.connection.on('disconnected', () => {
            console.log('Mongoose disconnected');
        });
        process.on('SIGINT', async () => {
            await mongoose.connection.close();
            console.log('Mongoose connection closed due to application termination');
            process.exit(0);
        });

    } catch (error) {
        console.error("MongoDB connection error:", error.message || error);
        throw error;
    }
};

export default connectToDB;
