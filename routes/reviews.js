const express = require('express');                                  // Web framework for Node.js
const router = express.Router({mergeParams: true});
const Campground = require('../models/campground');                   // Mongoose model for campgrounds
const Review = require('../models/review.js');                        // Mongoose model for reviews
const { reviewSchema } = require('../schemas.js');                     // Validation schemas for reviews
const ExpressError = require('../utils/ExpressError');                // Custom error handling class
const catchAsync = require('../utils/catchAsync');                   // Utility to catch async errors in routes


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

// Route to create a new review for a campground
router.post('/', validateReview, catchAsync(async (req, res) => {
    const campground = await Campground.findById(req.params.id); // Find the campground by ID
    const review = new Review(req.body.review);                  // Create a new review using form data
    campground.reviews.push(review);                             // Add the review to the campground's reviews array
    await review.save();                                         // Save the review to the database
    await campground.save();                                     // Save the updated campground
    req.flash('success', 'New review added!');                   // Message showing when a review is added
    res.redirect(`/campgrounds/${campground._id}`);              // Redirect to the campground's details page
}));

// Route to delete a specific review for a campground
router.delete('/:reviewId', catchAsync(async (req, res) => {
    const { id, reviewId } = req.params;                         // Extract IDs from request parameters
    await Campground.findByIdAndUpdate(id, { $pull: { reviews: reviewId } }); // Remove the review from the campground
    await Review.findByIdAndDelete(reviewId);                    // Delete the review from the database
    res.redirect(`/campgrounds/${id}`);                          // Redirect to the campground's details page
}));

module.exports = router;