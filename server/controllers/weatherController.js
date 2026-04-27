// @desc    Get comprehensive weather data
// @route   GET /api/weather/data
// @access  Public
const getWeatherData = async (req, res, next) => {
  try {
    const { lat, lng } = req.query;
    
    if (!lat || !lng) {
      res.status(400);
      throw new Error('Please provide latitude and longitude');
    }

    const axios = require('axios');
    const apiKey = process.env.OPENWEATHER_API_KEY;

    // If API key is not set, return mock data
    if (!apiKey) {
      const mockWeather = {
        temp: 28,
        feelsLike: 31,
        tempMin: 25,
        tempMax: 32,
        humidity: 65,
        pressure: 1013,
        windSpeed: 12,
        windGust: 18,
        visibility: 10,
        uvIndex: 7,
        cloudCover: 40,
        rainProbability: 30,
        rainfall: 0,
        condition: 'Partly Cloudy',
        description: 'partly cloudy skies',
        location: 'Farm Location',
        coordinates: { lat: parseFloat(lat), lng: parseFloat(lng) },
        status: 'mock'
      };

      return res.status(200).json({
        success: true,
        data: mockWeather
      });
    }

    try {
      // Fetch current weather from OpenWeatherMap
      const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=${apiKey}&units=metric`;
      const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lng}&appid=${apiKey}&units=metric&cnt=8`;
      const uvUrl = `https://api.openweathermap.org/data/2.5/uvi?lat=${lat}&lon=${lng}&appid=${apiKey}`;

      const [weatherRes, forecastRes, uvRes] = await Promise.all([
        axios.get(weatherUrl),
        axios.get(forecastUrl),
        axios.get(uvUrl).catch(() => ({ data: { value: 5 } })) // UV might not always succeed
      ]);

      const weatherData = weatherRes.data;
      const forecastData = forecastRes.data;
      const uvData = uvRes.data;

      // Calculate rain probability from forecast
      let rainProbability = 0;
      let rainfallSum = 0;
      if (forecastData.list && forecastData.list.length > 0) {
        const rainyHours = forecastData.list.filter(item => item.pop > 0);
        rainProbability = Math.round((rainyHours.length / forecastData.list.length) * 100);
        rainfallSum = forecastData.list.reduce((sum, item) => sum + (item.rain?.['3h'] || 0), 0);
      }

      const weatherInfo = {
        temp: Math.round(weatherData.main.temp),
        feelsLike: Math.round(weatherData.main.feels_like),
        tempMin: Math.round(weatherData.main.temp_min),
        tempMax: Math.round(weatherData.main.temp_max),
        humidity: weatherData.main.humidity,
        pressure: weatherData.main.pressure,
        windSpeed: Math.round(weatherData.wind.speed),
        windGust: Math.round(weatherData.wind.gust || weatherData.wind.speed * 1.2),
        visibility: Math.round(weatherData.visibility / 1000),
        uvIndex: Math.round(uvData.value || 5),
        cloudCover: weatherData.clouds.all,
        rainProbability,
        rainfall: Math.round(rainfallSum * 10) / 10,
        condition: weatherData.weather[0].main,
        description: weatherData.weather[0].description,
        location: weatherData.name || 'Unknown Location',
        coordinates: { lat: parseFloat(lat), lng: parseFloat(lng) },
        status: 'success'
      };

      res.status(200).json({
        success: true,
        data: weatherInfo
      });
    } catch (apiError) {
      console.error('OpenWeatherMap API Error:', apiError.message);
      // Return mock data on API failure
      res.status(200).json({
        success: true,
        data: {
          temp: 28,
          feelsLike: 31,
          tempMin: 25,
          tempMax: 32,
          humidity: 65,
          pressure: 1013,
          windSpeed: 12,
          windGust: 18,
          visibility: 10,
          uvIndex: 7,
          cloudCover: 40,
          rainProbability: 30,
          rainfall: 0,
          condition: 'Partly Cloudy',
          description: 'partly cloudy skies',
          location: 'Farm Location',
          coordinates: { lat: parseFloat(lat), lng: parseFloat(lng) },
          status: 'mock',
          error: 'Using mock data due to API unavailability'
        }
      });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Get weather alerts based on conditions
 * @route   GET /api/weather/alerts
 * @access  Public
 */
const getWeatherAlerts = async (req, res, next) => {
  try {
    const { lat, lng } = req.query;
    
    if (!lat || !lng) {
      res.status(400);
      throw new Error('Please provide latitude and longitude');
    }

    const axios = require('axios');
    const apiKey = process.env.OPENWEATHER_API_KEY;

    if (!apiKey) {
      return res.status(200).json({
        success: true,
        data: {
          alerts: [],
          status: 'mock'
        }
      });
    }

    try {
      const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=${apiKey}&units=metric`;
      const weatherRes = await axios.get(weatherUrl);
      const weatherData = weatherRes.data;

      const alerts = [];

      // Generate alerts based on weather conditions
      if (weatherData.main.temp > 35) {
        alerts.push({
          type: 'heat',
          severity: 'high',
          message: 'Extreme heat alert. Temperature above 35°C.',
          recommendation: 'Increase irrigation. Avoid pesticide spraying.'
        });
      }

      if (weatherData.main.humidity > 85) {
        alerts.push({
          type: 'humidity',
          severity: 'medium',
          message: 'High humidity detected. Risk of fungal diseases.',
          recommendation: 'Improve air circulation. Monitor crops for fungal infections.'
        });
      }

      if (weatherData.wind.speed > 15) {
        alerts.push({
          type: 'wind',
          severity: 'medium',
          message: 'Strong wind warning. Wind speed above 15 m/s.',
          recommendation: 'Secure young plants. Postpone pesticide application.'
        });
      }

      if (weatherData.rain && weatherData.rain['1h'] > 10) {
        alerts.push({
          type: 'rain',
          severity: 'high',
          message: 'Heavy rainfall detected.',
          recommendation: 'Check drainage systems. Ensure crop protection.'
        });
      }

      if (weatherData.main.temp < 5) {
        alerts.push({
          type: 'frost',
          severity: 'high',
          message: 'Frost risk. Temperature below 5°C.',
          recommendation: 'Protect sensitive crops. Monitor for frost formation.'
        });
      }

      res.status(200).json({
        success: true,
        data: {
          alerts,
          timestamp: new Date(),
          status: 'success'
        }
      });
    } catch (apiError) {
      console.error('Weather alerts API Error:', apiError.message);
      res.status(200).json({
        success: true,
        data: {
          alerts: [],
          status: 'mock'
        }
      });
    }
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getWeatherData,
  getWeatherAlerts
};
