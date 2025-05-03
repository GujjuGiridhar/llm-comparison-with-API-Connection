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
import { FileText, CheckSquare, Combine, FlaskConical, RefreshCw, BarChart, Logs, Palette } from "lucide-react"; // Added Palette
import type { Connection } from "@/app/settings/page";
import { ComparisonSetup } from "@/components/comparison-setup";
import { PerformanceChart } from "@/components/performance-chart";
import { ResultCard } from "@/components/result-card";
import type { PerformanceResult, ComparisonLog } from "@/types/compare";
import { useToast } from "@/hooks/use-toast";
import { LogViewer } from "@/components/log-viewer";
import { MetricsVerificationDialog } from "@/components/metrics-verification-dialog";
import { TogetherApiTesterDialog } from "@/components/together-api-tester-dialog";
import { ApiRequestTesterDialog } from "@/components/api-request-tester-dialog";
import { CustomizeColorsDialog } from "@/components/customize-colors-dialog"; // Import CustomizeColorsDialog
import type { ChartConfig } from "@/components/ui/chart"; // Import ChartConfig type
import { generateDefaultChartConfig } from "@/lib/chart-utils"; // Import helper

const LOGS_STORAGE_KEY = 'comparison_logs';
const MAX_LOGS = 20;
const CONNECTIONS_STORAGE_KEY = 'llm_connections';
const CHART_CONFIG_STORAGE_KEY = 'llm_chart_config'; // Key for storing chart colors


// Helper function to get mock connections (same as in settings)
const getMockConnections = (): Connection[] => [
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

export default function ComparePage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = React.useState(false);
  const [showResults, setShowResults] = React.useState(false);
  const [results, setResults] = React.useState<PerformanceResult[]>([]);
  const [connections, setConnections] = React.useState<Connection[]>([]);
  const [isLogViewerOpen, setIsLogViewerOpen] = React.useState(false);
  const [isVerificationOpen, setIsVerificationOpen] = React.useState(false);
  const [isTogetherApiTesterOpen, setIsTogetherApiTesterOpen] = React.useState(false);
  const [isApiTesterOpen, setIsApiTesterOpen] = React.useState(false);
  const [comparisonLogs, setComparisonLogs] = React.useState<ComparisonLog[]>([]);
  const [isCustomizeColorsOpen, setIsCustomizeColorsOpen] = React.useState(false); // State for color dialog
  const [chartConfig, setChartConfig] = React.useState<ChartConfig>({}); // State for chart config


  // Load connections, logs, and chart config from localStorage on mount
  React.useEffect(() => {
    // --- Load Connections ---
    const savedConnections = localStorage.getItem(CONNECTIONS_STORAGE_KEY);
    let loadedConnections: Connection[] = [];
    let useMocks = false;

    if (savedConnections) {
      try {
        const parsedConnections = JSON.parse(savedConnections) as Connection[];
        if (Array.isArray(parsedConnections)) {
            loadedConnections = parsedConnections;
        } else {
            console.error("ComparePage: Invalid data format in localStorage for connections. Expected array.");
            localStorage.removeItem(CONNECTIONS_STORAGE_KEY);
        }
      } catch (error) {
        console.error("ComparePage: Failed to parse connections from localStorage", error);
        localStorage.removeItem(CONNECTIONS_STORAGE_KEY);
      }
    } else {
        console.log("ComparePage: No connections found in localStorage. Adding mock data.");
        loadedConnections = getMockConnections();
        localStorage.setItem(CONNECTIONS_STORAGE_KEY, JSON.stringify(loadedConnections));
        useMocks = true;
    }

    const activeConnections = loadedConnections.filter(conn => conn.isActive);

    if (activeConnections.length === 0 && !useMocks) {
        console.warn("ComparePage: No active connections loaded from localStorage.");
    }

     setConnections(activeConnections); // Set only active connections for the setup component

     // --- Load Logs ---
     const savedLogs = localStorage.getItem(LOGS_STORAGE_KEY);
     if (savedLogs) {
         try {
             const parsedLogs = JSON.parse(savedLogs) as ComparisonLog[];
             setComparisonLogs(parsedLogs);
         } catch (error) {
             console.error("Failed to parse logs from localStorage", error);
             localStorage.removeItem(LOGS_STORAGE_KEY);
         }
     }

     // --- Load Chart Config ---
     const savedChartConfig = localStorage.getItem(CHART_CONFIG_STORAGE_KEY);
     let initialChartConfig: ChartConfig = {};
     if (savedChartConfig) {
         try {
             initialChartConfig = JSON.parse(savedChartConfig) as ChartConfig;
             // Basic validation
             if (typeof initialChartConfig !== 'object' || initialChartConfig === null) {
                 initialChartConfig = {};
                 localStorage.removeItem(CHART_CONFIG_STORAGE_KEY);
             }
         } catch (error) {
             console.error("Failed to parse chart config from localStorage", error);
             initialChartConfig = {};
             localStorage.removeItem(CHART_CONFIG_STORAGE_KEY);
         }
     }

     // Ensure all current active connections have a default config if not loaded
     const updatedConfig = generateDefaultChartConfig(activeConnections, initialChartConfig);
     setChartConfig(updatedConfig);
     // Save potentially updated config back to storage
     localStorage.setItem(CHART_CONFIG_STORAGE_KEY, JSON.stringify(updatedConfig));


  }, []); // Empty dependency array


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
        const logsToSave = logs.slice(-MAX_LOGS);
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

  // Function to save chart config to localStorage
  const saveChartConfig = (config: ChartConfig) => {
      try {
          localStorage.setItem(CHART_CONFIG_STORAGE_KEY, JSON.stringify(config));
      } catch (error) {
          console.error("Failed to save chart config to localStorage", error);
          toast({
              title: "Error Saving Chart Colors",
              description: "Could not save chart color preferences.",
              variant: "destructive",
          });
      }
  };

  // Callback for updating chart config from the dialog
  const handleUpdateChartConfig = (newConfig: ChartConfig) => {
      setChartConfig(newConfig);
      saveChartConfig(newConfig); // Save updated config
      setIsCustomizeColorsOpen(false); // Close dialog after saving
      toast({
          title: "Chart Colors Updated",
          description: "Your color preferences have been saved.",
      });
  };

 const handleCompareSubmit = async (data: { prompt: string; selectedConnectionIds: string[] }) => {
    console.log("Comparison submitted:", data);
    const startTime = performance.now();
    let currentResultsState: PerformanceResult[] = [];

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

     // Ensure chart config exists for all selected models before starting
     const connectionsForRun = connections.filter(c => data.selectedConnectionIds.includes(c.id));
     setChartConfig(prevConfig => {
        const updatedConfig = generateDefaultChartConfig(connectionsForRun, prevConfig);
        // Only save if there were actual updates
        if (JSON.stringify(updatedConfig) !== JSON.stringify(prevConfig)) {
            saveChartConfig(updatedConfig);
        }
        return updatedConfig;
     });


    // Generate initial loading state for all selected models
    const initialLoadingResults: PerformanceResult[] = data.selectedConnectionIds.map(id => {
        const conn = connections.find(c => c.id === id);
        return {
            connectionId: id,
            connectionName: conn?.connectionName || `Model ${id.substring(0, 5)}`,
            modelName: conn?.model || 'unknown',
            status: 'running' as 'running',
            // ... other fields initialized to undefined or default
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
    currentResultsState = initialLoadingResults;

    try {
      // Simulate fetching results for each selected model
      const resultPromises = data.selectedConnectionIds.map(async (id) => {
        const conn = connections.find(c => c.id === id);
        const name = conn?.connectionName || `Model ${id.substring(0, 5)}`;
        const modelName = conn?.model || 'unknown';
        let result: PerformanceResult | null = null;

        try {
          // Simulate API call delay
          const delay = 500 + Math.random() * 2500;
          await new Promise(resolve => setTimeout(resolve, delay));

          // Generate mock performance data
          const processingTime = parseFloat((delay / 1000).toFixed(2));
          const responseTime = Math.max(50, parseFloat((delay * (0.1 + Math.random() * 0.3)).toFixed(0)));
          const completionTokens = 5 + Math.floor(Math.random() * 500);
          const promptTokens = data.prompt.split(/\s+/).length;
          const totalTokens = promptTokens + completionTokens;
          const tokensPerSecond = parseFloat((completionTokens / processingTime).toFixed(1)) || 0;
          const elapsedTime = processingTime;

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
           result = {
               connectionId: id,
               connectionName: name,
               modelName: modelName,
               status: 'error' as 'error',
               errorMessage: error.message || 'Request failed or timed out.',
               processingTime: undefined,
               responseTime: undefined,
               tokensPerSecond: undefined,
               totalTokens: undefined,
               promptTokens: data.prompt.split(/\s+/).length,
               completionTokens: undefined,
               elapsedTime: undefined,
               output: undefined, // Ensure output is undefined on error
           };
        }

        // Update state incrementally
        setResults(prevResults => {
            const updated = prevResults.map(r => r.connectionId === id ? result! : r);
            currentResultsState = updated;
            return updated;
        });
        return result;
      });

      await Promise.allSettled(resultPromises);

    } catch (error) {
        console.error("Comparison failed:", error);
        toast({
            title: "Comparison Failed",
            description: "An unexpected error occurred during the comparison process.",
            variant: "destructive",
        });
         setResults(prevResults => {
            const updated = prevResults.map(r =>
                r.status === 'running' ? { ...r, status: 'error', errorMessage: 'Overall comparison process failed.' } : r
            );
            currentResultsState = updated;
            return updated;
        });
    } finally {
        setIsLoading(false);
        const endTime = performance.now();
        const totalDuration = parseFloat(((endTime - startTime) / 1000).toFixed(3));

         const finalResultsForLog = currentResultsState.map(r => ({
             modelId: r.connectionId,
             modelName: r.modelName,
             responseTime: r.responseTime,
             tokensPerSecond: r.tokensPerSecond,
             totalTokens: r.totalTokens,
             promptTokens: r.promptTokens,
             completionTokens: r.completionTokens,
             processingTime: r.processingTime,
             status: r.status,
             errorMessage: r.errorMessage,
         }));

        const newLogEntry: ComparisonLog = {
            id: `comparison-${Date.now()}`,
            timestamp: new Date().toISOString(),
            duration: totalDuration,
            prompt: data.prompt,
            results: finalResultsForLog,
        };

        setComparisonLogs(prevLogs => {
           const updatedLogs = [newLogEntry, ...prevLogs].slice(0, MAX_LOGS);
           saveLogs(updatedLogs);
           return updatedLogs;
       });
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
   const handleCustomizeColorsClick = () => {
     // Ensure chartConfig is based on currently *selected* models for the dialog
     const currentResultIds = results.map(r => r.connectionId);
     const connectionsForDialog = connections.filter(c => currentResultIds.includes(c.id));

     if (connectionsForDialog.length > 0) {
       // Ensure config exists for these models
       setChartConfig(prevConfig => {
           const updated = generateDefaultChartConfig(connectionsForDialog, prevConfig);
           if (JSON.stringify(updated) !== JSON.stringify(prevConfig)) {
               saveChartConfig(updated); // Save if defaults were added
           }
           return updated;
       });
       setIsCustomizeColorsOpen(true);
     } else {
         toast({
             title: "No Models to Customize",
             description: "Run a comparison first or select models.",
             variant: "default",
         });
     }
   };
  const handleTogetherApiClick = () => {
     setIsTogetherApiTesterOpen(true);
  }
  const handleApiTestClick = () => {
      setIsApiTesterOpen(true);
  };

  // Refresh button handler
  const handleRefreshClick = () => {
    const lastLog = comparisonLogs.length > 0 ? comparisonLogs[0] : null;
    if (lastLog) {
        const lastConnectionIds = lastLog.results.map(r => r.modelId);
        const availableLastConnectionIds = lastConnectionIds.filter(id =>
            connections.some(c => c.id === id && c.isActive) // Ensure connection is still active
        );

        if (availableLastConnectionIds.length > 0) {
            toast({ title: "Refreshing Comparison", description: "Re-running the last comparison..." });
            handleCompareSubmit({
                prompt: lastLog.prompt,
                selectedConnectionIds: availableLastConnectionIds
            });
        } else {
             toast({ title: "Cannot Refresh", description: "Models from the last comparison are no longer available or active.", variant: "destructive" });
        }
    } else {
        toast({ title: "Nothing to Refresh", description: "No previous comparison found in logs." });
    }
};

// Function to handle deleting a single log entry
const handleDeleteLog = (logId: string) => {
    setComparisonLogs(prevLogs => {
        const updatedLogs = prevLogs.filter(log => log.id !== logId);
        saveLogs(updatedLogs);
        return updatedLogs;
    });
    toast({ title: "Log Entry Deleted", description: `Log ID ${logId.replace('comparison-','')} has been deleted.` });
};


  return (
    <>
      <main className="container mx-auto px-4 py-8 md:py-12">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 md:mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4 md:mb-0">
            Model Comparison
          </h1>
           <div className="flex items-center space-x-1 md:space-x-2 border border-border rounded-md p-1 bg-card/80 backdrop-blur-sm">
               <Button variant="ghost" size="sm" onClick={handleLogsClick} aria-label="Show Logs">
                   <Logs className="h-4 w-4 mr-1" /> Logs
               </Button>
               <Separator orientation="vertical" className="h-6" />
               <Button variant="ghost" size="sm" onClick={handleVerifyClick} aria-label="Verify Metrics">
                   <CheckSquare className="h-4 w-4 mr-1" /> Verify
               </Button>
                <Button variant="ghost" size="sm" onClick={handleCustomizeColorsClick} aria-label="Customize Colors">
                   <Palette className="h-4 w-4 mr-1" /> Colors {/* Changed Icon */}
               </Button>
               <Separator orientation="vertical" className="h-6" />
               <Button variant="ghost" size="sm" onClick={handleTogetherApiClick}>
                   <Combine className="h-4 w-4 mr-1" />
                   Together API
               </Button>
               <Button variant="ghost" size="sm" onClick={handleApiTestClick}>
                   <FlaskConical className="h-4 w-4 mr-1" />
                   API Test
               </Button>
               <Separator orientation="vertical" className="h-6" />
               <Button variant="ghost" size="sm" onClick={handleRefreshClick} aria-label="Refresh Comparison">
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
         {showResults && results.length > 0 && <Separator className="my-8 md:my-12" />}

        {/* Performance Metrics Section - Render Chart */}
        {showResults && (
            <PerformanceChart
                results={results}
                isLoading={isLoading}
                chartConfig={chartConfig} // Pass chartConfig
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
               saveLogs([]);
               toast({ title: "Logs Cleared" });
            }}
           onRefresh={handleRefreshClick}
           onDeleteLog={handleDeleteLog}
       />

        {/* Metrics Verification Modal */}
       <MetricsVerificationDialog
           isOpen={isVerificationOpen}
           onClose={() => setIsVerificationOpen(false)}
           logEntry={comparisonLogs.length > 0 ? comparisonLogs[0] : null}
           onRefresh={handleRefreshClick}
       />

        {/* Customize Colors Modal */}
       <CustomizeColorsDialog
           isOpen={isCustomizeColorsOpen}
           onClose={() => setIsCustomizeColorsOpen(false)}
           connections={connections.filter(c => results.some(r => r.connectionId === c.id))} // Only pass connections that have results
           initialConfig={chartConfig}
           onSave={handleUpdateChartConfig}
       />

        {/* Together API Tester Modal */}
        <TogetherApiTesterDialog
            isOpen={isTogetherApiTesterOpen}
            onClose={() => setIsTogetherApiTesterOpen(false)}
        />

         {/* API Request Tester Modal */}
         <ApiRequestTesterDialog
             isOpen={isApiTesterOpen}
             onClose={() => setIsApiTesterOpen(false)}
         />
    </>
  );
}
