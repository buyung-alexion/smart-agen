import type { Lead } from '../types';

export const searchLeads = async (category: string, location: string, depth: string, apiKey?: string): Promise<Lead[]> => {
  const finalKey = apiKey || import.meta.env.VITE_SERPER_API_KEY;

  if (!finalKey) {
    console.error('Serper API Key missing');
    return [];
  }

  // Map depth to number of results
  let numResults = 20;
  if (depth === 'deep') numResults = 50;
  if (depth === 'ultra') numResults = 100;

  console.log(`[SearchService] Fetching ${numResults} leads for ${category} in ${location}...`);

  try {
    const response = await fetch('https://google.serper.dev/places', {
      method: 'POST',
      headers: {
        'X-API-KEY': finalKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        q: `${category}`,
        location: location,
        num: Number(numResults),
        gl: 'id', // Indonesia
        hl: 'id'  // Indonesian language
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `API Error: ${response.status}`);
    }

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
