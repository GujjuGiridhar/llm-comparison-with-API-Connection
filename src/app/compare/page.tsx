// src/app/compare/page.tsx
"use client";

import * as React from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { BarChart, FileText, CheckSquare, Paintbrush, Combine, FlaskConical, RefreshCw } from "lucide-react";
import type { Connection } from "@/app/settings/page"; // Import Connection type
import { ComparisonSetup } from "@/components/comparison-setup"; // Import the new setup component
import { useToast } from "@/hooks/use-toast";

// Mock data structure for performance results (replace with actual data later)
type PerformanceResult = {
  connectionId: string;
  connectionName: string;
  responseTime: number; // in ms
  tokensPerSecond: number;
  output: string;
  rating?: { rating: number; explanation: string }; // Optional AI rating
};

export default function ComparePage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = React.useState(false);
  const [showResults, setShowResults] = React.useState(false);
  const [results, setResults] = React.useState<PerformanceResult[]>([]); // State to hold comparison results

  // Fetch connections from localStorage (similar to settings page)
  const [connections, setConnections] = React.useState<Connection[]>([]);
  React.useEffect(() => {
    const savedConnections = localStorage.getItem('llm_connections');
    if (savedConnections) {
      try {
        const parsedConnections = JSON.parse(savedConnections) as Connection[];
        setConnections(parsedConnections.filter(conn => conn.isActive)); // Only use active connections
      } catch (error) {
        console.error("Failed to parse connections from localStorage", error);
        setConnections([]);
      }
    } else {
        // Add mock data if local storage is empty
        const mockConnections: Connection[] = [
            {
                id: 'mock-ollama-1',
                type: 'ollama',
                connectionName: "Local Llama",
                baseUrl: "http://localhost:11434",
                model: "llama3:latest",
                contextSize: 4096,
                threads: "auto",
                temperature: 0.7,
                maxTokens: 2048,
                isActive: true,
            },
             {
                id: 'mock-ollama-2',
                type: 'ollama',
                connectionName: "Local Mistral",
                baseUrl: "http://localhost:11434",
                model: "mistral:latest",
                contextSize: 8192,
                threads: "auto",
                temperature: 0.6,
                maxTokens: 4096,
                isActive: true,
            }
        ];
        setConnections(mockConnections.filter(conn => conn.isActive));
        // Optionally save mocks to localStorage for next load
        // localStorage.setItem('llm_connections', JSON.stringify(mockConnections));
    }
  }, []);


  React.useEffect(() => {
    document.title = "Model Comparison | LLM Comparo";
    const descriptionMeta = document.querySelector('meta[name="description"]');
    if (descriptionMeta) {
      descriptionMeta.setAttribute(
        "content",
        "Compare LLM responses and performance side-by-side."
      );
    }
  }, []);


  const handleCompareSubmit = async (data: { prompt: string; selectedConnectionIds: string[] }) => {
    console.log("Comparison submitted:", data);
    if (data.selectedConnectionIds.length === 0) {
        toast({
            title: "No Models Selected",
            description: "Please select at least one model connection to compare.",
            variant: "destructive",
        });
        return;
    }
     if (!data.prompt.trim()) {
        toast({
            title: "Prompt is Empty",
            description: "Please enter a prompt to start the comparison.",
            variant: "destructive",
        });
        return;
    }

    setIsLoading(true);
    setShowResults(true); // Show the performance metrics area immediately with loading state
    setResults([]); // Clear previous results

    // Simulate API calls and AI rating for selected models
    try {
      // In a real app, you'd map over selectedConnectionIds and make API calls
      // For now, generate mock results based on selected IDs and the prompt
      const mockResults: PerformanceResult[] = data.selectedConnectionIds.map(id => {
          const conn = connections.find(c => c.id === id);
          const name = conn?.connectionName || `Model ${id.substring(0, 5)}`;
          const randomTime = 500 + Math.random() * 2500; // 0.5s to 3s
          const randomTokens = 10 + Math.random() * 40; // 10 to 50 tokens/sec
          return {
              connectionId: id,
              connectionName: name,
              responseTime: Math.round(randomTime),
              tokensPerSecond: parseFloat(randomTokens.toFixed(1)),
              output: `Mock response from ${name} for prompt: "${data.prompt}". Responded in ${Math.round(randomTime)}ms.`,
              // Simulate optional rating
              rating: Math.random() > 0.3 ? {
                  rating: parseFloat((5 + Math.random() * 5).toFixed(1)), // 5.0 to 10.0
                  explanation: `AI explanation for ${name}'s rating.`,
              } : undefined,
          };
      });

      // Simulate delay for fetching all results
      await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 1000));

      setResults(mockResults);

    } catch (error) {
        console.error("Comparison failed:", error);
        toast({
            title: "Comparison Failed",
            description: "An error occurred while fetching model responses. Please try again.",
            variant: "destructive",
        });
        setShowResults(false); // Hide results section on error
    } finally {
        setIsLoading(false);
    }
  };


  // Placeholder functions for toolbar buttons
  const handleLogsClick = () => toast({ title: "Action: Show Logs" });
  const handleVerifyClick = () => toast({ title: "Action: Verify" });
  const handlePaintClick = () => toast({ title: "Action: Paint" });
  const handleTogetherApiClick = () => toast({ title: "Action: Together API" });
  const handleApiTestClick = () => toast({ title: "Action: API Test" });
  const handleRefreshClick = () => {
    toast({ title: "Action: Refresh" });
    // Potentially re-run the last comparison or clear state
    setShowResults(false);
    setResults([]);
  };

  return (
    <main className="container mx-auto px-4 py-8 md:py-12">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 md:mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4 md:mb-0">
          Model Comparison
        </h1>
         {/* Toolbar */}
         <div className="flex items-center space-x-2 border border-border rounded-md p-1 bg-card">
             <Button variant="ghost" size="sm" onClick={handleLogsClick} aria-label="Show Logs">
                <FileText className="h-4 w-4" />
             </Button>
             <Button variant="ghost" size="sm" onClick={handleVerifyClick} aria-label="Verify">
                 <CheckSquare className="h-4 w-4" />
             </Button>
             <Button variant="ghost" size="sm" onClick={handlePaintClick} aria-label="Paint">
                <Paintbrush className="h-4 w-4" />
             </Button>
             <Separator orientation="vertical" className="h-6" />
             <Button variant="ghost" size="sm" onClick={handleTogetherApiClick}>
                 <Combine className="h-4 w-4 mr-1" /> {/* Using Combine for Together API */}
                 Together API
             </Button>
             <Button variant="ghost" size="sm" onClick={handleApiTestClick}>
                 <FlaskConical className="h-4 w-4 mr-1" />
                 API Test
             </Button>
             <Separator orientation="vertical" className="h-6" />
             <Button variant="ghost" size="sm" onClick={handleRefreshClick}>
                 <RefreshCw className="h-4 w-4 mr-1" />
                 Refresh
             </Button>
          </div>
      </header>

      {/* Setup Section (Prompt and Model Selection) */}
      <ComparisonSetup
        connections={connections}
        onSubmit={handleCompareSubmit}
        isLoading={isLoading}
      />

       {/* Separator */}
       {showResults && <Separator className="my-8 md:my-12" />}

      {/* Performance Metrics Section */}
      {showResults && (
        <Card className="shadow-lg border-border">
          <CardHeader>
            <CardTitle>Performance Metrics</CardTitle>
            <CardDescription>
              Visualizing model performance and responses.
            </CardDescription>
          </CardHeader>
          <CardContent className="min-h-[200px] flex items-center justify-center">
            {isLoading && results.length === 0 ? (
              <div className="flex flex-col items-center text-center text-muted-foreground">
                <svg className="animate-spin h-8 w-8 mb-4 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <p>Generating responses and analyzing performance...</p>
              </div>
            ) : !isLoading && results.length === 0 ? (
              <div className="flex flex-col items-center text-center text-muted-foreground">
                <BarChart className="h-12 w-12 mb-4" />
                <h3 className="text-lg font-semibold mb-1">No Performance Data</h3>
                <p>Run a comparison to see performance metrics visualized here.</p>
              </div>
            ) : (
               // TODO: Render actual comparison results and charts here
               <div className="w-full space-y-4">
                   <p className="text-center text-muted-foreground">Comparison results will be displayed here.</p>
                   {/* Example of showing results (replace with actual components/charts) */}
                   {results.map(res => (
                       <div key={res.connectionId} className="p-4 border rounded-md bg-card/50">
                           <h4 className="font-semibold">{res.connectionName}</h4>
                           <p className="text-sm text-muted-foreground">Response Time: {res.responseTime}ms | Speed: {res.tokensPerSecond} t/s</p>
                           <p className="mt-2 text-sm prose prose-sm max-w-none prose-invert">{res.output}</p>
                           {res.rating && (
                               <div className="mt-2 text-xs italic text-muted-foreground">
                                   AI Rating: {res.rating.rating}/10 - {res.rating.explanation}
                               </div>
                           )}
                       </div>
                   ))}
               </div>
            )}
          </CardContent>
        </Card>
      )}
    </main>
  );
}
