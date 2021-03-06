// load all the things we need
var LocalStrategy = require('passport-local').Strategy;

// expose this function to our app using module.exports
module.exports = function(passport, User) {

  // =========================================================================
  // passport session setup ==================================================
  // =========================================================================
  // required for persistent login sessions
  // passport needs ability to serialize and unserialize users out of session

  // used to serialize the user for the session
  passport.serializeUser(function(user, done) {
    var sessionUser = { 
      id: user._id,
      email: user.email,
      username: user.username
    };
    done(null, sessionUser);
  });

  // used to deserialize the user
  passport.deserializeUser(function(sessionUser, done) {
    // User.findById(id, function(err, user) {
    //   done(err, user);
    // });
    done(null, sessionUser);
  });

 	// =========================================================================
  // LOCAL SIGNUP ============================================================
  // =========================================================================
  // we are using named strategies since we have one for login and one for signup
	// by default, if there was no name, it would just be called 'local'

  passport.use('local-signup', new LocalStrategy({
    // by default, local strategy uses username and password, we will override with email
    usernameField : 'username',
    passwordField : 'password',
    passReqToCallback : true // allows us to pass back the entire request to the callback
  },
  function(req, username, password, done) {
    // asynchronous
    // User.findOne wont fire unless data is sent back
    process.nextTick(function() {
      var username_taken = false;
      var email_taken = false;

      // check for user with username already being used
      User.findOne({ 'username' : username }, function(err, user) {
        if(user) {
          username_taken = true;
        }
      });

      User.findOne({ 'email' : req.body.email }, function(err, user) {
        if(user) {
          email_taken = true;
        }
      });

      if(!username_taken && !email_taken) {
        // if there is no user with that email
        // create the user
        var newUser = new User();

        // set the user's local credentials
        newUser.username = username;
        newUser.email = req.body.email;
        newUser.password = newUser.generateHash(password);

        // save the user
        newUser.save(function(err) {
          if (err)
            throw err;
          return done(null, newUser);
        });
      }

    });

  }));


  // =========================================================================
  // LOCAL LOGIN =============================================================
  // =========================================================================
	// we are using named strategies since we have one for login and one for signup
	// by default, if there was no name, it would just be called 'local'
  passport.use('local-login', new LocalStrategy({
    // by default, local strategy uses username and password, we will override with email
    usernameField : 'username',
    passwordField : 'password',
    passReqToCallback : true // allows us to pass back the entire request to the callback
  },
  function(req, username, password, done) { // callback with username and password from our form
  	// find a user whose username is the same as the forms username
  	// we are checking to see if the user trying to login already exists
    User.findOne({ 'username' :  username }, function(err, user) {
      // if there are any errors, return the error before anything else
      if (err)
        return done(err);

      // if no user is found, return the message
      if (!user)
        return done(null, false, req.flash('loginMessage', 'No user found.')); // req.flash is the way to set flashdata using connect-flash

    	// if the user is found but the password is wrong
      if (!user.validPassword(password))
        return done(null, false, req.flash('loginMessage', 'Oops! Wrong password.')); // create the loginMessage and save it to session as flashdata

      // all is well, return successful user
      return done(null, user);
    });

  }));
};
