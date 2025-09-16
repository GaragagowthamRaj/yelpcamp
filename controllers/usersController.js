const User = require('../models/user');
const CatchAsync = require('../utils/CatchAsync');

// Render register form
module.exports.renderRegister = (req, res) => {
    res.render('user/register');
};

// Handle registration
module.exports.register = CatchAsync(async (req, res, next) => {
    const { username, email, password } = req.body;
    const user = new User({ username, email });
    const registeredUser = await User.register(user, password);
    req.login(registeredUser, err => {
        if (err) return next(err);
        req.flash('success', 'Welcome to YelpCamp!');
        res.redirect('/campgrounds');
    });
});

// Render login form
module.exports.renderLogin = (req, res) => {
    res.render('user/login');
};

// Handle login
module.exports.login = (req, res) => {
    req.flash('success', 'Welcome back!');
    const redirectUrl = res.locals.returnTo || '/campgrounds';
    delete req.session.returnTo;
    res.redirect(redirectUrl);
};

// Logout
module.exports.logout = (req, res, next) => {
    req.logout(err => {
        if (err) return next(err);
        req.flash('success', 'Goodbye!');
        res.redirect('/campgrounds');
    });
};
