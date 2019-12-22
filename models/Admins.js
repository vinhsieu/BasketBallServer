const mongoose = require('mongoose');

var AdminSchema = mongoose.Schema({
	name: {  type: String },
	email: {  type: String, required: true, unique: true },
	password: 'String',
	active: {  type: Boolean, default: true },
	createdAt: { type: Date, default: Date.now }
});

AdminSchema.statics.findByEmail = function findByEmail(email,password, callback) {
  this.findOne({ email: email,password:password }, callback);
}


var Admins = mongoose.model('Admins', AdminSchema);

module.exports = Admins;