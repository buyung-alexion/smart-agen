import type { Lead } from '../types';

const SERPER_API_KEY = import.meta.env.VITE_SERPER_API_KEY;

export const searchLeads = async (category: string, location: string, depth: string): Promise<Lead[]> => {
  if (!SERPER_API_KEY) {
    console.error('Serper API Key missing');
    return [];
  }

  // Map depth to number of results
  let numResults = 20;
  if (depth === 'deep') numResults = 50;
  if (depth === 'ultra') numResults = 100;

  try {
    const response = await fetch('https://google.serper.dev/places', {
      method: 'POST',
      headers: {
        'X-API-KEY': SERPER_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        q: `${category} in ${location}`,
        num: numResults,
      }),
    });

    const data = await response.json();
    
    if (!data.places) return [];

    return data.places.map((place: any) => ({
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
      category: category,
      company_name: place.title || 'Unknown Business',
      address: place.address || 'No Address available',
      area_region: location,
      phone_number: place.phoneNumber || 'No phone available',
      map_location: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.title + ' ' + place.address)}`,
      rating: place.rating || 0,
      status: 'New'
    }));
  } catch (error) {
    console.error('Extraction Error:', error);
    return [];
  }
};
