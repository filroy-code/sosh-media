const mongoose = require('mongoose');
const { DateTime } = require('luxon')

const Schema = mongoose.Schema;

const CommentSchema = new Schema(
  {
    targetPost: {type: Schema.Types.ObjectId, ref: 'Post', required: true},
    author: {type: Schema.Types.ObjectId, ref: 'User', required: true},
    date: {type: Date, required: true},
    content: {type: String, required: true, maxlength: 400},
    comments: {type: Schema.Types.ObjectId, ref: 'Comment'},
    stars: {type: Number}
  }
);

// Virtual for post's URL
CommentSchema
.virtual('url')
.get(function () {
  return '/' + this._id;
});

// Virtual for formatted date.
CommentSchema
.virtual('formatted_date')
.get(function () {
  return DateTime.fromJSDate(this.date).toLocaleString(DateTime.DATE_MED);
});


//Export model
module.exports = mongoose.model('Comment', CommentSchema);
