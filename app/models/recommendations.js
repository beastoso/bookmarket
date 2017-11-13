'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var Recommendation = new Schema({
	recommender_user_id: Schema.Types.ObjectId,
	recommendee_user_id: Schema.Types.ObjectId,
	book_id: Schema.Types.ObjectId,
	date: Date
});

module.exports = mongoose.model('Recommendation', Recommendation);
