var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var TagSchema = new Schema(
  {
    post: { type: Schema.Types.ObjectId, ref: 'Post' }, //reference to the associated post
    name: {type: String, required: true, minlength: 3, maxlength: 30},
  }
);

// Virtual for tag's URL
// TagSchema
// .virtual('url')
// .get(function () {
//   return '/catalog/genre/' + this._id;
// });

//Export model
module.exports = mongoose.model('Tag', TagSchema);