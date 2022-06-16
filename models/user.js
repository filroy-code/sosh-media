const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const UserSchema = new Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  avatar: { type: String },
  posts: [{ type: Schema.Types.ObjectId, ref: "Post" }],
  following: [{ type: Schema.Types.ObjectId, ref: "User" }],
  followers: [{ type: Schema.Types.ObjectId, ref: "User" }],
});

//Export model
module.exports = mongoose.model("User", UserSchema);
