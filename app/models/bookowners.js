'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var BookOwner = new Schema({
	user_id: Schema.Types.ObjectId,
	book_id: Schema.Types.ObjectId,
	current_owner: Boolean,
	date: Date
});

module.exports = mongoose.model('BookOwner', BookOwner);
