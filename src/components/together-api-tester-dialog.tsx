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
import { Copy, Send } from "lucide-react"; // Added Send icon
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
    setLoading(true);
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

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API request failed: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      setApiResponse(JSON.stringify(data, null, 2));

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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="p-4 border-b border-border">
          <DialogTitle className="text-lg">Together API Tester</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="request" className="flex-1 flex flex-col">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="request">Request Builder</TabsTrigger>
            <TabsTrigger value="response">Response</TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-auto p-4">
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
                <div className="flex items-center">
                  <Input
                    id="api-key"
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="Enter your Together API key"
                  />
                   {/* Placeholder for "Get Key" functionality - adapt as needed */}
                  <Button variant="outline" size="sm" className="ml-2">Get Key</Button>
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
                <Label>cURL Command</Label>
                <div className="relative">
                  <Textarea
                    readOnly
                    value={curlCommand}
                    className="bg-muted/50 text-xs rounded-md resize-none"
                    rows={4}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-2 h-7 w-7 opacity-70 hover:opacity-100"
                    onClick={handleCopyCurlCommand}
                  >
                    <Copy className="h-4 w-4" />
                    <span className="sr-only">Copy cURL command</span>
                  </Button>
                </div>
              </div>
               {/* Placeholder for Postman Collection download - adapt as needed */}
               <Button variant="link" size="sm">Download Postman Collection</Button>
            </TabsContent>

            <TabsContent value="response">
              <Textarea
                readOnly
                value={apiResponse}
                className="bg-muted/50 text-sm rounded-md resize-none min-h-[200px]"
                placeholder="API response will be displayed here"
              />
            </TabsContent>
          </div>

          <DialogFooter className="p-4 border-t border-border">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            <Button
              className="bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={handleTestApi}
              disabled={loading}
            >
              {loading ? (
                <>
                  Testing...
                </>
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
