const express = require('express');
const router = express.Router();
const passport = require('passport');
const { storeReturnTo } = require('../middleware');
const users = require('../controllers/usersController');

// Register routes
router.get('/register', users.renderRegister);
router.post('/register', users.register);

// Login routes
router.get('/login', users.renderLogin);
router.post(
    '/login',
    storeReturnTo,
    passport.authenticate('local', { failureFlash: true, failureRedirect: '/login' }),
    users.login
);

// Logout route
router.get('/logout', users.logout);

module.exports = router;
