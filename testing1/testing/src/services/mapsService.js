const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export const getMapsApiKey = async () => {
  try {
    const response = await fetch(`${API_URL}/maps/key`);
    if (!response.ok) {
      throw new Error('Failed to fetch Maps API key');
    }
    const data = await response.json();
    return data.apiKey;
  } catch (error) {
    console.error('Error fetching Maps API key:', error);
    throw error;
  }
};