const Campground = require('../models/campground');
const Review = require('../models/review');
const CatchAsync = require('../utils/CatchAsync');

// Create review
module.exports.createReview = CatchAsync(async (req, res) => {
    const campground = await Campground.findById(req.params.id);
    const review = new Review(req.body.review);
    review.author = req.user._id; // attach logged-in user as author
    await review.save();
    campground.reviews.push(review);
    await campground.save();
    req.flash("success", "Successfully added review!");
    res.redirect(`/campgrounds/${campground._id}`);
});

// Delete review
module.exports.deleteReview = CatchAsync(async (req, res) => {
    const { id, reviewId } = req.params;
    await Campground.findByIdAndUpdate(id, { $pull: { reviews: reviewId } });
    await Review.findByIdAndDelete(reviewId);
    req.flash("success", "Successfully deleted review!");
    res.redirect(`/campgrounds/${id}`);
});
