const Post = require('../models/Post');

// @desc    Get all community posts (with search, sort, pagination)
// @route   GET /api/community/posts
// @access  Public
const getPosts = async (req, res, next) => {
  try {
    const { q, sortBy, page = 1, limit = 10 } = req.query;
    let query = {};

    if (q) {
      query.$text = { $search: q };
    }

    let sortObj = { createdAt: -1 };
    if (sortBy === 'popular') {
      sortObj = { likesCount: -1, createdAt: -1 }; // Mongoose would need an aggregation or schema modification to sort by array length easily, so let's stick to returning data and maybe sorting loosely or we track a count. For simple backward compatibility:
      // A better approach is to sort in JS if dataset aligns or add a likesCount field. 
    }

    const skip = (page - 1) * limit;

    let posts = await Post.find(query)
      .populate('author', 'name email')
      .populate('comments.user', 'name')
      .sort(sortObj)
      .skip(Number(skip))
      .limit(Number(limit));

    // Simple JS sort for popular if needed
    if (sortBy === 'popular') {
      posts = posts.sort((a, b) => b.likes.length - a.likes.length);
    }

    const total = await Post.countDocuments(query);

    res.status(200).json({ 
      success: true, 
      count: posts.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: Number(page),
      data: posts 
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a post
// @route   POST /api/community/post
// @access  Private
const createPost = async (req, res, next) => {
  try {
    const { title, content } = req.body;

    if (!title || !content) {
      res.status(400);
      throw new Error('Please add a title and content to your post');
    }

    const post = await Post.create({
      title,
      content,
      author: req.user.id
    });

    res.status(201).json({ success: true, data: post });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle Like on Post
// @route   PUT /api/community/post/:id/like
// @access  Private
const toggleLike = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      res.status(404);
      throw new Error('Post not found');
    }

    const likeIndex = post.likes.findIndex(
      (like) => like.user.toString() === req.user.id
    );

    if (likeIndex !== -1) {
      post.likes.splice(likeIndex, 1);
    } else {
      post.likes.push({ user: req.user.id });
    }

    await post.save();
    res.status(200).json({ success: true, data: post.likes });
  } catch (error) {
    next(error);
  }
};

// @desc    Add Comment to Post
// @route   POST /api/community/post/:id/comment
// @access  Private
const addComment = async (req, res, next) => {
  try {
    const { text } = req.body;
    if (!text) {
      res.status(400);
      throw new Error('Please add a comment text');
    }

    const post = await Post.findById(req.params.id);
    if (!post) {
      res.status(404);
      throw new Error('Post not found');
    }

    const newComment = {
      user: req.user.id,
      text,
      name: req.user.name
    };

    post.comments.push(newComment);
    await post.save();

    res.status(201).json({ success: true, data: post.comments });
  } catch (error) {
    next(error);
  }
};

module.exports = { getPosts, createPost, toggleLike, addComment };
