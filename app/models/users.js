'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var User = new Schema({
		provider_id: String,
		name: String,
      email: String,
      display_name: String,
      full_name: String,
      city: String,
      state: String,
      country: String
});

module.exports = mongoose.model('User', User);
