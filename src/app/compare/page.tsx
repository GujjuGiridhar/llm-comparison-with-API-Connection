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
import { FileText, CheckSquare, Paintbrush, Combine, FlaskConical, RefreshCw, BarChart } from "lucide-react";
import type { Connection } from "@/app/settings/page";
import { ComparisonSetup } from "@/components/comparison-setup";
import { PerformanceChart } from "@/components/performance-chart"; // Import the chart component
import { ResultCard } from "@/components/result-card"; // Import the result card component
import type { PerformanceResult } from "@/types/compare"; // Import shared type
import { useToast } from "@/hooks/use-toast";

export default function ComparePage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = React.useState(false);
  const [showResults, setShowResults] = React.useState(false);
  const [results, setResults] = React.useState<PerformanceResult[]>([]);
  const [connections, setConnections] = React.useState<Connection[]>([]);

  React.useEffect(() => {
    const savedConnections = localStorage.getItem('llm_connections');
    let activeConnections: Connection[] = [];
    if (savedConnections) {
      try {
        const parsedConnections = JSON.parse(savedConnections) as Connection[];
        activeConnections = parsedConnections.filter(conn => conn.isActive);
      } catch (error) {
        console.error("Failed to parse connections from localStorage", error);
      }
    }

    if (activeConnections.length === 0) {
        // Add mock data if local storage is empty or no active connections
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
            },
             {
                id: 'mock-api-1',
                type: 'api',
                providerName: 'openai', // Ensure this matches a key in supportedProviders
                connectionName: "OpenAI GPT-4o",
                apiKey: "mock-key", // Use placeholder
                apiUrl: "", // OpenAI doesn't need URL
                model: "gpt-4o",
                temperature: 0.7,
                maxTokens: 1024,
                isActive: true,
            }
        ];
        activeConnections = mockConnections.filter(conn => conn.isActive);
        // Optionally save mocks to localStorage for next load
        // localStorage.setItem('llm_connections', JSON.stringify(mockConnections));
    }
     setConnections(activeConnections);

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
    setShowResults(true);
    setResults([]); // Clear previous results, but keep showing the section

    // Simulate API calls and AI rating for selected models
    try {
      // Generate mock results immediately for loading state
      const loadingResults: PerformanceResult[] = data.selectedConnectionIds.map(id => {
          const conn = connections.find(c => c.id === id);
          return {
              connectionId: id,
              connectionName: conn?.connectionName || `Model ${id.substring(0, 5)}`,
              // Initial empty/loading values
              processingTime: 0,
              responseTime: 0,
              tokensPerSecond: 0,
              totalTokens: 0,
              promptTokens: 0,
              completionTokens: 0,
              elapsedTime: 0,
              output: "...", // Placeholder for loading output
              status: 'running' as 'running',
          };
      });
       setResults(loadingResults); // Show loading cards

      // In a real app, you'd map over selectedConnectionIds and make API calls concurrently
      // For now, simulate fetching results one by one with delays

      const fetchedResults: PerformanceResult[] = [];
      for (const id of data.selectedConnectionIds) {
        const conn = connections.find(c => c.id === id);
        const name = conn?.connectionName || `Model ${id.substring(0, 5)}`;

        // Simulate API call delay
        const delay = 500 + Math.random() * 2500; // 0.5s to 3s
        await new Promise(resolve => setTimeout(resolve, delay));

        // Generate mock performance data
        const processingTime = parseFloat((delay / 1000).toFixed(2)); // In seconds
        const responseTime = processingTime; // Simplified for mock
        const completionTokens = 5 + Math.floor(Math.random() * 500);
        const promptTokens = data.prompt.split(/\s+/).length; // Rough estimate
        const totalTokens = promptTokens + completionTokens;
        const tokensPerSecond = parseFloat((completionTokens / processingTime).toFixed(1)) || 0;
        const elapsedTime = processingTime; // Simplified

         const mockOutput = `Mock response from ${name} for prompt: "${data.prompt}".\n\nGenerated ${completionTokens} tokens in ${processingTime}s. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. ${Math.random() > 0.5 ? 'Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.' : ''}`;

        const result: PerformanceResult = {
          connectionId: id,
          connectionName: name,
          processingTime: processingTime,
          responseTime: responseTime,
          tokensPerSecond: tokensPerSecond,
          totalTokens: totalTokens,
          promptTokens: promptTokens,
          completionTokens: completionTokens,
          elapsedTime: elapsedTime,
          output: mockOutput,
          status: 'complete' as 'complete',
          // Simulate optional AI rating (less frequent)
          rating: Math.random() > 0.7 ? {
            rating: parseFloat((5 + Math.random() * 5).toFixed(1)), // 5.0 to 10.0
            explanation: `AI explanation for ${name}'s rating. It performed adequately.`,
          } : undefined,
        };

        fetchedResults.push(result);

        // Update state incrementally to show results as they arrive
        setResults(currentResults => {
            return currentResults.map(r => r.connectionId === id ? result : r);
        });
      }


    } catch (error) {
        console.error("Comparison failed:", error);
        toast({
            title: "Comparison Failed",
            description: "An error occurred while fetching model responses. Please try again.",
            variant: "destructive",
        });
         setResults(prevResults => prevResults.map(r => ({ ...r, status: 'error' }))); // Mark failed ones as error
    } finally {
        setIsLoading(false);
         // Ensure all final results have 'complete' or 'error' status
         setResults(currentResults => currentResults.map(r => ({
             ...r,
             status: r.status === 'running' ? 'error' : r.status // Mark unfinished as error
         })));
    }
  };


  // Placeholder functions for toolbar buttons
  const handleLogsClick = () => toast({ title: "Action: Show Logs (Not Implemented)" });
  const handleVerifyClick = () => toast({ title: "Action: Verify (Not Implemented)" });
  const handlePaintClick = () => toast({ title: "Action: Paint (Not Implemented)" });
  const handleTogetherApiClick = () => toast({ title: "Action: Together API (Not Implemented)" });
  const handleApiTestClick = () => toast({ title: "Action: API Test (Not Implemented)" });
  const handleRefreshClick = () => {
    toast({ title: "Action: Refresh" });
    // Re-run last comparison or clear state (clearing for now)
    setShowResults(false);
    setResults([]);
    // Consider keeping the prompt and selected models?
  };

  return (
    <main className="container mx-auto px-4 py-8 md:py-12">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 md:mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4 md:mb-0">
          Model Comparison
        </h1>
         {/* Toolbar */}
         <div className="flex items-center space-x-2 border border-border rounded-md p-1 bg-card/80 backdrop-blur-sm">
             {/* Removed Paintbrush and FileText as per image */}
             <Button variant="ghost" size="sm" onClick={handleVerifyClick} aria-label="Verify">
                 <CheckSquare className="h-4 w-4" /> Verify
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

       {/* Responses Section - Render Result Cards */}
       {showResults && results.length > 0 && (
          <>
            <Separator className="my-8 md:my-12" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {results.map(res => (
                <ResultCard key={res.connectionId} result={res} isLoading={isLoading && res.status === 'running'} />
              ))}
            </div>
          </>
       )}


       {/* Separator */}
       {showResults && <Separator className="my-8 md:my-12" />}

      {/* Performance Metrics Section - Render Chart */}
      {showResults && (
          <PerformanceChart results={results.filter(r => r.status === 'complete')} isLoading={isLoading} />
      )}

       {/* Placeholder when no results are shown yet */}
      {!showResults && (
         <Card className="mt-8 md:mt-12 shadow-lg border-border bg-card/50">
             <CardHeader>
                 <CardTitle>Performance Metrics</CardTitle>
                 <CardDescription>Visualizing model performance and responses.</CardDescription>
             </CardHeader>
             <CardContent className="min-h-[200px] flex flex-col items-center justify-center text-center text-muted-foreground">
                 <BarChart className="h-12 w-12 mb-4" />
                 <h3 className="text-lg font-semibold mb-1">Ready to Compare</h3>
                 <p>Enter a prompt, select models, and click "Compare Models" to see results and performance metrics.</p>
             </CardContent>
         </Card>
      )}
    </main>
  );
}
