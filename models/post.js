const mongoose = require("mongoose");
const { DateTime } = require("luxon");

const Schema = mongoose.Schema;

const PostSchema = new Schema({
  author: { type: Schema.Types.ObjectId, ref: "User", required: true },
  date: { type: Date, required: true },
  content: { type: String, required: true, maxlength: 600 },
  comments: [{ type: Schema.Types.ObjectId, ref: "Comment" }],
  stars: [{ type: Schema.Types.ObjectId, ref: "User" }],
  edited: { type: Date },
});

// Virtual for post's URL
PostSchema.virtual("url").get(function () {
  return `/${this.author.username}/${this._id}`;
});

// Virtual for formatted date.
PostSchema.virtual("formatted_date").get(function () {
  return (
    DateTime.fromJSDate(this.date).toLocaleString(DateTime.DATE_MED) +
    " at " +
    DateTime.fromJSDate(this.date).toLocaleString(DateTime.TIME_SIMPLE)
  );
});

// Virtual for formatted EDIT date.
PostSchema.virtual("formatted_edit_date").get(function () {
  return (
    DateTime.fromJSDate(this.edited).toLocaleString(DateTime.DATE_MED) +
    " at " +
    DateTime.fromJSDate(this.edited).toLocaleString(DateTime.TIME_SIMPLE)
  );
});

PostSchema.set("toJSON", { virtuals: true });

//Export model
module.exports = mongoose.model("Post", PostSchema);
