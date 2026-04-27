const Message = require('../models/Message');
const Notification = require('../models/Notification');

// @desc    Send a message from Contact Us form
// @route   POST /api/messages
// @access  Public
const sendMessage = async (req, res, next) => {
  try {
    const { name, email, subject, message } = req.body;

    if (!name || !email || !subject || !message) {
      res.status(400);
      throw new Error('Please fill all fields');
    }

    const newMessage = await Message.create({
      senderId: req.user ? req.user._id : null,
      name,
      email,
      subject,
      message,
    });

    res.status(201).json({ success: true, data: newMessage });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all messages for admin
// @route   GET /api/messages
// @access  Private/Admin
const getMessages = async (req, res, next) => {
  try {
    const messages = await Message.find({}).sort('-createdAt');
    res.status(200).json({ success: true, data: messages });
  } catch (error) {
    next(error);
  }
};

// @desc    Reply to a message
// @route   PUT /api/messages/:id/reply
// @access  Private/Admin
const replyMessage = async (req, res, next) => {
  try {
    const { reply } = req.body;
    if (!reply) {
      res.status(400);
      throw new Error('Please provide a reply');
    }

    const message = await Message.findById(req.params.id);
    if (!message) {
      res.status(404);
      throw new Error('Message not found');
    }

    // Add to replies thread
    message.replies.push({
      senderRole: 'admin',
      text: reply,
      createdAt: Date.now()
    });

    // Update legacy field for backward compatibility
    message.reply = reply;
    message.repliedAt = Date.now();
    message.isRead = true;
    await message.save();

    // Create notification for the user
    if (message.senderId) {
      await Notification.create({
        recipient: message.senderId,
        type: 'MESSAGE_REPLY',
        message: `Admin replied: "${reply.substring(0, 30)}${reply.length > 30 ? '...' : ''}"`,
        link: '/user-dashboard'
      });
    }

    res.status(200).json({ success: true, data: message });
  } catch (error) {
    next(error);
  }
};

// @desc    User replies to an existing thread
// @route   PUT /api/messages/:id/user-reply
// @access  Private
const userReply = async (req, res, next) => {
  try {
    const { message: replyText } = req.body;
    if (!replyText) {
      res.status(400);
      throw new Error('Please provide a message');
    }

    const message = await Message.findById(req.params.id);
    if (!message) {
      res.status(404);
      throw new Error('Message not found');
    }

    // Authorization check
    if (message.senderId?.toString() !== req.user._id.toString()) {
      res.status(401);
      throw new Error('Not authorized to reply to this message');
    }

    message.replies.push({
      senderRole: 'user',
      text: replyText,
      createdAt: Date.now()
    });

    message.isRead = false; // Mark as unread for admin to see the user's new reply
    await message.save();

    res.status(200).json({ success: true, data: message });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark message as read
// @route   PUT /api/messages/:id/read
// @access  Private/Admin
const markAsRead = async (req, res, next) => {
  try {
    const message = await Message.findById(req.params.id);
    if (!message) {
      res.status(404);
      throw new Error('Message not found');
    }

    message.isRead = true;
    await message.save();

    res.status(200).json({ success: true, data: message });
  } catch (error) {
    next(error);
  }
};

// @desc    Get messages for logged in user
// @route   GET /api/messages/my
// @access  Private
const getMyMessages = async (req, res, next) => {
  try {
    const messages = await Message.find({ senderId: req.user._id }).sort('-createdAt');
    res.status(200).json({ success: true, data: messages });
  } catch (error) {
    next(error);
  }
};

// @desc    Admin initiates a new message to a user
// @route   POST /api/messages/admin-init
// @access  Private/Admin
const initMessage = async (req, res, next) => {
  try {
    const { recipientId, subject, message } = req.body;
    if (!recipientId || !subject || !message) {
      res.status(400);
      throw new Error('Please provide recipient, subject and message');
    }

    const newMessage = await Message.create({
      senderId: recipientId,
      name: 'Admin',
      email: 'admin@agritech.co.in',
      subject,
      message: `[DIRECT MESSAGE] ${message}`,
      isRead: true,
      reply: 'Message sent by administrator',
      repliedAt: Date.now()
    });

    await Notification.create({
      recipient: recipientId,
      type: 'NEW_MESSAGE',
      message: `New message from Admin: ${subject}`,
      link: '/user-dashboard'
    });

    res.status(201).json({ success: true, data: newMessage });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a message
// @route   PUT /api/messages/:id
// @access  Private
const updateMessage = async (req, res, next) => {
  try {
    const { message: messageText } = req.body;
    const message = await Message.findById(req.params.id);

    if (!message) {
      res.status(404);
      throw new Error('Message not found');
    }

    // Owner check
    if (message.senderId?.toString() !== req.user._id.toString()) {
      res.status(401);
      throw new Error('Not authorized to update this message');
    }

    message.message = messageText;
    await message.save();

    res.status(200).json({ success: true, data: message });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a message
// @route   DELETE /api/messages/:id
// @access  Private
const deleteMessage = async (req, res, next) => {
  try {
    const message = await Message.findById(req.params.id);

    if (!message) {
      res.status(404);
      throw new Error('Message not found');
    }

    // Owner or Admin check
    if (message.senderId?.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      res.status(401);
      throw new Error('Not authorized to delete this message');
    }

    await message.deleteOne();
    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a specific reply in a thread
// @route   PUT /api/messages/:id/replies/:replyId
// @access  Private
const updateReply = async (req, res, next) => {
  try {
    const { text } = req.body;
    const message = await Message.findById(req.params.id);

    if (!message) {
      res.status(404);
      throw new Error('Message not found');
    }

    const reply = message.replies.id(req.params.replyId);
    if (!reply) {
      res.status(404);
      throw new Error('Reply not found');
    }

    // Role check: users can only edit their own replies, admins theirs
    const isAdmin = req.user.role === 'admin';
    if (reply.senderRole === 'admin' && !isAdmin) {
      res.status(401);
      throw new Error('Not authorized to edit admin reply');
    }
    
    // In our simplified logic, we assume if it's a user reply, only the thread owner can edit it
    if (reply.senderRole === 'user' && message.senderId?.toString() !== req.user._id.toString()) {
      res.status(401);
      throw new Error('Not authorized to edit this user reply');
    }

    reply.text = text;
    await message.save();

    res.status(200).json({ success: true, data: message });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a specific reply from a thread
// @route   DELETE /api/messages/:id/replies/:replyId
// @access  Private
const deleteReply = async (req, res, next) => {
  try {
    const message = await Message.findById(req.params.id);

    if (!message) {
      res.status(404);
      throw new Error('Message not found');
    }

    const reply = message.replies.id(req.params.replyId);
    if (!reply) {
      res.status(404);
      throw new Error('Reply not found');
    }

    const isAdmin = req.user.role === 'admin';
    if (reply.senderRole === 'admin' && !isAdmin) {
      res.status(401);
      throw new Error('Not authorized to delete admin reply');
    }

    if (reply.senderRole === 'user' && message.senderId?.toString() !== req.user._id.toString() && !isAdmin) {
      res.status(401);
      throw new Error('Not authorized to delete this reply');
    }

    message.replies.pull(req.params.replyId);
    await message.save();

    res.status(200).json({ success: true, data: message });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  sendMessage,
  getMessages,
  replyMessage,
  markAsRead,
  getMyMessages,
  initMessage,
  userReply,
  updateMessage,
  deleteMessage,
  updateReply,
  deleteReply,
};
