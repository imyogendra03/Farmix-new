const { GoogleGenerativeAI } = require("@google/generative-ai");

// Initialize Gemini API
const genAI = process.env.GEMINI_API_KEY 
  ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  : null;

/**
 * Chat with AI using Gemini Pro
 * @param {string} prompt - User message
 * @param {Array} history - Previous chat history
 */
const chatWithAI = async (prompt, history = []) => {
  if (!genAI) {
    return {
      reply: "Google Gemini API is not configured. Please add GEMINI_API_KEY to your .env file.",
      status: "mock"
    };
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const chat = model.startChat({
      history: history.map(h => ({
        role: h.role === 'user' ? 'user' : 'model',
        parts: [{ text: h.content || h.text || h.message }]
      })),
      generationConfig: {
        maxOutputTokens: 1000,
      },
    });

    const result = await chat.sendMessage(prompt);
    const response = await result.response;
    return {
      reply: response.text(),
      status: "success"
    };
  } catch (error) {
    console.error("Gemini Chat Error:", error);
    throw new Error("Failed to communicate with AI. Please try again later.");
  }
};

/**
 * Detect disease from leaf image using Gemini Pro Vision
 * @param {string} imagePath - Local path to the uploaded image
 * @param {string} mimeType - Image mime type
 */
const detectDisease = async (imageBuffer, mimeType) => {
  if (!genAI) {
    return {
      diseaseName: "Simulated Leaf Rust",
      confidence: 92,
      severity: "Moderate",
      treatment: "Mock treatment: Use copper-based fungicides.",
      recommendation: "Please configure GEMINI_API_KEY for real analysis.",
      status: "mock"
    };
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }); // Using 1.5 flash for better vision

    const prompt = `Analyze this plant leaf image. 
    Identify the disease if any. 
    Return the response in JSON format (strictly) with the following fields:
    {
      "diseaseName": "Name of the disease or 'Healthy'",
      "confidence": "Match percentage (0-100)",
      "severity": "Low/Moderate/High",
      "causes": "Short description of causes",
      "treatment": "Comprehensive treatment steps",
      "prevention": "Preventive measures"
    }`;

    const imageParts = [
      {
        inlineData: {
          data: imageBuffer.toString("base64"),
          mimeType
        },
      },
    ];

    const result = await model.generateContent([prompt, ...imageParts]);
    const response = await result.response;
    const text = response.text();
    
    // Attempt to parse JSON from response
    try {
      const jsonStart = text.indexOf('{');
      const jsonEnd = text.lastIndexOf('}') + 1;
      const jsonStr = text.slice(jsonStart, jsonEnd);
      return JSON.parse(jsonStr);
    } catch (e) {
      return {
        diseaseName: "Unknown",
        description: text,
        status: "parsed-error"
      };
    }
  } catch (error) {
    console.error("Gemini Vision Error:", error);
    throw new Error("Failed to analyze image with AI.");
  }
};

module.exports = {
  chatWithAI,
  detectDisease
};
