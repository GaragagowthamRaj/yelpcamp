const { cloudinary } = require('../cloudinary');
const Campground = require('../models/campground');
const CatchAsync = require('../utils/CatchAsync');
const maptilerClient = require("@maptiler/client");
maptilerClient.config.apiKey = process.env.MAPTILER_API_KEY;

// Show all campgrounds
module.exports.index = CatchAsync(async (req, res) => {
    const campgrounds = await Campground.find({});
    res.render('campgrounds/index', { campgrounds });
});

// Render new campground form
module.exports.renderNewForm = (req, res) => {
    res.render('campgrounds/new');
};

// Create new campground
module.exports.createCampground = CatchAsync(async (req, res) => {
    // Geocode the location
    const geoData = await maptilerClient.geocoding.forward(req.body.campground.location, { limit: 1 });

    // Create the campground
    const campground = new Campground(req.body.campground);

    // Assign geometry, images, and author
    if (geoData.features.length) {
        campground.geometry = geoData.features[0].geometry;
    }
    campground.images = req.files.map(f => ({ url: f.path, filename: f.filename }));
    campground.author = req.user._id;

    await campground.save();
    console.log(campground);

    req.flash("success", "Successfully created a new campground!");
    res.redirect(`/campgrounds/${campground._id}`);
});


// Show single campground
module.exports.showCampground = CatchAsync(async (req, res) => {
    const campground = await Campground.findById(req.params.id)
        .populate({
            path: 'reviews',
            populate: { path: 'author', model: 'User' }
        })
        .populate('author');

    if (!campground) {
        req.flash("error", "Campground not found!");
        return res.redirect('/campgrounds');
    }
    res.render('campgrounds/show', { campground });
});

// Render edit form
module.exports.renderEditForm = CatchAsync(async (req, res) => {
    const { id } = req.params;
    const campground = await Campground.findById(id);
    if (!campground) {
        req.flash("error", "Campground not found!");
        return res.redirect('/campgrounds');
    }
    res.render('campgrounds/edit', { campground });
});

// Update campground
module.exports.updateCampground = CatchAsync(async (req, res) => {
    const { id } = req.params;
    console.log(req.body);

    // Fetch campground first
    const campground = await Campground.findByIdAndUpdate(
    id,
    { ...req.body.campground },
    { new: true, runValidators: true }
);


    // Update geometry
    const geoData = await maptilerClient.geocoding.forward(req.body.campground.location, { limit: 1 });
    campground.geometry = geoData.features[0].geometry;

    // Add new images
    const imgs = req.files.map(f => ({ url: f.path, filename: f.filename }));
    campground.images.push(...imgs);

    // Delete selected images
    if (req.body.deleteImages) {
        for (let filename of req.body.deleteImages) {
            await cloudinary.uploader.destroy(filename);
        }
        await campground.updateOne({ $pull: { images: { filename: { $in: req.body.deleteImages } } } });
    }

    await campground.save();
    console.log(campground);

    req.flash("success", "Successfully updated campground!");
    res.redirect(`/campgrounds/${campground._id}`);
});


// Delete campground
module.exports.deleteCampground = CatchAsync(async (req, res) => {
    const { id } = req.params;
    await Campground.findByIdAndDelete(id);
    req.flash("success", "Successfully deleted campground!");
    res.redirect('/campgrounds');
});
