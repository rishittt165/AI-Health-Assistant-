const API_BASE_URL = 'http://localhost:3001';

export async function analyzeSymptoms(symptoms) {
  try {
    console.log('Sending request to backend API...');
    const response = await fetch(`${API_BASE_URL}/analyze-symptoms`, {
      method: 'POST',
      cache: 'no-store',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ symptoms }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    if (result.success) {
      console.log('Backend response received:', result.data);
      return result.data;
    } else {
      throw new Error(result.message || 'Analysis failed');
    }
  } catch (error) {
    console.error('Error calling backend API:', error);
    throw error;
  }
}

export async function testBackendConnection() {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    const result = await response.json();
    console.log('Backend connection test:', result);
    return result;
  } catch (error) {
    console.error('Backend connection failed:', error);
    return null;
  }
}
