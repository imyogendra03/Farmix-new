const mongoose = require('mongoose');

const cropDataSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User'
    },
    type: {
      type: String,
      required: true,
      enum: ['Crop-Recommendation', 'Disease-Prediction', 'Yield-Prediction']
    },
    inputData: {
      type: mongoose.Schema.Types.Mixed,
      required: true
    },
    predictionResult: {
      type: mongoose.Schema.Types.Mixed,
      required: true
    }
  },
  {
    timestamps: true
  }
);

const CropData = mongoose.model('CropData', cropDataSchema);
module.exports = CropData;
