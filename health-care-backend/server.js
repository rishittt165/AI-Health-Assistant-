const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI('AIzaSyDIPhpvk8Rky9_29epiSQX73aJfQpLtImk');

// Middleware
app.use(cors({
    origin: ['http://localhost:3000', 'http://localhost:3001'], // Add your frontend URL
    credentials: true
}));
app.use((req, res, next) => {
  res.set('Cache-Control', 'no-store');  // disable all caching
  next();
});

app.use(express.json());

// Main function to analyze symptoms
async function analyzeSymptoms(symptoms) {
    try {
        const model = genAI.getGenerativeModel({
            model: "gemini-2.0-flash",
        });

        const prompt = `You are a medical diagnostic assistant. Given a set of symptoms, analyze and return a response strictly in the following JSON format:

Return only valid JSON with no extra comments, text, or markdown.
Follow this exact schema:

{
  "possible_diagnoses": [
    {
      "diagnosis": "Name of the condition",
      "likelihood": "High | Moderate | Low",
      "symptoms": [
        "Symptom 1",
        "Symptom 2",
        "Related symptom 3"
      ],
      "notes": "A short note summarizing distinguishing features, treatment, and when to seek care."
    }
  ],
  "disclaimer": "This information is for general knowledge and informational purposes only, and does not constitute medical advice. It is essential to consult with a qualified healthcare professional for any health concerns or before making any decisions related to your health or treatment."
}

Instructions:

- Base all content strictly on the symptoms provided.
- Include the most probable diagnoses first, and less likely ones after.
- Each diagnosis object must include the four required fields exactly as above.
- The 'symptoms' field should include matching symptoms from the input and other related symptoms as typically seen with that diagnosis.
- Use only "High", "Moderate", or "Low" for the likelihood field.
- The disclaimer field must be included in every output, word-for-word as shown.
- Do not include any explanation, introduction, or text outside the JSON block.
- Replace each block's fields with appropriate details for each possible diagnosis.

Input Symptoms: ${symptoms}

Generate your answer only in this JSON format.`;

        console.log("Symptoms being analyzed:", symptoms);
        console.log("Sending prompt to Gemini...");
        
        const result = await model.generateContent(prompt);
        const response = result.response;
        const text = response.text();

        console.log("Response from Gemini:", text);

        // Extract and parse JSON from the response
        try {
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const jsonResponse = JSON.parse(jsonMatch[0]);
                console.log("\nParsed JSON:", JSON.stringify(jsonResponse, null, 2));
                
                // Return formatted response for React app
                return formatForReactApp(jsonResponse, symptoms);
            } else {
                console.log("No JSON found in response");
                throw new Error("No valid JSON found in Gemini response");
            }
        } catch (parseError) {
            console.error("Error parsing JSON:", parseError);
            console.log("Raw response:", text);
            throw new Error(`JSON parsing failed: ${parseError.message}`);
        }

    } catch (error) {
        console.error("Gemini API Error:", error);
        throw error;
    }
}

// Helper function to format the Gemini response for React app structure
function formatForReactApp(geminiResponse, originalSymptoms) {
    if (!geminiResponse || !geminiResponse.possible_diagnoses || geminiResponse.possible_diagnoses.length === 0) {
        return {
            diagnosis: "Unable to analyze symptoms",
            severity: "unknown",
            description: "Please consult a healthcare professional",
            advice: "Seek medical attention for proper diagnosis",
            originalSymptoms: originalSymptoms,
            fullGeminiResponse: geminiResponse
        };
    }

    const primaryDiagnosis = geminiResponse.possible_diagnoses[0];
    
    // Determine severity based on likelihood and diagnosis type
    let severity = "low";
    if (primaryDiagnosis.likelihood === "High") {
        severity = "medium";
        // Check for serious conditions that should be high severity
        const seriousConditions = ["heart", "cardiac", "stroke", "chest pain", "breathing", "emergency"];
        if (seriousConditions.some(condition => 
            primaryDiagnosis.diagnosis.toLowerCase().includes(condition) ||
            primaryDiagnosis.notes.toLowerCase().includes(condition)
        )) {
            severity = "high";
        }
    }

    return {
        diagnosis: primaryDiagnosis.diagnosis,
        severity: severity,
        description: primaryDiagnosis.notes,
        advice: generateAdvice(geminiResponse.possible_diagnoses),
        symptoms_list: primaryDiagnosis.symptoms,
        suggestedSpecialty: determineSuggestedSpecialty(primaryDiagnosis.diagnosis),
        originalSymptoms: originalSymptoms,
        fullGeminiResponse: geminiResponse,
        allDiagnoses: geminiResponse.possible_diagnoses,
        disclaimer: geminiResponse.disclaimer
    };
}

// Helper function to generate consolidated advice
function generateAdvice(diagnoses) {
    const highLikelihood = diagnoses.filter(d => d.likelihood === "High");
    const moderateLikelihood = diagnoses.filter(d => d.likelihood === "Moderate");

    if (highLikelihood.length > 0) {
        return `Primary concern: ${highLikelihood[0].notes} Consider consulting a healthcare professional for proper evaluation.`;
    } else if (moderateLikelihood.length > 0) {
        return `Possible conditions to monitor: ${moderateLikelihood[0].notes} If symptoms persist or worsen, seek medical attention.`;
    } else {
        return "Monitor symptoms and consult a healthcare professional if they persist or worsen.";
    }
}

// Helper function to determine specialty based on diagnosis
function determineSuggestedSpecialty(diagnosis) {
    const specialty_map = {
        "heart": "Cardiology",
        "cardiac": "Cardiology",
        "chest": "Cardiology",
        "lung": "Pulmonology",
        "respiratory": "Pulmonology",
        "breathing": "Pulmonology",
        "bone": "Orthopedics",
        "joint": "Orthopedics",
        "muscle": "Orthopedics",
        "skin": "Dermatology",
        "eye": "Ophthalmology",
        "ear": "ENT",
        "throat": "ENT",
        "stomach": "Gastroenterology",
        "digestive": "Gastroenterology",
        "mental": "Psychiatry",
        "anxiety": "Psychiatry",
        "depression": "Psychiatry",
        "neurolog": "Neurology",
        "headache": "Neurology",
        "migraine": "Neurology"
    };

    const diagnosisLower = diagnosis.toLowerCase();
    for (const [keyword, specialty] of Object.entries(specialty_map)) {
        if (diagnosisLower.includes(keyword)) {
            return specialty;
        }
    }
    
    return "General Practice";
}

// Routes
app.get('/', (req, res) => {
    res.json({ message: 'Health Assistant API is running!' });
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Main endpoint to analyze symptoms
app.post('/analyze-symptoms', async (req, res) => {
    try {
        const { symptoms } = req.body;
        
        if (!symptoms || typeof symptoms !== 'string' || symptoms.trim().length === 0) {
            return res.status(400).json({
                error: 'Invalid input',
                message: 'Please provide symptoms as a non-empty string'
            });
        }

        console.log(`\n=== New Analysis Request ===`);
        console.log(`Timestamp: ${new Date().toISOString()}`);
        console.log(`Symptoms: "${symptoms}"`);

        const result = await analyzeSymptoms(symptoms.trim());
        
        console.log(`Analysis completed successfully`);
        res.json({
            success: true,
            data: result,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Error in /analyze-symptoms:', error);
        res.status(500).json({
            success: false,
            error: 'Analysis failed',
            message: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// Test endpoint
app.post('/test', async (req, res) => {
    try {
        const testSymptoms = "I have overthinking problems, anxiety, and feel very low sometimes.";
        const result = await analyzeSymptoms(testSymptoms);
        
        res.json({
            success: true,
            message: 'Test completed successfully',
            testInput: testSymptoms,
            data: result,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Test endpoint error:', error);
        res.status(500).json({
            success: false,
            error: 'Test failed',
            message: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// Error handling middleware
app.use((error, req, res, next) => {
    console.error('Unhandled error:', error);
    res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error.message
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`\n🚀 Health Assistant Backend Server`);
    console.log(`📡 Server running on http://localhost:${PORT}`);
    console.log(`🔗 Test endpoint: http://localhost:${PORT}/test`);
    console.log(`💊 Analyze endpoint: POST http://localhost:${PORT}/analyze-symptoms`);
    console.log(`📋 Health check: http://localhost:${PORT}/health`);
    console.log(`⏰ Started at: ${new Date().toISOString()}\n`);
});

module.exports = app;
