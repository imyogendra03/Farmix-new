const { authorize } = require('./authMiddleware');

module.exports = authorize('admin');
