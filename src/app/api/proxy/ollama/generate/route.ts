// src/app/api/proxy/ollama/generate/route.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

interface OllamaGenerateRequest {
    model: string;
    prompt: string;
    stream?: boolean;
    options?: {
        temperature?: number;
        num_predict?: number; // Corresponds to max_tokens in Ollama API
        // Add other Ollama options if needed
    };
    // Allow any other properties Ollama might accept
    [key: string]: any;
}

interface ProxyRequest {
    baseUrl: string;
    requestBody: OllamaGenerateRequest;
}

// Define response structure from Ollama more generically
interface OllamaResponse {
    // Include expected fields, but allow others
    model?: string;
    created_at?: string;
    response?: string;
    done?: boolean;
    error?: string; // Ollama often returns errors in an 'error' field
    // Allow any other properties Ollama might return
    [key: string]: any;
}


export async function POST(request: NextRequest) {
  let ollamaUrl = ''; // Define ollamaUrl outside the try block for logging in catch
  try {
    const { baseUrl, requestBody }: ProxyRequest = await request.json();

    // Validate baseUrl
    if (!baseUrl || typeof baseUrl !== 'string' || !baseUrl.startsWith('http')) {
        console.error("Invalid baseUrl received:", baseUrl);
        return NextResponse.json({ error: 'Invalid or missing baseUrl. Must start with http:// or https://' }, { status: 400 });
    }
     // Validate requestBody
     if (!requestBody || typeof requestBody !== 'object' || !requestBody.model || !requestBody.prompt) {
        console.error("Invalid requestBody received:", requestBody);
         return NextResponse.json({ error: 'Invalid or missing requestBody. It must contain at least "model" and "prompt".' }, { status: 400 });
     }

    ollamaUrl = `${baseUrl}/api/generate`; // Construct the full URL

    // Log the target URL and body being sent
    console.log(`Proxying request TO: ${ollamaUrl}`);
    console.log(`Request body FOR Ollama: ${JSON.stringify(requestBody)}`);

    const ollamaResponse = await fetch(ollamaUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
       // Add a timeout (e.g., 60 seconds)
       signal: AbortSignal.timeout(60000),
    });

    // Check if the response status indicates an error (e.g., 4xx, 5xx)
    if (!ollamaResponse.ok) {
       let errorBody: OllamaResponse = { error: `Ollama API responded with status ${ollamaResponse.status}: ${ollamaResponse.statusText}` };
       try {
           // Try to parse the error response body from Ollama for more details
           const parsedError = await ollamaResponse.json();
           if (parsedError && parsedError.error) {
               errorBody.error = `Ollama Error (${ollamaResponse.status}): ${parsedError.error}`;
           }
           console.error(`Ollama API error response body:`, parsedError);
       } catch (parseError) {
           // If parsing fails, use the status text
           console.error("Failed to parse error response body from Ollama:", parseError);
       }
       console.error(`Ollama API request failed. Status: ${ollamaResponse.status}, URL: ${ollamaUrl}`);
       // Return the specific error from Ollama or the generic status error
       return NextResponse.json({ error: errorBody.error }, { status: ollamaResponse.status });
    }

    // If response is OK, parse the JSON body
    const data: OllamaResponse = await ollamaResponse.json();
    console.log("Successful Ollama API response received:", data);

    // Return the successful response from Ollama
    return NextResponse.json(data, { status: 200 });

  } catch (error: any) {
    // Log the full error for server-side debugging
    console.error(`Error in Ollama proxy route (Target URL: ${ollamaUrl || 'N/A - Check baseUrl input'}):`, error);

    // Handle different types of errors more specifically
    let errorMessage = 'Failed to proxy request to Ollama.';
    let statusCode = 500; // Internal Server Error (default)

     if (error.name === 'AbortError') {
        errorMessage = `Request to Ollama timed out after 60 seconds. URL: ${ollamaUrl}`;
        statusCode = 504; // Gateway Timeout
     } else if (error instanceof TypeError && error.message.includes('fetch failed')) {
         // This is the crucial network error. Provide actionable advice.
         errorMessage = `Network error: Could not connect to the Ollama server at ${ollamaUrl}. ` +
                        `Please ensure the Ollama server is running, the Base URL is correct, and the server is accessible ` +
                        `from the environment where this Next.js application is running (e.g., check firewalls, Docker networks). ` +
                        `Original error: ${error.message}`;
         statusCode = 502; // Bad Gateway - Appropriate for proxy connection failure
     } else if (error.message) {
        // Catch other generic errors
         errorMessage = `An unexpected error occurred: ${error.message}`;
     }

    // Return a structured error response
    return NextResponse.json({ error: errorMessage }, { status: statusCode });
  }
}
