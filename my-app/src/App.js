import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import { analyzeSymptoms } from './utils/api';
import useSpeechRecognition from './hooks/useSpeechRecognition';
import MapWithPlaces from './components/MapWithPlaces';
import "regenerator-runtime/runtime";

// Coordinates for Juhu, Mumbai
const defaultCenter = { lat: 19.0945, lng: 72.8252 };

// Health insights and facts database
const healthInsights = [
  "Did you know? Drinking 8 glasses of water daily can improve cognitive function by 30%.",
  "Regular exercise can reduce the risk of heart disease by up to 35%.",
  "Meditation for just 10 minutes daily can lower stress levels significantly.",
  "Sleeping 7-8 hours nightly boosts immune system function by 40%.",
  "Eating leafy greens daily can improve vision and reduce eye disease risk.",
  "Walking 10,000 steps a day can add 3 years to your life expectancy.",
  "Laughing regularly can improve blood flow by 20% and reduce stress.",
  "Blueberries are packed with antioxidants that fight aging and inflammation.",
  "Stretching daily improves flexibility and reduces injury risk by 50%.",
  "Vitamin D from sunlight helps absorb calcium for stronger bones.",
  "Deep breathing exercises can lower blood pressure in just 5 minutes.",
  "Omega-3 fatty acids in fish support brain health and memory.",
  "Green tea contains compounds that may boost metabolism and burn fat.",
  "Maintaining good posture can prevent chronic back and neck pain.",
  "Dark chocolate in moderation can improve heart health and mood.",
  "Social connections and friendships can increase lifespan by up to 50%.",
  "Yoga practice improves balance, flexibility, and mental clarity.",
  "Reducing sugar intake can dramatically decrease diabetes risk.",
  "Reading regularly keeps your brain sharp and delays cognitive decline.",
  "Avocados are rich in healthy fats that support heart health.",
  "Taking breaks from screens every 20 minutes reduces eye strain.",
  "Ginger has anti-inflammatory properties that can ease muscle pain.",
  "Maintaining a healthy weight reduces joint stress and arthritis risk.",
  "Probiotics in yogurt support gut health and immune function.",
  "Sun protection with SPF 30+ prevents skin aging and cancer risk.",
  "Strength training twice weekly maintains muscle mass as you age.",
  "Cinnamon may help regulate blood sugar levels naturally.",
  "Keeping a gratitude journal improves mental health and happiness.",
  "Almonds are packed with vitamin E for healthy skin and hair.",
  "Cold showers can boost circulation and immune response.",
  "Turmeric contains curcumin, a powerful anti-inflammatory compound.",
  "Daily mindfulness practice reduces anxiety and improves focus.",
  "Bananas are rich in potassium, essential for heart and muscle function.",
  "Good oral hygiene reduces risk of heart disease and diabetes.",
  "Spinach is loaded with iron, vitamins, and antioxidants.",
  "Standing desks can reduce back pain and improve posture.",
  "Berries are among the highest antioxidant-rich foods available.",
  "Maintaining consistent sleep schedules regulates your body clock.",
  "Olive oil contains healthy fats that support cardiovascular health.",
  "Daily sunlight exposure helps regulate mood and sleep patterns."
];

// Common illnesses with treatments and diet plans
const commonIllnesses = [
  {
    illness: "Common Cold",
    medicines: ["Paracetamol", "Antihistamines", "Decongestants"],
    diet: "Vitamin C rich foods, warm fluids, chicken soup, garlic, ginger tea"
  },
  {
    illness: "Headache/Migraine",
    medicines: ["Ibuprofen", "Aspirin", "Acetaminophen"],
    diet: "Magnesium-rich foods, hydration, caffeine in moderation, avoid processed foods"
  },
  {
    illness: "Fever",
    medicines: ["Paracetamol", "Ibuprofen", "Stay hydrated"],
    diet: "Clear broths, herbal teas, bananas, applesauce, toast (BRAT diet)"
  },
  {
    illness: "Stomach Upset",
    medicines: ["Antacids", "Anti-diarrheal", "Probiotics"],
    diet: "Bananas, rice, applesauce, toast, yogurt, boiled potatoes"
  },
  {
    illness: "Allergies",
    medicines: ["Antihistamines", "Nasal sprays", "Decongestants"],
    diet: "Local honey, omega-3 rich foods, vitamin C, quercetin-rich foods"
  },
  {
    illness: "Sore Throat",
    medicines: ["Throat lozenges", "Salt water gargle", "Pain relievers"],
    diet: "Warm tea with honey, soft foods, cold treats, avoid acidic foods"
  }
];

function App() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [aiResponse, setAiResponse] = useState(null);
  const [specialty, setSpecialty] = useState("General Practice");
  const [isProcessing, setIsProcessing] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [currentInsight, setCurrentInsight] = useState(0);
  const [isFlipping, setIsFlipping] = useState(false);
  const [expandedIllness, setExpandedIllness] = useState(null);
  const latestTranscriptRef = useRef("");

  // Obtain user’s geolocation
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        ({ coords }) => setUserLocation({ lat: coords.latitude, lng: coords.longitude }),
        () => setUserLocation(defaultCenter)
      );
    } else {
      setUserLocation(defaultCenter);
    }
  }, []);

  // Rotate health insights every 30 seconds
  useEffect(() => {
    const insightInterval = setInterval(() => {
      setIsFlipping(true);
      setTimeout(() => {
        setCurrentInsight((prev) => (prev + 1) % healthInsights.length);
        setIsFlipping(false);
      }, 500);
    }, 30000);

    return () => clearInterval(insightInterval);
  }, []);

  const flipInsight = () => {
    setIsFlipping(true);
    setTimeout(() => {
      setCurrentInsight((prev) => (prev + 1) % healthInsights.length);
      setIsFlipping(false);
    }, 500);
  };

  const toggleIllness = (index) => {
    setExpandedIllness(expandedIllness === index ? null : index);
  };

  // Send symptoms to backend AI service, update specialty
  const processSymptoms = async (symptoms) => {
    if (!symptoms.trim()) return;
    setIsProcessing(true);
    try {
      const response = await analyzeSymptoms(symptoms);
      setAiResponse(response);
      setSpecialty(response?.suggestedSpecialty || "General Practice");
    } catch {
      alert("Error analyzing symptoms. Please try again.");
    }
    setIsProcessing(false);
  };

  // Speech recognition hooks
  const { startListening, stopListening } = useSpeechRecognition({
    onResult: (result) => {
      setTranscript(result);
      latestTranscriptRef.current = result;
    },
    onEnd: () => {
      setIsListening(false);
      const final = latestTranscriptRef.current.trim();
      if (final) processSymptoms(final);
    }
  });

  const handleMicClick = () => {
    if (isListening) {
      stopListening();
      setIsListening(false);
    } else {
      setTranscript("");
      setIsListening(true);
      startListening();
    }
  };

  return (
    <div className="health-assistant">
      <header className="app-header">
        <div className="app-title">
          <i className="fas fa-heartbeat"></i> Health Assistant
        </div>
        <div className="user-info">
          <i className="fas fa-map-marker-alt"></i>
          <span>{userLocation ? "Location enabled" : "Enable location"}</span>
        </div>
      </header>

      <div className="app-content">
        <div className="sidebar">
          <h3>How it works</h3>
          <ol style={{ marginLeft: 20, marginTop: 15, lineHeight: 1.8 }}>
            <li>Click the microphone button</li>
            <li>Describe your symptoms</li>
            <li>AI will analyze your condition</li>
            <li>Get personalized health advice</li>
            <li>Find the best {specialty} facilities nearby</li>
          </ol>
          
          {/* Health Insights Section */}
          <div className="whats-new-section">
            <h3 style={{ marginBottom: 15, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span>
                <i className="fas fa-lightbulb" style={{ marginRight: 10 }}></i>
                Health Insight
              </span>
              <button 
                onClick={flipInsight}
                className="insight-refresh-btn"
                title="Next insight"
              >
                <i className="fas fa-sync"></i>
              </button>
            </h3>
            <div className={`insight-card ${isFlipping ? 'flipping' : ''}`}>
              <p>{healthInsights[currentInsight]}</p>
            </div>
            <p className="insight-counter">
              New fact every 30 seconds • {currentInsight + 1}/{healthInsights.length}
            </p>
          </div>

          {/* Common Illnesses Section */}
          <div className="common-illnesses-section">
            <h3 style={{ margin: '25px 0 15px 0', display: 'flex', alignItems: 'center' }}>
              <i className="fas fa-first-aid" style={{ marginRight: 10 }}></i>
              Common Illness Guide
            </h3>
            <div className="illnesses-list">
              {commonIllnesses.map((illness, index) => (
                <div key={index} className="illness-item">
                  <div 
                    className="illness-header"
                    onClick={() => toggleIllness(index)}
                  >
                    <span className="illness-name">{illness.illness}</span>
                    <i className={`fas fa-chevron-${expandedIllness === index ? 'up' : 'down'}`}></i>
                  </div>
                  
                  {expandedIllness === index && (
                    <div className="illness-details">
                      <div className="illness-info">
                        <h4>Medicines:</h4>
                        <div className="medicines-list">
                          {illness.medicines.map((medicine, medIndex) => (
                            <span key={medIndex} className="medicine-tag">{medicine}</span>
                          ))}
                        </div>
                      </div>
                      
                      <div className="illness-info">
                        <h4>Diet Plan:</h4>
                        <p className="diet-plan">{illness.diet}</p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="main-content">
          <div className="speech-section">
            <h2>Describe your symptoms</h2>
            <button
              className={`mic-button ${isListening ? 'listening' : ''}`}
              onClick={handleMicClick}
            >
              <i className="fas fa-microphone"></i>
            </button>
            <p>{isListening ? "Listening... Speak now" : "Click the microphone to start"}</p>
            <div className="transcript-box">
              {transcript || (isListening ? "Listening..." : "Your speech will appear here...")}
            </div>
          </div>

          {isProcessing && (
            <div style={{ textAlign: 'center', margin: '20px 0' }}>
              <i className="fas fa-spinner fa-spin" style={{ fontSize: 24, color: '#3498db' }}></i>
              <p>Analyzing your symptoms with AI...</p>
            </div>
          )}

          {aiResponse && (
            <div className="response-section">
              <h2>Health Assessment</h2>
              <div style={{ marginTop: 15 }}>
                <p><strong>Primary Diagnosis:</strong> {aiResponse.diagnosis}</p>
                <p>
                  <strong>Severity:</strong>{' '}
                  <span style={{
                    color:
                      aiResponse.severity === 'high' ? '#e74c3c' :
                      aiResponse.severity === 'medium' ? '#f39c12' :
                      '#27ae60'
                  }}>
                    {aiResponse.severity}
                  </span>
                </p>
                <p><strong>Description:</strong> {aiResponse.description}</p>
                <p><strong>Advice:</strong> {aiResponse.advice}</p>

                {aiResponse.symptoms_list?.length > 0 && (
                  <div style={{ marginTop: 15 }}>
                    <p><strong>Related Symptoms:</strong></p>
                    <ul style={{ marginLeft: 20 }}>
                      {aiResponse.symptoms_list.map((s, i) => <li key={i}>{s}</li>)}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="map-section" style={{ margin: '20px 0' }}>
            <h2>Nearby {specialty} Facilities</h2>
            <MapWithPlaces
              userLocation={userLocation}
              specialty={specialty}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;