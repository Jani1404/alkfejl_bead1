var express = require('express');
var bodyParser = require('body-parser');
var expressValidator = require('express-validator');
var session = require('express-session');
var flash = require('connect-flash');
var Waterline = require('waterline');
var waterlineConfig = require('./config/waterline');
var recipeCollection = require('./models/recipe');
var userCollection = require('./models/user');
var startRouter = require('./controllers/start');
var recipeRouter = require('./controllers/recipes');
var loginRouter = require('./controllers/login');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var hbs = require('hbs');
var blocks = {};

hbs.registerHelper('extend', function(name, context) {
    var block = blocks[name];
    if (!block) {
        block = blocks[name] = [];
    }

    block.push(context.fn(this));
});

hbs.registerHelper('block', function(name) {
    var val = (blocks[name] || []).join('\n');

    blocks[name] = [];
    return val;
});

passport.serializeUser(function(user, done) {
    done(null, user);
});
passport.deserializeUser(function(obj, done) {
    done(null, obj);
});

// Local Strategy for sign-up
passport.use('local-signup', new LocalStrategy({
        usernameField: 'felhasznev',
        passwordField: 'jelszo',
        passReqToCallback: true,
    },   
    function(req, felhasznev, jelszo, done) {
        req.app.models.user.findOne({ felhasznev: felhasznev }, function(err, user) {
            if (err) { return done(err); }
            if (user) {
                return done(null, false, { message: 'Ez egy létező felhasználónév.' });
            }
            req.app.models.user.create(req.body)
            .then(function (user) {
                return done(null, user);
            })
            .catch(function (err) {
                return done(null, false, { message: err.details });
            })
        });
    }
));

passport.use('local', new LocalStrategy({
        usernameField: 'felhasznev',
        passwordField: 'jelszo',
        passReqToCallback: true,
    },
    function(req, felhasznev, jelszo, done) {
        req.app.models.user.findOne({ felhasznev: felhasznev }, function(err, user) {
            if (err) { return done(err); }
            if (!user || !user.validPassword(jelszo)) {
                return done(null, false, { message: 'Helytelen adatok.' });
            }
            return done(null, user);
        });
    }
));

function setLocalsForLayout() {
    return function (req, res, next) {
        res.locals.loggedIn = req.isAuthenticated();
        res.locals.user = req.user;
        next();
    }
}

function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) { return next(); }
    res.redirect('/login');
}

function andRestrictTo(role) {
    return function(req, res, next) {
        if (req.user.role == role) {
            next();
        } else {
            next(new Error('Unauthorized'));
        }
    }
}

var app = express();
app.set('views', './views');
app.set('view engine', 'hbs');

//middleware
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(expressValidator());
app.use(session({
    cookie: { maxAge: 6000000 },
    secret: 'titkos szöveg',
    resave: false,
    saveUninitialized: false,
}));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());
app.use(setLocalsForLayout());

//endpoint
app.use('/', startRouter);
app.use('/recipes', ensureAuthenticated, recipeRouter);
app.use('/login', loginRouter);

app.get('/logout', function(req, res) {
    req.logout();
    res.redirect('/');
})

app.get('/delete/:id', function (req, res) {
    req.app.models.recipe.destroy({ id: req.params.id })
    .then(function () {
        req.flash('success', 'Recept törölve');
        res.redirect('/recipes/list'); 
    })
    .catch(function () {
        req.flash('error', 'Recept törlése sikertelen');
        res.redirect('/recipes/list');
    })
})

// ORM példány
var orm = new Waterline();
orm.loadCollection(Waterline.Collection.extend(recipeCollection));
orm.loadCollection(Waterline.Collection.extend(userCollection));

// ORM indítása
orm.initialize(waterlineConfig, function(err, models) {
    if(err) throw err;
    app.models = models.collections;
    app.connections = models.connections;
    
    // Szerver indítása
    var port = process.env.PORT || 3000;
    app.listen(port, function () {
        console.log('A szerver elindult.');
    });
    console.log('ORM elindult.');
});