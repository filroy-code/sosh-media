const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const UserSchema = new Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  // avatar: {type: Schema.Types.ObjectId, ref: "Image" },
  posts: [{ type: Schema.Types.ObjectId, ref: "Post" }],
  connections: [{ type: Schema.Types.ObjectId, ref: "User" }],
});

//Export model
module.exports = mongoose.model("User", UserSchema);
