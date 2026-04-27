const { recommendCrop } = require('../services/cropService');
const CropData = require('../models/CropData');

// @desc    Get crop recommendation
// @route   POST /api/crop/recommend
// @access  Private
const getCropRecommendation = async (req, res, next) => {
  try {
    const {
      soilPH,
      rainfall,
      temperature,
      humidity,
      nitrogen,
      phosphorus,
      potassium
    } = req.body;

    // Validate soil pH (should be between 0-14)
    if (soilPH === undefined || soilPH === '' || isNaN(soilPH) || soilPH < 0 || soilPH > 14) {
      res.status(400);
      throw new Error('Please provide a valid soil pH value (0-14)');
    }

    if (
      rainfall === undefined || temperature === undefined || humidity === undefined ||
      nitrogen === undefined || phosphorus === undefined || potassium === undefined
    ) {
      res.status(400);
      throw new Error('Please provide all required inputs (weather + NPK + soil pH)');
    }

    const predictionResult = await recommendCrop(req.body);

    // Save prediction history
    await CropData.create({
      user: req.user.id,
      type: 'Crop-Recommendation',
      inputData: req.body,
      predictionResult
    });

    res.status(200).json({
      success: true,
      data: predictionResult
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getCropRecommendation };
