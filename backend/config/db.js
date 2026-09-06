/*
=========================================================
 SPORTING - MONGODB DATABASE CONNECTION
 File: backend/config/db.js
=========================================================
*/

const mongoose = require("mongoose");

const connectDB = async () => {
    try {
        const mongoURI = process.env.MONGO_URI;

        if (!mongoURI) {
            throw new Error(
                "MONGO_URI is missing from the .env file."
            );
        }

        const connection = await mongoose.connect(
            mongoURI
        );

        console.log(
            `MongoDB connected successfully: ${connection.connection.host}`
        );

        return connection;

    } catch (error) {
        console.error(
            "MongoDB connection failed:"
        );

        console.error(
            error.message
        );

        process.exit(1);
    }
};

module.exports = connectDB;