const CropData = require('../models/CropData');
const User = require('../models/User');
const Post = require('../models/Post');

// @desc    Get agricultural trends
// @route   GET /api/analytics/trends
// @access  Private/Admin
const getTrends = async (req, res, next) => {
  try {
    // Prediction Trends
    const cropCount = await CropData.countDocuments({ type: 'Crop-Recommendation' });
    const diseaseCount = await CropData.countDocuments({ type: 'Disease-Prediction' });
    const yieldCount = await CropData.countDocuments({ type: 'Yield-Prediction' });

    // Most recommended crops
    const cropPredictions = await CropData.find({ type: 'Crop-Recommendation' });
    const cropCounts = {};
    cropPredictions.forEach(pred => {
      const crop = pred.predictionResult?.recommendedCrop;
      if (crop) {
        cropCounts[crop] = (cropCounts[crop] || 0) + 1;
      }
    });

    const topCrops = Object.keys(cropCounts)
      .map(name => ({ name, count: cropCounts[name] }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Community activity
    const last30Days = new Date();
    last30Days.setDate(last30Days.getDate() - 30);

    const activePosts = await Post.countDocuments({ createdAt: { $gte: last30Days } });

    res.status(200).json({
      success: true,
      data: {
        predictionTypes: [
          { name: 'Crop', value: cropCount },
          { name: 'Disease', value: diseaseCount },
          { name: 'Yield', value: yieldCount }
        ],
        topCrops,
        communityActivity: {
          recentPosts: activePosts
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getTrends };
