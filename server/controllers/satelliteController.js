// @desc    Get Satellite NDVI and health data overlay (Mocked)
// @route   GET /api/satellite/data
// @access  Public
const getSatelliteData = async (req, res, next) => {
  try {
    const { lat, lng } = req.query;
    
    if (!lat || !lng) {
      res.status(400);
      throw new Error('Please provide latitude and longitude');
    }

    // In production, this would call Google Earth Engine or Sentinel Hub API
    // Here we generate mock analysis data based on generic map coordinates.
    
    const mockNdvi = Math.random() * (0.8 - 0.4) + 0.4; // 0.4 to 0.8 is typical for vegetation
    let healthStatus = 'Moderate';
    if (mockNdvi > 0.6) healthStatus = 'Excellent';
    if (mockNdvi < 0.5) healthStatus = 'Stressed';

    res.status(200).json({ 
        success: true, 
        data: {
            coordinates: { lat, lng },
            ndvi: mockNdvi.toFixed(2),
            healthStatus,
            stressIndicators: {
                waterStress: mockNdvi < 0.55 ? 'High' : 'Low',
                nitrogenLevel: mockNdvi > 0.6 ? 'Optimal' : 'Needs attention'
            },
            imageUrl: 'https://via.placeholder.com/600x400/ffff00/000000?text=Satellite+NDVI+Overlay', // Placeholder for actual heatmap
            lastUpdated: new Date()
        }
    });

  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSatelliteData
};
