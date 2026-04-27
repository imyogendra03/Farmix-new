const mongoose = require('mongoose');

const predictionHistorySchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User'
    },
    type: {
      type: String,
      enum: ['crop', 'disease', 'yield'],
      required: true
    },
    inputs: {
      type: mongoose.Schema.Types.Mixed,
      required: true
    },
    results: {
      type: mongoose.Schema.Types.Mixed,
      required: true
    }
  },
  {
    timestamps: true
  }
);

const PredictionHistory = mongoose.model('PredictionHistory', predictionHistorySchema);
module.exports = PredictionHistory;
