// Import necessary modules
const express = require('express');                                  // Web framework for Node.js
const path = require('path');                                        // Path module for handling and transforming file paths
const mongoose = require('mongoose');                                // MongoDB object modeling tool
const ejsMate = require('ejs-mate');                                 // Template engine to enhance EJS
const ExpressError = require('./utils/ExpressError');                // Custom error handling class
const methodOverride = require('method-override');                   // Middleware to support PUT and DELETE methods in forms

const campgrounds = require('./routes/campgrounds');
const reviews = require('./routes/reviews'); 

// Connect to MongoDB database
mongoose.connect('mongodb://localhost:27017/yelp-camp-2');

// Confirm database connection and log any errors
const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", () => {
    console.log("Database connected");
});

const app = express();

// Set EJS as the template engine and configure views
app.engine('ejs', ejsMate);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware for parsing request body and enabling PUT/DELETE methods
app.use(express.urlencoded({ extended: true })); // Parse form data
app.use(methodOverride('_method'));              // Support PUT/DELETE in forms

app.use('/campgrounds', campgrounds)
app.use('/campgrounds/:id/reviews', reviews)

// Home route
app.get('/', (req, res) => {
    res.render('home'); // Render the home page
});

// Route to handle all undefined routes (404 errors)
app.all('*', (req, res, next) => {
    next(new ExpressError('Page Not Found', 404)); // Pass a custom 404 error to the error handler
});

// Error handling middleware
app.use((err, req, res, next) => {
    const { statusCode = 500 } = err;                            // Default status code is 500 (internal server error)
    if (!err.message) err.message = 'Oh No, Something Went Wrong!'; // Default error message
    res.status(statusCode).render('error', { err });             // Render error page with the error details
});

// Start the server on port 3000
app.listen(3000, () => {
    console.log('Server running on port 3000');
});
