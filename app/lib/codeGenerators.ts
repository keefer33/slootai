import type { UserModel } from '../pages/agents/types'

export const generateOpenaiCodeSample = (model: UserModel) => {
  const baseUrl = 'https://sloot.ai'
  const endpoint = `${baseUrl}/api/openai`

  return `// Sample OpenAI API call for ${model.name}
// Replace with your actual API key and adjust the request as needed

const apiKey = "${model.api_key || 'your-api-key-here'}";
const endpoint = "${endpoint}";

// Example OpenAI request payload
const openaiPayload = {
  "model_id": "${model.id}",
  "input": [
    {
      "role": "user",
      "content": "Hello, how are you?"
    }
  ],
  "previous_response_id": ""
};

// Make OpenAI API call
async function callOpenAIAgent() {
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': \`Bearer \${apiKey}\`
      },
      body: JSON.stringify(openaiPayload)
    });

    if (!response.ok) {
      throw new Error(\`HTTP error! status: \${response.status}\`);
    }

    const data = await response.json();
    ('OpenAI Response:', data);
    return data;
  } catch (error) {
    console.error('Error calling OpenAI agent:', error);
  }
}

// For streaming responses (OpenAI)
async function callOpenAIStream() {
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': \`Bearer \${apiKey}\`
      },
      body: JSON.stringify({
        ...openaiPayload,
        stream: true
      })
    });

    if (!response.ok) {
      throw new Error(\`HTTP error! status: \${response.status}\`);
    }

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    while (reader) {
      const { done, value } = await reader.read();
      if (done) break;
      
      const chunk = decoder.decode(value);
      ('OpenAI Stream chunk:', chunk);
    }
  } catch (error) {
    console.error('Error calling OpenAI stream:', error);
  }
}

// Call the function
callOpenAIAgent();
// callOpenAIStream();`
}

export const generateAnthropicCodeSample = (model: UserModel) => {
  const baseUrl = 'https://sloot.ai'
  const endpoint = `${baseUrl}/api/anthropic`

  return `// Sample Anthropic API call for ${model.name}
// Replace with your actual API key and adjust the request as needed

const apiKey = "${model.api_key || 'your-api-key-here'}";
const endpoint = "${endpoint}";

// Example Anthropic request payload
const anthropicPayload = {
  "model_id": "${model.id}",
  "messages": [
    {
      "role": "user",
      "content": "Hello, how are you?"
    }
  ]
};

// Make Anthropic API call
async function callAnthropicAgent() {
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': \`Bearer \${apiKey}\`
      },
      body: JSON.stringify(anthropicPayload)
    });

    if (!response.ok) {
      throw new Error(\`HTTP error! status: \${response.status}\`);
    }

    const data = await response.json();
    ('Anthropic Response:', data);
    return data;
  } catch (error) {
    console.error('Error calling Anthropic agent:', error);
  }
}

// For streaming responses (Anthropic)
async function callAnthropicStream() {
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': \`Bearer \${apiKey}\`
      },
      body: JSON.stringify({
        ...anthropicPayload,
        stream: true
      })
    });

    if (!response.ok) {
      throw new Error(\`HTTP error! status: \${response.status}\`);
    }

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    while (reader) {
      const { done, value } = await reader.read();
      if (done) break;
      
      const chunk = decoder.decode(value);
      ('Anthropic Stream chunk:', chunk);
    }
  } catch (error) {
    console.error('Error calling Anthropic stream:', error);
  }
}

// Call the function
callAnthropicAgent();
// callAnthropicStream();`
}
