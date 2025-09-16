const express = require('express');
const router = express.Router();
const { isLoggedIn, storeReturnTo, isCampAuthor, validateCampground } = require('../middleware');
const campgrounds = require('../controllers/campgroundsController');
const multer = require('multer');
const { storage } = require('../cloudinary');
const upload = multer({ storage });


// Show all campgrounds
router.get('/', campgrounds.index);

// New campground form
router.get('/new', isLoggedIn, storeReturnTo, campgrounds.renderNewForm);

// Create campground
router.post('/', isLoggedIn, upload.array('image'),validateCampground, campgrounds.createCampground);

// Show single campground
router.get('/:id', campgrounds.showCampground);

// Edit campground form
router.get('/:id/edit', isLoggedIn, isCampAuthor, storeReturnTo, campgrounds.renderEditForm);

// Update campground
router.put('/:id', isLoggedIn, isCampAuthor,upload.array('image'), validateCampground, campgrounds.updateCampground);

// Delete campground
router.delete('/:id', isLoggedIn, isCampAuthor, campgrounds.deleteCampground);

module.exports = router;
