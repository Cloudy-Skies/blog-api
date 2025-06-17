// Import required packages
const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const logger = require('./src/utils/logger');
const mainRouter = require('./src/routes/index');

// Load environment variables from .env file
dotenv.config();

// Initialize Express app
const app = express();

// Middleware to parse JSON request bodies
app.use(express.json());

// Connect to MongoDB
const MONGODB_URI = process.env.MONGODB_URI;

mongoose.connect(MONGODB_URI)
    .then(() => {
        logger.info('Successfully connected to MongoDB.');
    })
    .catch(err => {
        logger.error('Error connecting to MongoDB:', err);
        process.exit(1); // Exit process with failure
    });

// Health check endpoint
app.get('/', (req, res) => {
    res.status(200).json({ status: 'success', message: 'Welcome to the Blogging API!' });
});

// Use the main router for all API routes
app.use('/api/v1', mainRouter);


// Global error handler for catching unhandled errors
app.use((err, req, res, next) => {
    logger.error(err.stack);
    res.status(500).json({ status: 'error', message: 'Something went wrong on the server.' });
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    logger.info(`Server is running on port ${PORT}`);
});

// Export app for testing purposes
module.exports = app;
