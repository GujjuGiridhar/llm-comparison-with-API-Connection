// src/components/api-request-tester-dialog.tsx
"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Copy, Send, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type ApiRequestTesterDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  defaultBaseUrl?: string;
  defaultModelName?: string;
};

// Simplified Ollama API endpoint structure (adjust based on actual API)
interface OllamaGenerateRequest {
    model: string;
    prompt: string;
    stream?: boolean;
    // Add other Ollama specific options like temperature, max_tokens etc. if needed
    options?: {
        temperature?: number;
        num_predict?: number; // Corresponds to max_tokens
    };
}

interface OllamaGenerateResponse {
    model: string;
    created_at: string;
    response: string;
    done: boolean;
    context?: number[]; // Context is usually returned for follow-up requests
    total_duration?: number;
    load_duration?: number;
    prompt_eval_count?: number;
    prompt_eval_duration?: number;
    eval_count?: number; // Completion tokens
    eval_duration?: number; // Processing time for completion
    // Added field for potential errors from Ollama
    error?: string;
}

// Request structure for the Next.js proxy route
interface ProxyRequest {
    baseUrl: string;
    requestBody: OllamaGenerateRequest;
}


export function ApiRequestTesterDialog({
  isOpen,
  onClose,
  defaultBaseUrl = "http://localhost:11434",
  defaultModelName = "llama3", // Updated default model
}: ApiRequestTesterDialogProps) {
  const { toast } = useToast();
  const [baseUrl, setBaseUrl] = React.useState(defaultBaseUrl);
  const [modelName, setModelName] = React.useState(defaultModelName);
  const [prompt, setPrompt] = React.useState("Write a short story about a friendly robot."); // Updated default prompt
  const [temperature, setTemperature] = React.useState(0.7);
  const [maxTokens, setMaxTokens] = React.useState(2048);
  const [curlCommand, setCurlCommand] = React.useState("");
  const [apiResponse, setApiResponse] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  // Construct cURL command for Ollama API
  React.useEffect(() => {
    const requestBody: OllamaGenerateRequest = {
        model: modelName,
        prompt: prompt,
        stream: false, // Assuming non-streaming for simple testing
        options: {
            temperature: temperature,
            num_predict: maxTokens
        }
    };

    // Escape single quotes in the JSON string for the curl command
    const escapedData = JSON.stringify(requestBody).replace(/'/g, "'\\''");

    const newCurlCommand = `curl -X POST ${baseUrl}/api/generate \\\n` +
      `     -H 'Content-Type: application/json' \\\n` +
      `     -d '${escapedData}'`;
    setCurlCommand(newCurlCommand);
  }, [baseUrl, modelName, prompt, temperature, maxTokens]);

  const handleTestApi = async () => {
    setLoading(true);
    setApiResponse("Loading..."); // Indicate loading in response area
    try {
        const ollamaRequestBody: OllamaGenerateRequest = {
            model: modelName,
            prompt: prompt,
            stream: false,
            options: {
                temperature: temperature,
                num_predict: maxTokens,
            },
        };

        const proxyRequestData: ProxyRequest = {
            baseUrl: baseUrl,
            requestBody: ollamaRequestBody,
        };

      // Use the Next.js proxy route
      const response = await fetch(`/api/proxy/ollama/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(proxyRequestData),
      });

      const data = await response.json(); // Response from the proxy
      setApiResponse(JSON.stringify(data, null, 2));

      // Check the status from the proxy's response
      if (!response.ok || data.error) {
         const errorMessage = data.error || `Proxy request failed with status: ${response.status}`;
        throw new Error(errorMessage);
      }

      toast({
        title: "API Test Successful",
        description: "Response received. Check the Response tab.",
      });
    } catch (error: any) {
      console.error("API test error:", error);
      // Display the error message received from the proxy or fetch failure
      setApiResponse(`Error: ${error.message}`);
      toast({
        title: "API Test Failed",
        description: `Error: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCurlCommand = () => {
    navigator.clipboard.writeText(curlCommand);
    toast({
      title: "cURL Command Copied",
      description: "cURL command copied to clipboard.",
    });
  };

   // Placeholder function for Download Postman Collection
   const handleDownloadPostman = () => {
     toast({
       title: "Not Implemented",
       description: "Downloading Postman collection is not yet available.",
     });
   };


  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="p-4 border-b border-border">
          <DialogTitle className="text-lg">API Request Tester</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="request" className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="grid w-full grid-cols-2 flex-shrink-0">
            <TabsTrigger value="request">Request Builder</TabsTrigger>
            <TabsTrigger value="response">Response</TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <TabsContent value="request" className="space-y-4 m-0"> {/* Removed default margin */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div>
                        <Label htmlFor="base-url-tester">Base URL</Label>
                        <Input
                        id="base-url-tester"
                        value={baseUrl}
                        onChange={(e) => setBaseUrl(e.target.value)}
                        placeholder="http://localhost:11434"
                        />
                    </div>
                     <div>
                        <Label htmlFor="model-name-tester">Model Name</Label>
                        <Input
                        id="model-name-tester"
                        value={modelName}
                        onChange={(e) => setModelName(e.target.value)}
                        placeholder="llama3"
                        />
                    </div>
                </div>

              <div>
                <Label htmlFor="prompt-tester">Prompt</Label>
                <Textarea
                  id="prompt-tester"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Write a short story"
                  className="min-h-[100px]"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div>
                    <Label htmlFor="temperature-tester">Temperature</Label>
                    <Input
                    id="temperature-tester"
                    type="number"
                    step="0.1"
                    min="0"
                    max="2" // Allow higher temps
                    value={temperature}
                    onChange={(e) => setTemperature(Number(e.target.value))}
                    placeholder="0.7"
                    />
                </div>
                 <div>
                    <Label htmlFor="max-tokens-tester">Max Tokens (num_predict)</Label>
                    <Input
                    id="max-tokens-tester"
                    type="number"
                    step="1"
                    min="1"
                    value={maxTokens}
                    onChange={(e) => setMaxTokens(Number(e.target.value))}
                    placeholder="2048"
                    />
                </div>
              </div>

              <div>
                <Label>Example cURL Command (Direct to Ollama)</Label>
                <div className="relative">
                  <Textarea
                    readOnly
                    value={curlCommand}
                    className="bg-muted/50 text-xs rounded-md resize-none font-mono"
                    rows={6} // Adjusted rows
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-2 h-7 w-7 opacity-70 hover:opacity-100"
                    onClick={handleCopyCurlCommand}
                    aria-label="Copy cURL command"
                  >
                    <Copy className="h-4 w-4" />
                    <span className="sr-only">Copy cURL command</span>
                  </Button>
                </div>
                 <p className="text-xs text-muted-foreground mt-1">Note: This cURL command interacts directly with the Ollama API. The 'Test API' button uses a server proxy.</p>
              </div>
               {/* Button for Postman Collection */}
               <Button variant="link" size="sm" onClick={handleDownloadPostman} className="p-0 h-auto text-primary hover:underline">
                 <Download className="h-3 w-3 mr-1"/>Download Postman Collection
               </Button>
            </TabsContent>

            <TabsContent value="response" className="m-0"> {/* Removed default margin */}
              <Label>API Response</Label>
              <Textarea
                readOnly
                value={apiResponse}
                className="bg-muted/50 text-sm rounded-md resize-none min-h-[300px] font-mono" // Increased min-height
                placeholder="API response will be displayed here after testing"
              />
            </TabsContent>
          </div>

          <DialogFooter className="p-4 border-t border-border flex-shrink-0">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            <Button
              className="bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={handleTestApi}
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center">
                 <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-primary-foreground" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Testing...
                </div>
              ) : (
                <>
                  Test API <Send className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </DialogFooter>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
