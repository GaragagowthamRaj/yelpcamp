// ----------------- Environment -----------------
if (process.env.NODE_ENV !== "production") {
    require('dotenv').config();
}

// ----------------- Imports -----------------
const express = require('express');
const path = require('path');
const mongoose = require("mongoose");
const methodOverride = require('method-override');
const ejsMate = require('ejs-mate');
const session = require("express-session");
const MongoStore = require('connect-mongo');
const flash = require("connect-flash");
const passport = require('passport');
const LocalStrategy = require("passport-local").Strategy;
const helmet = require('helmet');

const ExpressError = require('./utils/ExpressError');
const User = require("./models/user");
const sanitizeV5 = require('./utils/mongoSanitizeV5'); // sanitize middleware

// ----------------- Routers -----------------
const userRoutes = require('./router/users');
const campgroundRoutes = require('./router/campgrounds');
const reviewRoutes = require('./router/reviews');

// ----------------- App Setup -----------------
const app = express();

app.engine('ejs', ejsMate);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname,'public')));

// ----------------- DB Connection -----------------
const dbUrl = process.env.DB_URL || 'mongodb://127.0.0.1:27017/yelp-camp';

mongoose.connect(dbUrl, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log("MongoDB Connected"))
.catch(err => console.error("MongoDB Connection Error:", err));

// ----------------- Data Sanitization -----------------
app.use(sanitizeV5({ replaceWith: '_' }));

// ----------------- Session & Flash -----------------
const store = MongoStore.create({
    mongoUrl: dbUrl,
    touchAfter: 24 * 60 * 60,
    crypto: { secret: process.env.SESSION_SECRET || "thisshouldbeabettersecret" }
});

store.on("error", (e) => {
    console.log("SESSION STORE ERROR", e);
});

const sessionConfig = {
    store,
    name: 'session',
    secret: process.env.SESSION_SECRET || "thisshouldbeabettersecret",
    resave: false,
    saveUninitialized: true,
    cookie: {
        httpOnly: true,
        maxAge: 1000 * 60 * 60 * 24, // 1 day
        expires: new Date(Date.now() + 1000 * 60 * 60 * 24)
    }
};

app.use(session(sessionConfig));
app.use(flash());
app.use(helmet());

// ----------------- Content Security Policy -----------------
const scriptSrcUrls = [
    "https://stackpath.bootstrapcdn.com/",
    "https://kit.fontawesome.com/",
    "https://cdnjs.cloudflare.com/",
    "https://cdn.jsdelivr.net",
    "https://cdn.maptiler.com/", 
];
const styleSrcUrls = [
    "https://kit-free.fontawesome.com/",
    "https://stackpath.bootstrapcdn.com/",
    "https://fonts.googleapis.com/",
    "https://use.fontawesome.com/",
    "https://cdn.jsdelivr.net",
    "https://cdn.maptiler.com/", 
];
const connectSrcUrls = [
    "https://api.maptiler.com/",
];
const fontSrcUrls = [];

app.use(
    helmet.contentSecurityPolicy({
        directives: {
            defaultSrc: [],
            connectSrc: ["'self'", ...connectSrcUrls],
            scriptSrc: ["'unsafe-inline'", "'self'", ...scriptSrcUrls],
            styleSrc: ["'self'", "'unsafe-inline'", ...styleSrcUrls],
            workerSrc: ["'self'", "blob:"],
            objectSrc: [],
            imgSrc: [
                "'self'",
                "blob:",
                "data:",
                "https://res.cloudinary.com/dtur0szub/",
                "https://images.unsplash.com/",
                "https://api.maptiler.com/",
            ],
            fontSrc: ["'self'", ...fontSrcUrls],
        },
    })
);

// ----------------- Passport -----------------
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// ----------------- Flash Middleware -----------------
app.use((req, res, next) => { 
    res.locals.currentUser = req.user;
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    next();
});

// ----------------- Routers -----------------
app.use('/', userRoutes);  
app.use('/campgrounds', campgroundRoutes);
app.use('/campgrounds/:id/reviews', reviewRoutes);

// ----------------- Home -----------------
app.get('/', (req, res) => {
    res.render('home');
});

// ----------------- 404 Handler -----------------
app.all(/.*/, (req, res, next) => {
    next(new ExpressError('Page Not Found', 404));
});

// ----------------- Error Handler -----------------
app.use((err, req, res, next) => {
    const { statusCode = 500 } = err;
    if (!err.message) err.message = 'Something went wrong!';
    res.status(statusCode).render('error', { err });
});

// ----------------- Server -----------------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Serving on port ${PORT}`));
