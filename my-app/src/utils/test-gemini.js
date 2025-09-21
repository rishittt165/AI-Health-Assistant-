import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI('AIzaSyDIPhpvk8Rky9_29epiSQX73aJfQpLtImk');

async function testGemini() {
    try {
        // Define your symptoms variable here
        const symptoms = "I have overthinking probles, anxiety, and feel very low sometimes.";
        
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

        console.log("Response from Gemini:");
        console.log(text);

        // Extract and parse JSON from the response
        try {
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const jsonResponse = JSON.parse(jsonMatch[0]);
                console.log("\nParsed JSON:");
                console.log(JSON.stringify(jsonResponse, null, 2));
                return jsonResponse;
            } else {
                console.log("No JSON found in response");
                return null;
            }
        } catch (parseError) {
            console.error("Error parsing JSON:", parseError);
            console.log("Raw response:", text);
            return null;
        }

    } catch (error) {
        console.error("Error:", error);
        return null;
    }
}

// Alternative version that accepts symptoms as a parameter
async function analyzeSymptomsWithGemini(symptoms) {
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

        const result = await model.generateContent(prompt);
        const response = result.response;
        const text = response.text();

        // Extract and parse JSON from the response
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        } else {
            throw new Error("No valid JSON found in response");
        }

    } catch (error) {
        console.error("Error analyzing symptoms:", error);
        throw error;
    }
}

// Test the function
testGemini();

// Example of using the parameterized function:
// analyzeSymptomsWithGemini("persistent cough, chest pain, shortness of breath")
//     .then(result => console.log("Diagnosis result:", result))
//     .catch(error => console.error("Analysis failed:", error));
