// Import necessary modules
const express = require('express');                                  // Web framework for Node.js
const path = require('path');                                        // Path module for handling and transforming file paths
const mongoose = require('mongoose');                                // MongoDB object modeling tool
const ejsMate = require('ejs-mate');                                 // Template engine to enhance EJS
const Joi = require('joi');                                          // Validation library
const { campgroundSchema, reviewSchema } = require('./schemas.js');  // Validation schemas for campground and reviews
const catchAsync = require('./utils/catchAsync');                    // Utility to catch async errors in routes
const ExpressError = require('./utils/ExpressError');                // Custom error handling class
const methodOverride = require('method-override');                   // Middleware to support PUT and DELETE methods in forms
const Campground = require('./models/campground');                   // Mongoose model for campgrounds
const Review = require('./models/review.js');                        // Mongoose model for reviews

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

// Middleware to validate campground data using Joi
const validateCampground = (req, res, next) => {
    const { error } = campgroundSchema.validate(req.body);
    if (error) {
        const msg = error.details.map(el => el.message).join(','); // Generate error message from validation details
        throw new ExpressError(msg, 400);                         // Throw custom error if validation fails
    } else {
        next();                                                   // Proceed to the next middleware/route
    }
};

// Middleware to validate review data using Joi
const validateReview = (req, res, next) => {
    const { error } = reviewSchema.validate(req.body);
    if (error) {
        const msg = error.details.map(el => el.message).join(','); // Generate error message from validation details
        throw new ExpressError(msg, 400);                         // Throw custom error if validation fails
    } else {
        next();                                                   // Proceed to the next middleware/route
    }
};

// Home route
app.get('/', (req, res) => {
    res.render('home'); // Render the home page
});

// Route to display all campgrounds
app.get('/campgrounds', async (req, res) => {
    const campgrounds = await Campground.find({});
    res.render('campgrounds/index', { campgrounds }); // Render index page with all campgrounds
});

// Form to create a new campground
app.get('/campgrounds/new', (req, res) => {
    res.render('campgrounds/new'); // Render form for creating a new campground
});

// Route to create a new campground and save it to the database
app.post('/campgrounds', validateCampground, catchAsync(async (req, res, next) => {
    const campground = new Campground(req.body.campground); // Create a new campground using form data
    await campground.save();                               // Save the campground to the database
    res.redirect(`/campgrounds/${campground._id}`);        // Redirect to the new campground's details page
}));

// Route to display details for a specific campground
app.get('/campgrounds/:id', catchAsync(async (req, res) => {
    const campground = await Campground.findById(req.params.id).populate('reviews'); // Find campground and populate its reviews
    res.render('campgrounds/show', { campground });                                  // Render the details page
}));

// Form to edit an existing campground
app.get('/campgrounds/:id/edit', catchAsync(async (req, res) => {
    const campground = await Campground.findById(req.params.id); // Find campground by ID
    res.render('campgrounds/edit', { campground });              // Render form to edit the campground
}));

// Route to update a specific campground
app.put('/campgrounds/:id', validateCampground, catchAsync(async (req, res) => {
    const { id } = req.params;                                   // Extract the ID from the request parameters
    const campground = await Campground.findByIdAndUpdate(id, { ...req.body.campground }); // Update campground details
    res.redirect(`/campgrounds/${campground._id}`);             // Redirect to the updated campground's details page
}));

// Route to delete a specific campground
app.delete('/campgrounds/:id', catchAsync(async (req, res) => {
    const { id } = req.params;                                   // Extract the ID from the request parameters
    await Campground.findByIdAndDelete(id);                      // Delete the campground from the database
    res.redirect('/campgrounds');                                // Redirect to the campgrounds index page
}));

// Route to create a new review for a campground
app.post('/campgrounds/:id/reviews', validateReview, catchAsync(async (req, res) => {
    const campground = await Campground.findById(req.params.id); // Find the campground by ID
    const review = new Review(req.body.review);                  // Create a new review using form data
    campground.reviews.push(review);                             // Add the review to the campground's reviews array
    await review.save();                                         // Save the review to the database
    await campground.save();                                     // Save the updated campground
    res.redirect(`/campgrounds/${campground._id}`);              // Redirect to the campground's details page
}));

// Route to delete a specific review for a campground
app.delete('/campgrounds/:id/reviews/:reviewId', catchAsync(async (req, res) => {
    const { id, reviewId } = req.params;                         // Extract IDs from request parameters
    await Campground.findByIdAndUpdate(id, { $pull: { reviews: reviewId } }); // Remove the review from the campground
    await Review.findByIdAndDelete(reviewId);                    // Delete the review from the database
    res.redirect(`/campgrounds/${id}`);                          // Redirect to the campground's details page
}));

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
