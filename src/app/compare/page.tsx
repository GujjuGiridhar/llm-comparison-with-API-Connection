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
import { FileText, CheckSquare, Combine, FlaskConical, RefreshCw, BarChart, Logs } from "lucide-react";
import type { Connection } from "@/app/settings/page";
import { ComparisonSetup } from "@/components/comparison-setup";
import { PerformanceChart } from "@/components/performance-chart";
import { ResultCard } from "@/components/result-card";
import type { PerformanceResult, ComparisonLog } from "@/types/compare";
import { useToast } from "@/hooks/use-toast";
import { LogViewer } from "@/components/log-viewer";
import { MetricsVerificationDialog } from "@/components/metrics-verification-dialog"; // Import the new dialog

const LOGS_STORAGE_KEY = 'comparison_logs';
const MAX_LOGS = 20; // Limit the number of logs stored

export default function ComparePage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = React.useState(false);
  const [showResults, setShowResults] = React.useState(false);
  const [results, setResults] = React.useState<PerformanceResult[]>([]);
  const [connections, setConnections] = React.useState<Connection[]>([]);
  const [isLogViewerOpen, setIsLogViewerOpen] = React.useState(false);
  const [isVerificationOpen, setIsVerificationOpen] = React.useState(false); // State for verification dialog
  const [comparisonLogs, setComparisonLogs] = React.useState<ComparisonLog[]>([]);
  const [lastRunTimestamp, setLastRunTimestamp] = React.useState<Date | null>(null); // Track last run time

  // Load connections and logs from localStorage on mount
  React.useEffect(() => {
    // Load Connections
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

     // Load Logs
     const savedLogs = localStorage.getItem(LOGS_STORAGE_KEY);
     if (savedLogs) {
         try {
             const parsedLogs = JSON.parse(savedLogs) as ComparisonLog[];
             setComparisonLogs(parsedLogs);
         } catch (error) {
             console.error("Failed to parse logs from localStorage", error);
             localStorage.removeItem(LOGS_STORAGE_KEY); // Clear invalid data
         }
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

  // Function to save logs to localStorage
  const saveLogs = (logs: ComparisonLog[]) => {
    try {
        const logsToSave = logs.slice(-MAX_LOGS); // Keep only the latest logs
        localStorage.setItem(LOGS_STORAGE_KEY, JSON.stringify(logsToSave));
    } catch (error) {
        console.error("Failed to save logs to localStorage", error);
        toast({
            title: "Error Saving Logs",
            description: "Could not save comparison logs to local storage.",
            variant: "destructive",
        });
    }
};

 const handleCompareSubmit = async (data: { prompt: string; selectedConnectionIds: string[] }) => {
    console.log("Comparison submitted:", data);
    const startTime = performance.now(); // Start timing the whole comparison
    setLastRunTimestamp(new Date()); // Record start time
    let currentResultsState: PerformanceResult[] = []; // Variable to hold the latest results state

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

    // Generate initial loading state for all selected models
    const initialLoadingResults: PerformanceResult[] = data.selectedConnectionIds.map(id => {
        const conn = connections.find(c => c.id === id);
        return {
            connectionId: id,
            connectionName: conn?.connectionName || `Model ${id.substring(0, 5)}`,
            modelName: conn?.model || 'unknown',
            status: 'running' as 'running',
            // Initialize other fields as needed or leave undefined
            processingTime: undefined,
            responseTime: undefined,
            tokensPerSecond: undefined,
            totalTokens: undefined,
            promptTokens: undefined,
            completionTokens: undefined,
            elapsedTime: undefined,
            output: "...",
        };
    });
    setResults(initialLoadingResults);
    currentResultsState = initialLoadingResults; // Update tracker

    try {
      // Simulate fetching results for each selected model
      const resultPromises = data.selectedConnectionIds.map(async (id) => {
        const conn = connections.find(c => c.id === id);
        const name = conn?.connectionName || `Model ${id.substring(0, 5)}`;
        const modelName = conn?.model || 'unknown';
        let result: PerformanceResult | null = null; // Initialize result as null

        try {
          // Simulate API call delay
          const delay = 500 + Math.random() * 2500; // 0.5s to 3s
          await new Promise(resolve => setTimeout(resolve, delay));

          // Simulate an error for one of the models sometimes
          if (Math.random() < 0.1) { // 10% chance of error
              throw new Error("Simulated API Error");
          }

          // Generate mock performance data
          const processingTime = parseFloat((delay / 1000).toFixed(2)); // In seconds
          const responseTime = Math.max(50, parseFloat((delay * (0.1 + Math.random() * 0.3)).toFixed(0))); // e.g., 10-40% of total delay, in ms
          const completionTokens = 5 + Math.floor(Math.random() * 500);
          const promptTokens = data.prompt.split(/\s+/).length; // Rough estimate
          const totalTokens = promptTokens + completionTokens;
          const tokensPerSecond = parseFloat((completionTokens / processingTime).toFixed(1)) || 0;
          const elapsedTime = processingTime; // Simplified

          const mockOutput = `Mock response from ${name} (${modelName}) for prompt: "${data.prompt}".\n\nGenerated ${completionTokens} tokens in ${processingTime}s. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. ${Math.random() > 0.5 ? 'Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.' : ''}`;

          result = {
            connectionId: id,
            connectionName: name,
            modelName: modelName,
            processingTime: processingTime,
            responseTime: responseTime,
            tokensPerSecond: tokensPerSecond,
            totalTokens: totalTokens,
            promptTokens: promptTokens,
            completionTokens: completionTokens,
            elapsedTime: elapsedTime,
            output: mockOutput,
            status: 'complete' as 'complete',
            rating: Math.random() > 0.7 ? {
              rating: parseFloat((5 + Math.random() * 5).toFixed(1)),
              explanation: `AI explanation for ${name}'s rating.`,
            } : undefined,
          };

        } catch (error: any) {
           console.error(`Error fetching result for ${name}:`, error);
           result = { // Create an error result object
               connectionId: id,
               connectionName: name,
               modelName: modelName,
               status: 'error' as 'error',
               errorMessage: error.message || 'Request failed or timed out.',
                // Set performance metrics to undefined or 0 for errors
               processingTime: undefined,
               responseTime: undefined,
               tokensPerSecond: undefined,
               totalTokens: undefined,
               promptTokens: data.prompt.split(/\s+/).length, // Prompt tokens might still be known
               completionTokens: undefined,
               elapsedTime: undefined, // Could potentially track error time if needed
           };
        }

        // Update state incrementally as each promise resolves or rejects
        setResults(prevResults => {
            const updated = prevResults.map(r => r.connectionId === id ? result! : r);
            currentResultsState = updated; // Update tracker
            return updated;
        });
        return result; // Return the result (or error object)
      });

      // Wait for all promises to settle (complete or error)
      await Promise.allSettled(resultPromises);

    } catch (error) { // Catch errors in the overall setup/Promise handling (less likely here)
        console.error("Comparison failed:", error);
        toast({
            title: "Comparison Failed",
            description: "An unexpected error occurred during the comparison process.",
            variant: "destructive",
        });
         // Mark any remaining 'running' tasks as error
         setResults(prevResults => {
            const updated = prevResults.map(r =>
                r.status === 'running' ? { ...r, status: 'error', errorMessage: 'Overall comparison process failed.' } : r
            );
            currentResultsState = updated; // Update tracker
            return updated;
        });
    } finally {
        setIsLoading(false);
        const endTime = performance.now();
        const totalDuration = parseFloat(((endTime - startTime) / 1000).toFixed(3)); // Total comparison duration in seconds

         // Use the final tracked state for logging
         const finalResultsForLog = currentResultsState.map(r => ({
             modelId: r.connectionId,
             modelName: r.modelName,
             responseTime: r.responseTime,
             tokensPerSecond: r.tokensPerSecond,
             totalTokens: r.totalTokens,
             promptTokens: r.promptTokens,
             completionTokens: r.completionTokens,
             processingTime: r.processingTime,
             status: r.status, // Use the final status (complete or error)
             errorMessage: r.errorMessage, // Include error message if any
         }));

        const newLogEntry: ComparisonLog = {
            id: `comparison-${Date.now()}`,
            timestamp: new Date().toISOString(),
            duration: totalDuration,
            prompt: data.prompt,
            results: finalResultsForLog,
        };

        // Update logs state and save to localStorage
        setComparisonLogs(prevLogs => {
           const updatedLogs = [newLogEntry, ...prevLogs].slice(0, MAX_LOGS);
           saveLogs(updatedLogs); // Save the updated logs
           return updatedLogs;
       });
       setLastRunTimestamp(new Date()); // Record end time (or last update time)
    }
  };


  // Placeholder functions for toolbar buttons
  const handleLogsClick = () => {
      console.log("Opening Log Viewer with logs:", comparisonLogs);
      setIsLogViewerOpen(true);
  }
  const handleVerifyClick = () => {
      if (results.length > 0 || comparisonLogs.length > 0) {
         setIsVerificationOpen(true);
      } else {
          toast({
              title: "No Data Available",
              description: "Run a comparison first to verify metrics.",
              variant: "default",
          });
      }
  };
  const handleTogetherApiClick = () => toast({ title: "Action: Together API (Not Implemented)" });
  const handleApiTestClick = () => toast({ title: "Action: API Test (Not Implemented)" });

  // Refresh button handler
  const handleRefreshClick = () => {
    // Find the most recent log entry to re-run
    const lastLog = comparisonLogs.length > 0 ? comparisonLogs[0] : null;
    if (lastLog) {
        // Find the connection IDs used in the last run
        const lastConnectionIds = lastLog.results.map(r => r.modelId);
        const availableLastConnectionIds = lastConnectionIds.filter(id => connections.some(c => c.id === id));

        if (availableLastConnectionIds.length > 0) {
            toast({ title: "Refreshing Comparison", description: "Re-running the last comparison..." });
            handleCompareSubmit({
                prompt: lastLog.prompt,
                selectedConnectionIds: availableLastConnectionIds
            });
        } else {
             toast({ title: "Cannot Refresh", description: "Models from the last comparison are no longer available.", variant: "destructive" });
             // Optionally clear state or just do nothing
             // setShowResults(false);
             // setResults([]);
        }
    } else {
        toast({ title: "Nothing to Refresh", description: "No previous comparison found in logs." });
         // Optionally clear current results if any
         // setShowResults(false);
         // setResults([]);
    }
};


  return (
    <>
      <main className="container mx-auto px-4 py-8 md:py-12">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 md:mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4 md:mb-0">
            Model Comparison
          </h1>
           {/* Toolbar */}
           <div className="flex items-center space-x-1 md:space-x-2 border border-border rounded-md p-1 bg-card/80 backdrop-blur-sm">
               <Button variant="ghost" size="sm" onClick={handleLogsClick} aria-label="Show Logs">
                   <Logs className="h-4 w-4 mr-1" /> Logs
               </Button>
               <Separator orientation="vertical" className="h-6" />
               <Button variant="ghost" size="sm" onClick={handleVerifyClick} aria-label="Verify">
                   <CheckSquare className="h-4 w-4 mr-1" /> Verify
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
            <PerformanceChart
                results={results.filter(r => r.status === 'complete' || r.status === 'error')}
                isLoading={isLoading}
                lastRunTimestamp={lastRunTimestamp} // Pass timestamp to chart
             />
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

       {/* Log Viewer Modal */}
       <LogViewer
           isOpen={isLogViewerOpen}
           onClose={() => setIsLogViewerOpen(false)}
           logs={comparisonLogs}
           onClearLogs={() => {
               setComparisonLogs([]);
               saveLogs([]); // Clear from storage as well
               toast({ title: "Logs Cleared" });
            }}
       />

        {/* Metrics Verification Modal */}
       <MetricsVerificationDialog
           isOpen={isVerificationOpen}
           onClose={() => setIsVerificationOpen(false)}
           // Pass the most recent log entry for verification
           logEntry={comparisonLogs.length > 0 ? comparisonLogs[0] : null}
           onRefresh={handleRefreshClick} // Pass the refresh handler
       />
    </>
  );
}
