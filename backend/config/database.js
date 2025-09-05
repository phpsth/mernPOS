const mongoose = require('mongoose');
require('dotenv').config();


const connectDB = async()=>{
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI);
        console.log(`MongoDB connected: ${conn.connection.host}`);
        console.log(`Database: ${conn.connection.name}`);
    } catch (error) {
        console.error('Database connection error:', error.message);
        process.exit(1);
    }
};

mongoose.connection.on('disconnected', () => {
    console.log('MongoDB disconnected');
});

mongoose.connection.on('error', (error) => {
    console.error('MongoDB connection error', error);
});

module.exports = connectDB;