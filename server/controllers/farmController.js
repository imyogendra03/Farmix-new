const FarmLocation = require('../models/FarmLocation');
const FarmTask = require('../models/FarmTask');

// @desc    Save farm location
// @route   POST /api/farm/location
// @access  Private
const saveLocation = async (req, res, next) => {
  try {
    const { farmName, latitude, longitude } = req.body;
    
    if (!farmName || latitude === undefined || longitude === undefined) {
      res.status(400);
      throw new Error('Please provide farmName, latitude, and longitude');
    }

    const location = await FarmLocation.create({
      userId: req.user._id,
      farmName,
      latitude,
      longitude
    });

    res.status(201).json({ success: true, data: location });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all farm locations for user
// @route   GET /api/farm/location
// @access  Private
const getLocations = async (req, res, next) => {
  try {
    const locations = await FarmLocation.find({ userId: req.user._id }).sort('-createdAt');
    res.status(200).json({ success: true, data: locations });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new farm task
// @route   POST /api/farm/task
// @access  Private
const createTask = async (req, res, next) => {
  try {
    const { crop, task, date, priority, notes } = req.body;
    
    if (!crop || !task || !date) {
      res.status(400);
      throw new Error('Please provide crop, task, and date');
    }

    const newTask = await FarmTask.create({
      userId: req.user._id,
      crop,
      task,
      date,
      priority: priority || 'medium',
      notes: notes || ''
    });

    res.status(201).json({ success: true, data: newTask });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all farm tasks for user
// @route   GET /api/farm/tasks
// @access  Private
const getTasks = async (req, res, next) => {
  try {
    const tasks = await FarmTask.find({ userId: req.user._id }).sort('date');
    res.status(200).json({ success: true, data: tasks });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  saveLocation,
  getLocations,
  createTask,
  getTasks
};
