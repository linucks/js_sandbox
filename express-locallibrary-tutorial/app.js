var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var catalogRouter = require('./routes/catalog');

// Authentication
// https://github.com/Createdd/authenticationIntro
// https://github.com/passport/express-4.x-local-example
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var session = require('express-session');
var MongoDBStore = require('connect-mongodb-session')(session);
// const uuid = require('uuid/v4');
const User = require('./models/user');

var app = express();

//Set up mongoose connection
var mongoose = require('mongoose');
//var mongoDB = 'mongodb://express:1h2h3j4k5@ds026558.mlab.com:26558/jens_test';
var mongoDB = 'mongodb://jens:jens@localhost:27017/jens_test';
mongoose.connect(mongoDB);
mongoose.Promise = global.Promise;
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));


// add & configure middleware
app.use(session({
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: true,
  store: new MongoDBStore({
    uri: 'mongodb://jens:jens@localhost:27017/jens_test',
    collection: 'mySessions'
  })
}))

// The local strategy require a `verify` function which receives the credentials
// (`username` and `password`) submitted by the user.  The function must verify
// that the password is correct and then invoke `cb` with a user object, which
// will be set at `req.user` in route handlers after authentication.
passport.use(new LocalStrategy(
  { usernameField: 'email' },
  function(email, password, done) {
    User.findOne({ email: email }, function(err, user) {
      if (err) { return done(err); }
      if (!user) {
        return done(null, false, { message: 'Incorrect username.' });
      }
      if (!user.validPassword(password)) {
        return done(null, false, { message: 'Incorrect password.' });
      }
      return done(null, user);
    });
  }
));

// In order to restore authentication state across HTTP requests, Passport needs
// to serialize users into and deserialize users out of the session.  The
// typical implementation of this is as simple as supplying the user ID when
// serializing, and querying the user record by ID from the database when
passport.serializeUser((user, cb) => {
  console.log('Inside serializeUser callback. User id is save to the session file store here')
  cb(null, user.email);
});

passport.deserializeUser((email, cb) => {
  console.log(`Inside deserializeUser callback\nThe user email passport saved in the session file store is: ${email}`)
  User.findOne({email: email}, function (err, user) {
    if (err) { return cb(err); }
    cb(null, user);
  });
});


// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Initialize Passport and restore authentication state, if any, from the session.
app.use(passport.initialize());
app.use(passport.session());

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/catalog', catalogRouter);


// create the login get and post routes
app.get('/login', (req, res) => {
  console.log('Inside GET /login callback function')
  console.log(req.sessionID)
  res.send('You got the login page!')
})


// For testing
// curl -X POST http://localhost:3000/login -c cookie-file.txt -H 'Content-Type: application/json' -d '{"email":"test@test.com", "password":"password"}'
// curl -X GET http://localhost:3000/authrequired -b cookie-file.txt
// This is the short version of logging in - not sure how to propogate errors to the user.
// app.post('/login', passport.authenticate('local', { failureRedirect: '/foobar' }),
//     function(req, res, next){
//       console.log("login authenticate passed");
//       res.send('Managed to login');
//     });
app.post('/login', (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
    console.log(`passport.authenticate local callback: ${err}:${user}:${info}`);
    if(info) {
      console.log(`passport.authenticate info: ${JSON.stringify(info)}`)
      return res.send(info.message);
    }
    if (err) {
      console.log(`passport.authenticate err: ${err}`)
      return next(err);
    }
    if (!user) {
      console.log("/login no user");
      return res.redirect('/login');
    }
    req.login(user, (err) => {
      if (err) {
        console.log("/login got err");
        return next(err);
      }
      console.log("/login redirect /authrequired");
      return res.redirect('/authrequired');
    })
  })(req, res, next); // This actually calls the middleware function
})

app.get('/authrequired', (req, res) => {
  if(req.isAuthenticated()) {
    res.send('you hit the authentication endpoint\n')
  } else {
    console.log('Authentication Endpoint Failed!');
    res.redirect('/')
  }
})

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  // res.locals.error = req.app.get('env') === 'development' ? err : {};
  res.locals.error = err;

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
