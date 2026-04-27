const mongoose = require('mongoose');

const commentSchema = mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User'
  },
  text: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  }
}, { timestamps: true });

const postSchema = mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User'
    },
    title: {
      type: String,
      required: true
    },
    content: {
      type: String,
      required: true
    },
    likes: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User'
        }
      }
    ],
    comments: [commentSchema]
  },
  {
    timestamps: true
  }
);

postSchema.index({ title: 'text', content: 'text' });

const Post = mongoose.model('Post', postSchema);
module.exports = Post;
