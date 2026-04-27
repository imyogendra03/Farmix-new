const axios = require('axios');

/**
 * Fetch weather data from OpenWeatherMap
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 */
const getWeatherData = async (lat, lon) => {
  const apiKey = process.env.OPENWEATHER_API_KEY;

  if (!apiKey) {
    // Return mock data if API key is missing
    return {
      temp: 28,
      main: "Clear",
      description: "sunny day",
      icon: "01d",
      humidity: 45,
      windSpeed: 10,
      location: "Sample Farm (Mock)",
      status: "mock"
    };
  }

  try {
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;
    const response = await axios.get(url);
    const data = response.data;

    return {
      temp: Math.round(data.main.temp),
      main: data.weather[0].main,
      description: data.weather[0].description,
      icon: data.weather[0].icon,
      humidity: data.main.humidity,
      windSpeed: data.wind.speed,
      location: data.name,
      status: "success"
    };
  } catch (error) {
    console.error("Weather API Error:", error.message);
    throw new Error("Failed to fetch weather data");
  }
};

module.exports = { getWeatherData };
