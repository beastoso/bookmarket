'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var Trade = new Schema({
	request_user_id: Schema.Types.ObjectId,
	owner_user_id: Schema.Types.ObjectId,
	book_id: Schema.Types.ObjectId,
	accepted: Boolean,
	date: Date
});

module.exports = mongoose.model('Trade', Trade);
