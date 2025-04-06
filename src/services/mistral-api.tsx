// callMistralSmall31API.ts

const MISTRAL_API_KEY = "dwxF6UKe8ATf954Pdws6kXzphxKjFil4"; // Hardcode your API key here

/**
 * Calls the Mistral API using the Mistral Small 3.1 model.
 * @param prompt - The prompt or text to be processed by the model.
 * @returns The generated response from the model.
 */


export async function callMistral(prompt: string): Promise<string> {
  // Minimal body
  const requestBody = {
    model: "mistral-small-latest",
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
    temperature: 0.3,
    max_tokens: 1024,
  };

  const response = await fetch("https://api.mistral.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${MISTRAL_API_KEY}`,
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    // Log extra info to see if the server returns a hint
    const errorText = await response.text();
    throw new Error(`Mistral API call failed (status ${response.status}): ${errorText}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content?.trim() || "";
}