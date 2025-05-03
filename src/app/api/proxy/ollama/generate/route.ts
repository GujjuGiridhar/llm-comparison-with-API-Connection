// src/app/api/proxy/ollama/generate/route.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

interface OllamaGenerateRequest {
    model: string;
    prompt: string;
    stream?: boolean;
    options?: {
        temperature?: number;
        num_predict?: number;
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
  try {
    const { baseUrl, requestBody }: ProxyRequest = await request.json();

    // Validate baseUrl
    if (!baseUrl || typeof baseUrl !== 'string' || !baseUrl.startsWith('http')) {
        return NextResponse.json({ error: 'Invalid or missing baseUrl' }, { status: 400 });
    }
     // Validate requestBody
     if (!requestBody || typeof requestBody !== 'object' || !requestBody.model || !requestBody.prompt) {
         return NextResponse.json({ error: 'Invalid or missing requestBody with model and prompt' }, { status: 400 });
     }

    const ollamaUrl = `${baseUrl}/api/generate`;

    console.log(`Proxying request to: ${ollamaUrl}`);
    console.log(`Request body: ${JSON.stringify(requestBody)}`);

    const ollamaResponse = await fetch(ollamaUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
       // Add a timeout (e.g., 60 seconds)
       signal: AbortSignal.timeout(60000),
    });

    // Check if the response status indicates an error
    if (!ollamaResponse.ok) {
       let errorBody: OllamaResponse = {};
       try {
           errorBody = await ollamaResponse.json();
       } catch (parseError) {
           console.error("Failed to parse error response body:", parseError);
           // Use status text if body parsing fails
           errorBody = { error: `Ollama API request failed with status ${ollamaResponse.status}: ${ollamaResponse.statusText}` };
       }
       console.error(`Ollama API error (${ollamaResponse.status}):`, errorBody);
       // Return the error from Ollama, include status code
       return NextResponse.json({ error: errorBody.error || `Ollama API request failed with status ${ollamaResponse.status}` }, { status: ollamaResponse.status });
    }

    // If response is OK, parse the JSON body
    const data: OllamaResponse = await ollamaResponse.json();
    console.log("Ollama API response:", data);

    // Return the successful response from Ollama
    return NextResponse.json(data, { status: 200 });

  } catch (error: any) {
    console.error("Proxy error:", error);

    // Handle fetch errors (e.g., network issues, timeout)
    let errorMessage = 'Failed to proxy request to Ollama.';
    let statusCode = 500;

     if (error.name === 'AbortError') {
        errorMessage = 'Request to Ollama timed out.';
        statusCode = 504; // Gateway Timeout
     } else if (error instanceof TypeError && error.message.includes('fetch failed')) {
         // This often indicates a network issue (e.g., server not running, DNS problem)
         errorMessage = `Network error connecting to Ollama: ${error.message}. Ensure the Ollama server is running and accessible.`;
         statusCode = 502; // Bad Gateway
     } else if (error.message) {
         errorMessage = error.message;
     }

    return NextResponse.json({ error: errorMessage }, { status: statusCode });
  }
}
