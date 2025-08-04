const userKey = 'JvvUGT46ID0zEDE9xj2hWMvr3ZtfqdkpejcdGBH5FeK1zTt2ZpkaBWmL9eRf';
const endpointUrl = 'https://modelslab.com/api/v7/images/text-to-image';

const requestBody = {
    "key": "<API_KEY>",
    "prompt": "Create a high-resolution, realistic image of a single natural Sweet Almond — the primary source of nut (kernel) — placed on a pure white background. The element should appear fresh, clean, and organic, without any stems, packaging, or visual clutter. Use soft, diffused lighting and minimal shadows to give the image a clean, premium look",
    "model_id": "imagen-4",
    "aspect_ratio": "1:1"
  };

async function makeApiRequest() {
  try {
    const response = await fetch(endpointUrl, {
      method: 'POST',
      headers: {
        'key': userKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      let errorResult;
      try {
        errorResult = await response.json();
      } catch (e) {
        errorResult = { error: { message: await response.text() } };
      }
      throw new Error(`API Error (${response.status}): ${errorResult.error?.message || response.statusText || 'Unknown error'}`);
    }

    const result = await response.json();
    console.log('API Response:', result);
    return result;
  } catch (error) {
    console.error('Error making API request:', error.message);
    throw error;
  }
}

makeApiRequest();