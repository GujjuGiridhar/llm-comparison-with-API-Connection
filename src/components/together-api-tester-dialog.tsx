
"use client";

import * as React from "react";
import Link from 'next/link'; // Import Link
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
import { Copy, Send, ExternalLink } from "lucide-react"; // Added ExternalLink
import { useToast } from "@/hooks/use-toast";

type TogetherApiTesterDialogProps = {
  isOpen: boolean;
  onClose: () => void;
};

export function TogetherApiTesterDialog({ isOpen, onClose }: TogetherApiTesterDialogProps) {
  const { toast } = useToast();
  const [baseUrl, setBaseUrl] = React.useState("https://api.together.xyz/v1");
  const [apiKey, setApiKey] = React.useState("");
  const [modelName, setModelName] = React.useState("meta-llama/Llama-3-70b-chat-hf");
  const [curlCommand, setCurlCommand] = React.useState("");
  const [apiResponse, setApiResponse] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  // Construct cURL command
  React.useEffect(() => {
    const newCurlCommand = `curl -X POST ${baseUrl}/chat/completions \\\n` +
      `     -H 'Content-Type: application/json' \\\n` +
      `     -H 'Authorization: Bearer ${apiKey}' \\\n` +
      `     -d '{\n` +
      `          "model": "${modelName}",\n` +
      `          "messages": [{"role": "user", "content": "Hello, how are you?"}],\n` +
      `          "temperature": 0.7\n` +
      `        }'`;
    setCurlCommand(newCurlCommand);
  }, [baseUrl, apiKey, modelName]);

  const handleTestApi = async () => {
    if (!apiKey) {
      toast({
        title: "API Key Missing",
        description: "Please enter your Together API key.",
        variant: "destructive",
      });
      return;
    }
    setLoading(true);
    setApiResponse("Loading..."); // Indicate loading in response area
    try {
      const response = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: modelName,
          messages: [{ role: "user", content: "Hello, how are you?" }],
          temperature: 0.7,
        }),
      });

      const data = await response.json();
      setApiResponse(JSON.stringify(data, null, 2));


      if (!response.ok) {
         // Try to get error message from Together's response structure
         const errorDetail = data?.error?.message || data?.message || JSON.stringify(data);
        throw new Error(`API request failed: ${response.status} - ${errorDetail}`);
      }


      toast({
        title: "API Test Successful",
        description: "Response received. See the Response tab.",
      });
    } catch (error: any) {
      console.error("API test error:", error);
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
          <DialogTitle className="text-lg">Together API Tester</DialogTitle>
        </DialogHeader>

        {/* Changed to flex-1 and added overflow-hidden */}
        <Tabs defaultValue="request" className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="grid w-full grid-cols-2 flex-shrink-0"> {/* Ensure TabsList doesn't shrink */}
            <TabsTrigger value="request">Request Builder</TabsTrigger>
            <TabsTrigger value="response">Response</TabsTrigger>
          </TabsList>

          {/* Added overflow-y-auto to this div */}
          <div className="flex-1 overflow-y-auto p-4">
            <TabsContent value="request" className="space-y-4">
              <div>
                <Label htmlFor="base-url">Base URL</Label>
                <Input
                  id="base-url"
                  value={baseUrl}
                  onChange={(e) => setBaseUrl(e.target.value)}
                  placeholder="https://api.together.xyz/v1"
                />
              </div>
              <div>
                <Label htmlFor="api-key">API Key</Label>
                <div className="flex items-center space-x-2">
                  <Input
                    id="api-key"
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="Enter your Together API key"
                    className="flex-grow"
                  />
                   {/* Wrap Button in Link */}
                   <Link href="https://api.together.xyz/settings/api-keys" target="_blank" rel="noopener noreferrer" passHref legacyBehavior>
                     <Button variant="outline" size="sm" asChild>
                         <a>Get Key <ExternalLink className="ml-1 h-3 w-3" /></a>
                     </Button>
                   </Link>
                </div>
              </div>
              <div>
                <Label htmlFor="model-name">Model Name</Label>
                <Input
                  id="model-name"
                  value={modelName}
                  onChange={(e) => setModelName(e.target.value)}
                  placeholder="meta-llama/Llama-3-70b-chat-hf"
                />
              </div>
              <div>
                <Label>Example cURL Command</Label>
                <div className="relative">
                  <Textarea
                    readOnly
                    value={curlCommand}
                    className="bg-muted/50 text-xs rounded-md resize-none font-mono" // Added font-mono
                    rows={8} // Increased rows
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-2 h-7 w-7 opacity-70 hover:opacity-100"
                    onClick={handleCopyCurlCommand}
                    aria-label="Copy cURL command" // Added aria-label
                  >
                    <Copy className="h-4 w-4" />
                    <span className="sr-only">Copy cURL command</span>
                  </Button>
                </div>
              </div>
               {/* Button for Postman Collection */}
               <Button variant="link" size="sm" onClick={handleDownloadPostman} className="p-0 h-auto">Download Postman Collection</Button>
            </TabsContent>

            <TabsContent value="response">
              <Label>API Response</Label>
              <Textarea
                readOnly
                value={apiResponse}
                className="bg-muted/50 text-sm rounded-md resize-none min-h-[200px] font-mono" // Added font-mono
                placeholder="API response will be displayed here after testing"
              />
            </TabsContent>
          </div>

          <DialogFooter className="p-4 border-t border-border flex-shrink-0"> {/* Ensure Footer doesn't shrink */}
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
