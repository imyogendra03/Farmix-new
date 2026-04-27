// Enhanced disease prediction service with rich disease database
// Supports 12 disease categories with confidence, severity, crop type, and treatment

const DISEASE_DATABASE = {
  'Leaf Rust': {
    cropTypes: ['Wheat', 'Barley', 'Maize'],
    severity: (confidence) => confidence > 80 ? 'High' : confidence > 55 ? 'Moderate' : 'Low',
    treatment: 'Apply Propiconazole or Mancozeb fungicides. Remove heavily infected leaves and burn them. Ensure crop spacing for air circulation.',
    prevention: 'Use rust-resistant seed varieties. Apply protective fungicides before disease onset during high-humidity periods.'
  },
  'Powdery Mildew': {
    cropTypes: ['Wheat', 'Peas', 'Cucurbits', 'Grapes'],
    severity: (confidence) => confidence > 75 ? 'High' : 'Moderate',
    treatment: 'Spray Sulphur-based fungicide or Karathane. Improve air circulation by pruning dense foliage.',
    prevention: 'Plant resistant varieties. Avoid overhead irrigation. Apply neem oil spray as preventive measure.'
  },
  'Early Blight': {
    cropTypes: ['Tomato', 'Potato', 'Brinjal'],
    severity: (confidence) => confidence > 70 ? 'Moderate' : 'Low',
    treatment: 'Remove affected leaves. Apply Chlorothalonil or Copper-based fungicides weekly.',
    prevention: 'Use disease-free seeds. Rotate crops with non-solanaceous plants every 3 years.'
  },
  'Late Blight': {
    cropTypes: ['Potato', 'Tomato'],
    severity: (confidence) => confidence > 60 ? 'High' : 'Moderate',
    treatment: 'Apply Metalaxyl + Mancozeb immediately. Destroy infected plant debris. Avoid field entry during wet conditions.',
    prevention: 'Use certified blight-resistant varieties. Apply preventive copper fungicides before monsoon onset.'
  },
  'Leaf Spot': {
    cropTypes: ['Groundnut', 'Soybean', 'Cotton', 'Paddy'],
    severity: (confidence) => confidence > 65 ? 'Moderate' : 'Low',
    treatment: 'Apply Carbendazim or Hexaconazole fungicides at 15-day intervals.',
    prevention: 'Ensure balanced NPK fertilization. Avoid water stress. Collect and destroy fallen infected leaves.'
  },
  'Bacterial Wilt': {
    cropTypes: ['Tomato', 'Potato', 'Pepper', 'Brinjal'],
    severity: () => 'High',
    treatment: 'No effective chemical cure. Remove and destroy infected plants immediately to prevent spread. Use copper bactericides as preventive.',
    prevention: 'Use disease-free seedlings from certified nurseries. Improve soil drainage. Avoid waterlogging.'
  },
  'Mosaic Virus': {
    cropTypes: ['Tomato', 'Cucumber', 'Beans', 'Pepper'],
    severity: (confidence) => confidence > 70 ? 'High' : 'Moderate',
    treatment: 'Remove and destroy infected plants. Control aphid/whitefly vectors with systemic insecticides like Imidacloprid.',
    prevention: 'Use virus-indexed seeds. Install yellow sticky traps for vector monitoring. Maintain field sanitation.'
  },
  'Root Rot': {
    cropTypes: ['Wheat', 'Paddy', 'Chickpea', 'Cotton'],
    severity: (confidence) => confidence > 60 ? 'High' : 'Moderate',
    treatment: 'Apply Trichoderma viride as soil drench. Improve soil drainage. Reduce irrigation frequency.',
    prevention: 'Treat seeds with Thiram or Captan before sowing. Avoid waterlogged conditions.'
  },
  'Cercospora Leaf Spot': {
    cropTypes: ['Sugarcane', 'Sugar Beet', 'Soybean'],
    severity: (confidence) => confidence > 65 ? 'Moderate' : 'Low',
    treatment: 'Apply Carbendazim or Propiconazole fungicides. Avoid dense planting.',
    prevention: 'Use tolerant varieties. Ensure adequate plant spacing and balanced nitrogen application.'
  },
  'Downy Mildew': {
    cropTypes: ['Maize', 'Pearl Millet', 'Grapes', 'Cucurbits'],
    severity: (confidence) => confidence > 70 ? 'High' : 'Moderate',
    treatment: 'Spray Metalaxyl or Fosetyl-Al fungicides. Avoid evening irrigation.',
    prevention: 'Use treated seeds. Plant in well-drained soil. Apply preventive copper sprays during humid periods.'
  },
  'Anthracnose': {
    cropTypes: ['Mango', 'Grapes', 'Beans', 'Chilli'],
    severity: (confidence) => confidence > 75 ? 'High' : 'Moderate',
    treatment: 'Apply Carbendazim or Mancozeb fungicides. Prune affected twigs and fruits.',
    prevention: 'Collect and burn fallen infected fruits. Apply preventive sprays before flowering.'
  },
  'Healthy': {
    cropTypes: ['All crop types'],
    severity: () => 'None',
    treatment: 'No treatment required. Continue current healthy farming practices.',
    prevention: 'Maintain balanced nutrition, proper irrigation, and regular crop monitoring to keep plants healthy.'
  }
};

const DISEASE_NAMES = Object.keys(DISEASE_DATABASE);

const predictDisease = async (imagePath) => {
  // Simulate ML model processing delay
  await new Promise((resolve) => setTimeout(resolve, 900));

  // Simulate disease selection with realistic confidence scores
  const randomIndex = Math.floor(Math.random() * DISEASE_NAMES.length);
  const diseaseName = DISEASE_NAMES[randomIndex];
  const diseaseInfo = DISEASE_DATABASE[diseaseName];

  const confidence = diseaseName === 'Healthy'
    ? Math.floor(Math.random() * 15) + 85 // 85-99% for healthy
    : Math.floor(Math.random() * 35) + 60; // 60-94% for diseases

  const severity = diseaseInfo.severity(confidence);
  const cropType = diseaseInfo.cropTypes[Math.floor(Math.random() * diseaseInfo.cropTypes.length)];

  return {
    diseaseName,
    confidence,
    severity,
    cropType,
    treatment: diseaseInfo.treatment,
    prevention: diseaseInfo.prevention,
    recommendation: severity === 'High'
      ? 'Immediate action required — consult a local agronomist.'
      : severity === 'Moderate'
        ? 'Apply treatment within 48 hours to prevent spread.'
        : 'Monitor the plant over the next few days.'
  };
};

module.exports = { predictDisease };
