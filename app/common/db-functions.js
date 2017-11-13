"use strict"

var mongo = require("mongodb");
var Book = require("../models/books");
var BookOwner = require("../models/bookowners");
var User = require("../models/users");
var Trade = require("../models/trades");
var Recommendation = require("../models/recommendations");

var self = module.exports = {
    saveUserDetails: function(userId, details, callback) {
        var userInfo = {
          'display_name': details.displayName,
          'full_name': details.fullName,
          'city': details.city,
          'state': details.state,
          'country': details.country
        };
        User.update(
            { _id: new mongo.ObjectId(userId)},
            userInfo,
            function(err, user) {
                if (err) return callback(err);
                callback(null, true);
            }
        );
    },
    getUserByEmail: function(userEmail, callback) {
      User.findOne({email : userEmail}, function(err, user) {
        if (err) return callback(err);
        if (user && user._id) {
            callback(null, user);
        }
        else {
            callback("User not found by email");
        }
      });
    },
    saveBook: function(bookInfo, userId, callback) {
        
        var bookModel = {
            'user_id': new mongo.ObjectId(userId),
            'author': bookInfo.author,
            'title': bookInfo.title,
            'genre': bookInfo.genre,
            'description': bookInfo.description,
            'year': bookInfo.year,
            'image_url': bookInfo.imageUrl,
            'added_date': new Date()
        };
        
        new Book(bookModel).save(function(error, book){
            if (error) return callback(error, null);
            
            self.saveBookOwner(userId, book._id, function(err, status) {
                if (err) return callback(err);
                
                callback(null, book);
            });
                    
        });
    },
    saveBookOwner: function(userId, bookId, callback) {
        var today = new Date();
        var ownerModel = {
            'user_id': new mongo.ObjectId(userId),
            'book_id': new mongo.ObjectId(bookId),
            'current_owner': true,
            'date': today
        };
        
        BookOwner.update(
            { book_id : new mongo.ObjectId(bookId) },
            { current_owner: false },
            { multi: true },
            function(error, updateCount){
                if (error) return callback(error, null);
                new BookOwner(ownerModel).save(function(error){
                    if (error) return callback(error, null);
                    return callback(null, true);
                });
            }
        );
    },
    getBook: function(bookId, callback) {
      Book.findOne(
           {_id: new mongo.ObjectId(bookId)}, 
           function(err, book) {
               if (err) return callback(err);
               self.getBookHolder(bookId, function(berr, holderId){
                   if (berr) return callback(berr);
                   User.findOne({_id: holderId}, function(uerr, user){
                       if (uerr) return callback(uerr);
                       
                       book = book._doc;
                       book.holderId = user._id;
                       if (user._doc.display_name) {
                           book.holderName = user._doc.display_name;
                       }
                       else {
                           book.holderName = user._doc.name;
                       }
                       callback(null, book);
                   });
               });
            }
       );
    },
    getAllBooks: function(callback) {
      Book.find({ "$query": {}, "$orderby" : { added_date: -1 }}, callback);
    },
    getBookHistory: function(bookId, callback) {
        var matchQuery = {
            'book_id': new mongo.ObjectId(bookId)
        };
        
        BookOwner.find(matchQuery, function(error, results){
            if (error) return callback(error, null);
            var userIds = [];
            results.forEach(function(result) {
                userIds.push(result._id);
            });
            User.find({ _id : { "$in" : userIds } }, function(berr, users) {
                if (berr) return callback(berr, null);
                
                return callback(null, users);
            });
            
        });
    },
    getUserBooks: function(userId, callback) {
        var matchQuery = {
            'user_id': new mongo.ObjectId(userId),
            'current_owner': true
        };
        
        BookOwner.find(matchQuery, function(error, results){
            if (error) return callback(error, null);
            var bookIds = [];
            results.forEach(function(result) {
                bookIds.push(result._doc.book_id);
            });
            Book.find({ _id : { "$in" : bookIds } }, function(berr, books) {
                if (berr) return callback(berr, null);
                
                return callback(null, books);
            });
            
        });
    },
    getTradeRequestsByUser: function(userId, callback) {
        Trade.find(
            { "$query" : {request_user_id: new mongo.ObjectId(userId)},
                "$orderby" : { date: -1 }},
            function(err, requests) {
                if (err) return callback(err);
                var bookIds = [];
                var formattedRequests = [];
                requests.forEach(function(request) {
                   bookIds.push(request._doc.book_id) ;
                });
                if (bookIds.length == 0) {
                    return callback(null, bookIds);
                }
                Book.find({_id : { "$in" : bookIds}}, 
                    function(berr, books) {
                        if (berr) return callback(berr);
                        requests.forEach(function(request) {
                            books.forEach(function(book) {
                                if (request._doc.book_id.equals(book._id)) {
                                    formattedRequests.push({
                                        book_id: book._id,
                                       title: book.title,
                                        author: book.author,
                                        date: request.date
                                    });
                                    return false;
                                }
                            });
                        });
                        callback(null, formattedRequests);
                    });
            }
        );
    },
    getTradeRequestsForUser: function(userId, callback) {
        Trade.find(
            { "$query" : {owner_user_id: new mongo.ObjectId(userId)},
                "$orderby" : { date: -1 }},
            function(err, requests) {
                if (err) return callback(err);
                var bookIds = [];
                var userIds = [];
                requests.forEach(function(request) {
                   bookIds.push(request._doc.book_id);
                   userIds.push(request._doc.request_user_id);
                });
                if (bookIds.length == 0) {
                    return callback(null, bookIds);
                }
                Book.find({_id : { "$in" : bookIds}}, function(berr, books) {
                    if (berr) return callback(berr);
                     var formattedRequests = [];
                    requests.forEach(function(request) {
                        books.forEach(function(book) {
                            if (request.book_id.equals(book._id)) {
                                formattedRequests.push({
                                    title: book.title,
                                    author: book.author,
                                    book_id : book._id,
                                    request_user_id: request.request_user_id,
                                    date: request.date
                                   });
                                return false;
                            }
                        });
                    });
                    
                    User.find({ _id : { "$in" : userIds }}, function(uerr, users) {
                        if (uerr) return callback(uerr);
                        formattedRequests.forEach(function(request) {
                            users.forEach(function(user) {
                                if (request.request_user_id.equals(user._doc._id)) {
                                    if (user._doc.display_name) {
                                        request.requestUserName = user._doc.display_name;
                                    } else {
                                        request.requestUserName = user._doc.name;
                                    }
                                    request.requestUserEmail = user._doc.email;
                                    return false;
                                }
                            });
                        });
                        callback(null, formattedRequests);
                    });
                });
        });
    },
    saveTradeRequest: function(userId, bookId, callback) {
        self.getBookHolder(bookId, function(err, holderId) {
           if (err) return callback(err);
           new Trade({
               request_user_id: new mongo.ObjectId(userId),
               owner_user_id: new mongo.ObjectId(holderId),
               book_id: new mongo.ObjectId(bookId),
               accepted: false,
               date: new Date()
           }).save(function(terr, request) {
              if (terr) return callback(terr);
              callback(null, request);
           });
        });
    },
    acceptTradeRequest: function(userId, requesterId, bookId, callback) {
        Trade.update(
            { 
                request_user_id: new mongo.ObjectId(requesterId),
                owner_user_id: new mongo.ObjectId(userId),
                book_id: new mongo.ObjectId(bookId)
            },
            { accepted: true },
            { upsert: false },
            function(err, status) {
                if (err) return callback(err);
                callback(null, true);
            }
        );
    },
    getBookHolder: function(bookId, callback) {
        BookOwner.findOne(
            {
                book_id: new mongo.ObjectId(bookId), 
                current_owner: true
            }, function(err, owner) {
                if (err) return callback(err);
                callback(null, owner.user_id);
            });
    },
    saveRecommendation: function(userId, bookId, recommendUserId, callback) {
       new Recommendation({
           recommender_user_id: new mongo.ObjectId(userId),
           recommendee_user_id: new mongo.ObjectId(recommendUserId),
           book_id: new mongo.ObjectId(bookId),
           date: new Date()
       }).save(function(terr, status) {
          if (terr) return callback(terr);
          callback(null, true);
       });
    },
    getRecommendationsForUser: function(userId, callback) {
        Recommendation.find(
            { "$query" : {recommendee_user_id: new mongo.ObjectId(userId)}, 
            "$orderby" : { date: -1 }},
            function(err, recommendations) {
                if (err) return callback(err);
                var bookIds = [];
                var userIds = [];
                var formattedRecommendations = [];
                recommendations.forEach(function(request) {
                   bookIds.push(request._doc.book_id);
                   userIds.push(request._doc.recommender_user_id);
                });
                if (bookIds.length == 0) {
                    return callback(null, bookIds);
                }
                Book.find({_id : { "$in" : bookIds}}, function(berr, books) {
                    if (berr) return callback(berr);
                    recommendations.forEach(function(recommendation) {
                        books.forEach(function(book) {
                            if (recommendation._doc.book_id.equals(book._id)) {
                                formattedRecommendations.push({
                                    book_id: book._id,
                                   title: book.title,
                                    author: book.author,
                                    date: recommendation.date,
                                    recommender_user_id: recommendation.recommender_user_id
                                });
                                return false;
                            }
                        });
                    });
                    
                    User.find({ _id : { "$in" : userIds }}, function(uerr, users) {
                        if (uerr) return callback(uerr);
                        formattedRecommendations.forEach(function(recommendation) {
                            users.forEach(function(user) {
                                if (recommendation.recommender_user_id.equals(user._doc._id)) {
                                    if (user._doc.display_name) {
                                        recommendation.userName = user._doc.display_name;
                                    } else {
                                        recommendation.userName = user._doc.name;
                                    }
                                    recommendation.userEmail = user._doc.email;
                                    return false;
                                }
                            });
                        });
                        callback(null, formattedRecommendations);
                    });
                });
        });
    },
}