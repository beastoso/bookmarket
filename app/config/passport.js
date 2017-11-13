'use strict';

var GoogleStrategy = require('passport-google-oauth2').Strategy;
var User = require('../models/users');
var configAuth = require('./auth');

module.exports = function (passport) {
	passport.serializeUser(function (user, done) {
		done(null, user.id);
	});

	passport.deserializeUser(function (id, done) {
		User.findById(id, function (err, user) {
			done(err, user);
		});
	});
	


	passport.use(new GoogleStrategy(
		{
			clientID: configAuth.googleAuth.clientID,
			clientSecret: configAuth.googleAuth.clientSecret,
			callbackURL: configAuth.googleAuth.callbackURL,
    	    passReqToCallback   : true
			},
		function(request, accessToken, refreshToken, profile, done) {
			process.nextTick(function () {
				User.findOne({ 'provider_id': profile.id }, function (err, user) {
					if (err) {
						return done(err);
					}
	
					if (user) {
						return done(null, user);
					} else {
						var userData = {
								provider_id: profile.id,
								name: profile.name.givenName,
								email: profile.email
						};
	
						var newUser = new User(userData);
						
						newUser.save(function (err) {
							if (err) {
								throw err;
							}
	
							return done(null, newUser);
						});
					}
				});
			});
		}
	));
};
