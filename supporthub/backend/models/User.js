//
// Mongoose model for Users in SupportHub
//
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// User roles: 'user', 'agent'
const UserSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: false, maxlength: 32 },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['user', 'agent'], required: true }
});

// PUBLIC_INTERFACE
UserSchema.methods.validatePassword = async function(password) {
  return await bcrypt.compare(password, this.passwordHash);
};

module.exports = mongoose.model('User', UserSchema);
