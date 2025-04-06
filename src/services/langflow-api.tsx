import { ScanResponse } from './response-model';
import { ScanRequest } from './request-model';

const API_ENDPOINT = 'http://127.0.0.1:7860/api/v1/run/a1c9c130-e1ec-4e4f-a04b-7794c2960955';
const API_KEY = "sk-scPI6HSPmnZzn7qOlrP-i7n2pkQTjLoqgtHSACCujgA";

export async function scanText(inputValue: string, inputValueB: string = "google.com"): Promise<ScanResponse> {
  try {
    const request: ScanRequest = {
      input_value: inputValue, 
      input_value_b: inputValueB,
      output_type: "text",
      input_type: "text",
      tweaks: {
        "TextOutput-HSKzn": {},
        "TextInput-v4zeT": {},
        "Prompt-Xndyy": {},
        "MistralModel-4LAWL": {},
        "SubFlow-lQZFx": {},
        "ParseData-nPda4": {},
        "TextInput-Gravr": {},
        "TextInput-1P6QD": {}
      }
    };

    const response = await fetch(`${API_ENDPOINT}?stream=false`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        "x-api-key": API_KEY
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return { data };
  } catch (error) {
    console.error('Error calling Langflow API:', error);
    return { 
      data: {
        session_id: '',
        outputs: []
      },
      error: error instanceof Error ? error.message : 'An unknown error occurred in API call' 
    };
  }
}



    