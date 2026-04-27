// @desc    Get Chatbot Response
// @route   POST /api/chatbot/query
// @access  Public

const AGRI_INTENTS = [
  {
    keywords: ['hello', 'hi', 'hey', 'greet', 'good morning', 'good evening', 'namaste'],
    replies: [
      "Hello! Welcome to AgriTech 🌿. Ask me anything about crops, soil, irrigation, or pest control!",
      "Namaste! I'm your AgriTech AI assistant. How can I help your farm today?",
    ]
  },
  {
    keywords: ['crop', 'recommend', 'suggest', 'grow', 'cultivate', 'plant', 'sow', 'seed'],
    replies: [
      "For precise crop recommendations, use our Crop Recommendation tool with your soil NPK values and local weather. Generally, Rabi crops like wheat and mustard are best sown in October–November, while Kharif crops like paddy and maize suit June–July.",
      "Crop selection depends on your soil type, water availability, and season. Our ML-based Crop Recommendation tool gives region-specific suggestions — enter your N, P, K, temperature, and rainfall data!",
    ]
  },
  {
    keywords: ['soil', 'npk', 'nitrogen', 'phosphorus', 'potassium', 'ph', 'fertility'],
    replies: [
      "Healthy soil should have a pH of 6–7 for most crops. Test your NPK levels before planting — excess nitrogen can burn roots while deficiency stunts growth. We recommend soil testing every 3 seasons.",
      "Improve soil fertility with organic compost and green manure. Legume crops like soybean fix atmospheric nitrogen, naturally enriching the soil for the next crop cycle.",
    ]
  },
  {
    keywords: ['pest', 'insect', 'bug', 'aphid', 'caterpillar', 'infestation', 'locust'],
    replies: [
      "For pest control, first identify the pest type. Neem oil spray is highly effective against aphids and whiteflies. For severe infestations, consult a local agronomist before applying chemical pesticides.",
      "Integrated Pest Management (IPM) is the sustainable approach: use biological controls first (predator insects), then organic pesticides, and chemical treatments as a last resort. Monitor your crops weekly for early detection.",
    ]
  },
  {
    keywords: ['disease', 'sick', 'spots', 'wilt', 'blight', 'mildew', 'rust', 'rot', 'fungal', 'bacterial', 'virus'],
    replies: [
      "Upload a clear photo of the affected leaf to our Disease Prediction tool for an AI diagnosis! Common fungal diseases like Leaf Rust respond to copper-based fungicides applied early morning.",
      "Plant diseases often spread through water splash and contaminated tools. Ensure proper plant spacing for good airflow, avoid overhead irrigation, and sterilize pruning tools between plants.",
    ]
  },
  {
    keywords: ['irrigation', 'water', 'drip', 'sprinkler', 'moisture', 'drought', 'rain water'],
    replies: [
      "Drip irrigation is 30-50% more water-efficient than flood irrigation, making it ideal for water-scarce regions. Install soil moisture sensors to automate watering only when the soil drops below optimal moisture.",
      "The best irrigation schedule depends on crop stage — seedlings need more frequent light watering while established crops benefit from deep, less frequent irrigation to encourage deep root growth.",
    ]
  },
  {
    keywords: ['fertilizer', 'manure', 'compost', 'organic', 'urea', 'dap', 'npk fertilizer'],
    replies: [
      "Apply DAP (Di-Ammonium Phosphate) during soil preparation for strong root establishment. Follow up with Urea in split doses during vegetative and flowering stages. Avoid over-application — it leaches into groundwater.",
      "Organic alternatives like farm yard manure (FYM), vermicompost, and bio-fertilizers (Rhizobium, Azotobacter) improve long-term soil health without the environmental side effects of chemical fertilizers.",
    ]
  },
  {
    keywords: ['harvest', 'yield', 'production', 'output', 'ton', 'quintal', 'per acre'],
    replies: [
      "Maximize yield by ensuring timely planting, balanced fertilization, and proper pest management. Our Yield Forecasting tool can predict expected production based on your crop type, area, and season.",
      "Post-harvest losses can reduce effective yield by 15-20%. Proper storage with controlled humidity and temperature (especially for grains) is essential. Consider hermetic storage bags for small-scale farmers.",
    ]
  },
  {
    keywords: ['market', 'price', 'sell', 'mandi', 'buyer', 'profit', 'msp', 'minimum support price'],
    replies: [
      "Check the Market Prediction section for live price trends. Connecting directly with buyers through our Community forum eliminates middlemen and can increase your profit margin by 15-25%.",
      "MSP (Minimum Support Price) is announced by the government before each season — always compare market prices with MSP before selling. Collective bargaining with farmer groups often yields better prices.",
    ]
  },
  {
    keywords: ['weather', 'rain', 'temperature', 'humidity', 'forecast', 'monsoon', 'season', 'climate'],
    replies: [
      "Check the weather widget on your Dashboard for real-time temperature, humidity, and rainfall data based on your location. Plan sowing and spraying activities around dry weather windows.",
      "The Indian monsoon (June–September) delivers 75% of annual rainfall. Plan Kharif crop sowing to coincide with the first reliable rains. Avoid spraying pesticides or fertilizers during heavy rain.",
    ]
  },
  {
    keywords: ['season', 'rabi', 'kharif', 'zaid', 'summer', 'winter', 'spring'],
    replies: [
      "Kharif season (June-October): Paddy, Maize, Cotton, Soybean. Rabi season (Oct-March): Wheat, Mustard, Chickpea, Peas. Zaid (March-June): Watermelon, Cucumber, Muskmelon.",
      "Choosing the right crop for the season is critical. Growing a Rabi crop in Kharif conditions (or vice versa) causes massive yield loss due to day-length sensitivity (photoperiodism) in crops like wheat.",
    ]
  },
  {
    keywords: ['organic', 'natural', 'bio', 'sustainable', 'eco', 'traditional'],
    replies: [
      "Organic farming avoids synthetic chemicals, improving long-term soil health. Start with crop rotation, green manuring, and composting. Organic certification typically takes 3 years but commands 20-40% price premiums.",
    ]
  },
  {
    keywords: ['tractor', 'machine', 'equipment', 'tool', 'mechanize', 'farm equipment'],
    replies: [
      "Farm mechanization can reduce labor costs by 30-40%. Start with a power tiller for small farms — it handles ploughing, harrowing, and inter-cultivation. For larger farms, consider hiring tractors through FPO (Farmer Producer Organizations).",
    ]
  },
];

const getRandomReply = (replies) => replies[Math.floor(Math.random() * replies.length)];

const { chatWithAI } = require('../services/geminiService');

const getChatbotResponse = async (req, res, next) => {
  try {
    const { message, history = [] } = req.body;

    if (!message || typeof message !== 'string' || !message.trim()) {
      res.status(400);
      throw new Error('Message is required');
    }

    const result = await chatWithAI(message, history);

    let quickReplies = ['Crop Advice', 'Irrigation Tips', 'Pest Control', 'Fertilizer Guide', 'Market Prices'];
    
    // Add logic for dynamic quick replies if needed later
    if (message.toLowerCase().includes('disease')) {
      quickReplies = ['Fungal treatments', 'Pest control tips', 'Upload leaf image', 'Organic sprays'];
    }

    res.status(200).json({
      success: true,
      data: {
        reply: result.reply,
        quickReplies,
        status: result.status
      }
    });

  } catch (error) {
    next(error);
  }
};

module.exports = { getChatbotResponse };
