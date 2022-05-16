const mongoose = require('mongoose')
const Schema = mongoose.Schema;

const UserSchema = new Schema({
    username: { type: String, required: true },
    password: { type: String, required: true },
    posts: {type: Schema.Types.ObjectId, ref: 'Post'},
    vibes: {type: Schema.Types.ObjectId, ref: 'Tag'}
})

  //Export model
module.exports = mongoose.model('User', UserSchema);
