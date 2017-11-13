'use strict';

var path = process.cwd();
var DBHelper = require(path + '/app/common/db-functions.js');

module.exports = function (app, passport) {

	function isLoggedIn (req, res, next) {
		if (req.isAuthenticated()) {
			req.session.user = req.user;
			return next();
		} else if (req.session.user) {
			return next();
		} else {
			res.redirect('/login');
		}
	}

	app.route('/')
		.get(function (req, res) {
			res.sendFile(path + '/public/index.html');
		});

	app.route('/login')
		.get(function (req, res) {
			res.sendFile(path + '/public/login.html');
		});

	app.route('/logout')
		.get(function (req, res) {
			req.logout();
			req.session.user = false;
			res.redirect('/');
		});
		
	app.route('/new')
		.get(isLoggedIn, function(req, res) {
			res.sendFile(path+'/public/new.html');
		});
		
	app.route('/profile')
		.get(isLoggedIn, function(req, res) {
			res.sendFile(path+'/public/profile.html');
		});
		
	app.route('/view/:bookId')
		.get(function(req, res) {
			req.session.currentBookId = req.params.bookId;
			res.sendFile(path+'/public/view.html');
		});

	app.route('/api/user')
		.get(function (req, res) {
			if (req.user) {
				req.session.user = req.user;
				res.json(req.user);
			}
			else if (req.session.user) {
				res.json(req.session.user);
			}
			else {
				res.json(false);
			}
		}).post(isLoggedIn, function (req, res) {
			var userId;
			if (req.user) {
				userId = req.user._id;
			}
			else if (req.session.user) {
				userId = req.session.user._id;
			}
			else {
				return res.json("Not logged in");
			}
			
			DBHelper.saveUserDetails(userId, req.body, function(err, status) {
				if (err) return res.json(err);
				res.json(true);
			});
		});
		
	
	app.route('/api/books')
		.get(function(req, res){
			DBHelper.getAllBooks(function(err, books) {
				if (err || !books || books.length == 0) {
					return res.json("No books registered yet");
				}
				res.json(books);
			});
		});
		
	app.route('/api/user/books')
		.get(function(req, res){
			if (req.session.user)  {
				DBHelper.getUserBooks(req.session.user._id, function(err, books) {
					if (err || !books || books.length == 0) {
						return res.json("No books registered yet");
					}
					res.json(books);
				});
			}
			else {
				res.json(false);
			}
		});
	
	app.route('/api/book/:bookId')
		.get(function(req, res){
			
			var bookId = req.params.bookId
			if (bookId == "current") {
				bookId = req.session.currentBookId;
			}
			if (bookId) {
				DBHelper.getBook(bookId, function(err, book) {
					if (err) return res.json("Could not find book");
					res.json(book);
				});
			} else {
				res.json(false);
			}
		});
		
	app.route('/api/book')
		.post(isLoggedIn, function(req, res){
			if (req.session.user) {
				DBHelper.saveBook(req.body, req.session.user._id, function(err, book) {
					if (err) return res.send("Could not save book");
					res.json(book);
				});
			}
			else {
				res.json("not logged in");
			}
		});
		
	app.route('/api/trade/request')
		.post(isLoggedIn, function(req, res) {
			if (req.session.user) {
				var bookId = req.body.bookId;
				var userId = req.session.user._id;
				DBHelper.saveTradeRequest(userId, bookId, function(err, request) {
					if (err) return res.send("Could not save trade request");
					res.json(request);
				});
			}
			else {
				res.json("not logged in");
			}
		});
		
	app.route('/api/trade/accept')
		.post(isLoggedIn, function(req, res) {
			if (req.session.user) {
				var bookId = req.body.bookId;
				var requesterId = req.body.requesterId;
				DBHelper.saveTradeRequest(req.session.user._id, requesterId, bookId, function(err, request) {
					if (err) return res.send("Could accept trade request");
					res.json(request);
				});
			}
			else {
				res.json("not logged in");
			}
		});
		
	app.route('/api/trade/requests')
		.get(isLoggedIn, function(req, res) {
			if (req.session.user) {
				DBHelper.getTradeRequestsByUser(req.session.user._id, function(err, userRequests) {
					if (err) return res.send("Could not find requests by user");
					DBHelper.getTradeRequestsForUser(req.session.user._id, function(err, bookRequests) {
						if (err) return res.send("Could find requests for user books");
						var data = {
							'userRequests': userRequests,
							'bookRequests': bookRequests
						}
						res.json(data);
					});
				});
			}
			else {
				res.json("not logged in");
			}
		});
		
	app.route('/api/user/recommendation')
		.get(isLoggedIn, function(req, res) {
			if (req.session.user) {
				DBHelper.getRecommendationsForUser(req.session.user._id, function(err, recommendations) {
					if (err) return res.send("Could not find recommendations for user");
					res.json(recommendations);
				});
			}
			else {
				res.json("not logged in");
			}
		}).post(isLoggedIn, function(req, res) {
			if (req.session.user) {
				var bookId = req.body.bookId;
				var targetUserEmail = req.body.email;
				DBHelper.getUserByEmail(targetUserEmail, function(err, targetUser) {
					if (err) return res.json(err);
					DBHelper.saveRecommendation(req.session.user._id, bookId, targetUser._id, function(rerr, recommendation) {
						if (rerr) return res.send("Could not save recommendation");
						res.json(recommendation);
					});
				});
			}
			else {
				res.json("not logged in");
			}
		});;

	app.route('/auth/google')
		.get(passport.authenticate('google', {
			scope: [
				'https://www.googleapis.com/auth/plus.me',
				'https://www.googleapis.com/auth/userinfo.email'
			]
		}));

	app.route('/auth/google/callback')
		.get(passport.authenticate('google', {
			successRedirect: '/profile',
			failureRedirect: '/login'
		}));

};
