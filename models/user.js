const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const UserSchema = new Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  posts: [{ type: Schema.Types.ObjectId, ref: "Post" }],
  connections: [{ type: Schema.Types.ObjectId, ref: "User" }],
  // isPrivate: {type: Boolean, required: true}
});

//Export model
module.exports = mongoose.model("User", UserSchema);
