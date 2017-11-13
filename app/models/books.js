'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var Book = new Schema({
	user_id: Schema.Types.ObjectId,
	title: String,
	author: String,
	genre: String,
	year: String,
	description: String,
	image_url: String,
	added_date: Date
});

module.exports = mongoose.model('Book', Book);
