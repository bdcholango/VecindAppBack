const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  profilePicture: { type: String },
  pushToken: { type: String, default: null },
});

module.exports = mongoose.model("User", userSchema);
