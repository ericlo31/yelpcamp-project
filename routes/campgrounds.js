const express = require('express');                                  // Web framework for Node.js
const router = express.Router();
const catchAsync = require('../utils/catchAsync');                    // Utility to catch async errors in routes
const { campgroundSchema } = require('../schemas.js');                 // Validation schemas for campground
const ExpressError = require('../utils/ExpressError');                // Custom error handling class
const Campground = require('../models/campground');                   // Mongoose model for campgrounds

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

// Route to display all campgrounds
router.get('/', catchAsync(async (req, res) => {
    const campgrounds = await Campground.find({});
    res.render('campgrounds/index', { campgrounds }) // Render index page with all campgrounds
}));

// Form to create a new campground
router.get('/new', (req, res) => {
    res.render('campgrounds/new'); // Render form for creating a new campground
});

// Route to create a new campground and save it to the database
router.post('/', validateCampground, catchAsync(async (req, res, next) => {
    const campground = new Campground(req.body.campground); // Create a new campground using form data
    await campground.save();                               // Save the campground to the database
    res.redirect(`/campgrounds/${campground._id}`);        // Redirect to the new campground's details page
}));

// Route to display details for a specific campground
router.get('/:id', catchAsync(async (req, res) => {
    const campground = await Campground.findById(req.params.id).populate('reviews'); // Find campground and populate its reviews
    res.render('campgrounds/show', { campground });                                  // Render the details page
}));

// Form to edit an existing campground
router.get('/:id/edit', catchAsync(async (req, res) => {
    const campground = await Campground.findById(req.params.id); // Find campground by ID
    res.render('campgrounds/edit', { campground });              // Render form to edit the campground
}));

// Route to update a specific campground
router.put('/:id', validateCampground, catchAsync(async (req, res) => {
    const { id } = req.params;                                   // Extract the ID from the request parameters
    const campground = await Campground.findByIdAndUpdate(id, { ...req.body.campground }); // Update campground details
    res.redirect(`/campgrounds/${campground._id}`);             // Redirect to the updated campground's details page
}));

// Route to delete a specific campground
router.delete('/:id', catchAsync(async (req, res) => {
    const { id } = req.params;                                   // Extract the ID from the request parameters
    await Campground.findByIdAndDelete(id);                      // Delete the campground from the database
    res.redirect('/campgrounds');                                // Redirect to the campgrounds index page
}));

module.exports = router;