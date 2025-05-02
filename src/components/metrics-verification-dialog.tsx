// src/components/metrics-verification-dialog.tsx
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { RefreshCw, Download, AlertCircle, ChevronDown, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"; // Import Card components
import type { ComparisonLog } from "@/types/compare";
import { format } from 'date-fns';
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

type MetricsVerificationDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  logEntry: ComparisonLog | null; // Pass the specific log entry to verify
  onRefresh: () => void; // Callback to trigger refresh action
};

export function MetricsVerificationDialog({
  isOpen,
  onClose,
  logEntry,
  onRefresh,
}: MetricsVerificationDialogProps) {
  const { toast } = useToast();
  const [showRawStats, setShowRawStats] = React.useState(false);

  const handleDownloadLogs = () => {
    if (!logEntry) {
        toast({ title: "No Data", description: "Cannot download empty log.", variant: "destructive" });
        return;
    }
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(logEntry, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `verification_log_${logEntry.id}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
    toast({ title: "Log Downloaded", description: `Log ${logEntry.id} downloaded successfully.` });
  };

  const formatTimestamp = (isoString: string | undefined): string => {
    if (!isoString) return "N/A";
    try {
      // Use date-fns format, assuming timestamp is in ISO format
      // Format as YYYY/MM/DD, HH:MM:SS
      return format(new Date(isoString), "yyyy/MM/dd, HH:mm:ss");
    } catch {
      return "Invalid Date";
    }
  };

  // Calculate aggregated metrics
  const aggregatedMetrics = React.useMemo(() => {
    if (!logEntry || logEntry.results.length === 0) {
      return {
        totalTokens: 0,
        promptTokens: 0,
        completionTokens: 0,
        avgProcessingTime: 0,
        avgResponseTime: 0,
        avgTokensPerSecond: 0,
        expectedTokensPerSecond: 0, // Placeholder for calculation logic
        accuracy: "N/A", // Placeholder for calculation logic
        rawStats: [], // Placeholder for detailed stats per model
      };
    }

    let totalTokens = 0;
    let totalPromptTokens = 0;
    let totalCompletionTokens = 0;
    let totalProcessingTime = 0;
    let totalResponseTime = 0;
    let totalTps = 0;
    let validResultsCount = 0;

    const rawStats = logEntry.results.map(res => {
      if (res.status === 'complete') {
        totalTokens += res.totalTokens ?? 0;
        totalPromptTokens += res.promptTokens ?? 0;
        totalCompletionTokens += res.completionTokens ?? 0;
        totalProcessingTime += res.processingTime ?? 0;
        totalResponseTime += res.responseTime ?? 0;
        totalTps += res.tokensPerSecond ?? 0;
        validResultsCount++;
      }
      return {
          modelName: res.modelName,
          status: res.status,
          processingTime: res.processingTime,
          responseTime: res.responseTime,
          tokensPerSecond: res.tokensPerSecond,
          totalTokens: res.totalTokens,
          promptTokens: res.promptTokens,
          completionTokens: res.completionTokens,
          errorMessage: res.errorMessage,
      };
    });

    const avgProcessingTime = validResultsCount > 0 ? totalProcessingTime / validResultsCount : 0;
    const avgResponseTime = validResultsCount > 0 ? totalResponseTime / validResultsCount : 0;
    const avgTokensPerSecond = validResultsCount > 0 ? totalTps / validResultsCount : 0;
    // TODO: Implement logic for Expected Tokens/Second and Accuracy if possible
    const expectedTokensPerSecond = 0; // Example placeholder
    const accuracy = "N/A"; // Example placeholder


    return {
      totalTokens: totalTokens, // Could be sum or average depending on desired view
      promptTokens: totalPromptTokens > 0 ? logEntry.results.find(r=>r.promptTokens)?.promptTokens ?? 0 : 0, // Prompt tokens likely same for all
      completionTokens: totalCompletionTokens, // Sum of completion tokens
      avgProcessingTime: avgProcessingTime,
      avgResponseTime: avgResponseTime,
      avgTokensPerSecond: avgTokensPerSecond,
      expectedTokensPerSecond: expectedTokensPerSecond,
      accuracy: accuracy,
      rawStats: rawStats,
    };
  }, [logEntry]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl p-0">
        <DialogHeader className="p-4 border-b border-border flex flex-row items-center justify-between">
          <DialogTitle className="text-lg">Metrics Verification</DialogTitle>
           <div className="flex items-center gap-2">
             <Button variant="outline" size="sm" onClick={onRefresh}>
               <RefreshCw className="h-4 w-4 mr-1" /> Refresh Metrics
             </Button>
             <Button variant="outline" size="sm" onClick={handleDownloadLogs} disabled={!logEntry}>
               <Download className="h-4 w-4 mr-1" /> Download Logs
             </Button>
           </div>
        </DialogHeader>

        <Tabs defaultValue="verification" className="w-full p-4">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="verification">Verification Results</TabsTrigger>
            <TabsTrigger value="rawLog">Raw Log Data</TabsTrigger>
          </TabsList>

          <TabsContent value="verification">
            <Card className="border-border bg-card/50">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-base font-medium flex items-center">
                  {logEntry ? `Results for Comparison ${logEntry.id.replace('comparison-','')}` : "No Data Available"}
                  {!logEntry && <AlertCircle className="h-4 w-4 ml-2 text-yellow-500" />}
                </CardTitle>
                <span className="text-xs text-muted-foreground">
                  {formatTimestamp(logEntry?.timestamp)}
                </span>
              </CardHeader>
              <CardContent>
                {logEntry ? (
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between"><span>Total Tokens:</span> <span className="font-mono">{aggregatedMetrics.totalTokens}</span></div>
                    <div className="flex justify-between"><span>Prompt Tokens:</span> <span className="font-mono">{aggregatedMetrics.promptTokens}</span></div>
                    <div className="flex justify-between"><span>Completion Tokens:</span> <span className="font-mono">{aggregatedMetrics.completionTokens}</span></div>
                    <div className="flex justify-between"><span>Avg. Processing Time:</span> <span className="font-mono">{aggregatedMetrics.avgProcessingTime.toFixed(3)}s</span></div>
                    <div className="flex justify-between"><span>Avg. Response Time:</span> <span className="font-mono">{aggregatedMetrics.avgResponseTime.toFixed(2)}ms</span></div>
                    <div className="flex justify-between"><span>Avg. Tokens/Second:</span> <span className="font-mono">{aggregatedMetrics.avgTokensPerSecond.toFixed(2)}</span></div>
                    <div className="flex justify-between"><span>Expected Tokens/Second:</span> <span className="font-mono text-yellow-500">{aggregatedMetrics.expectedTokensPerSecond.toFixed(2)}</span></div> {/* Marked yellow as placeholder */}
                    <div className="flex justify-between"><span>Accuracy:</span> <span className="font-mono text-yellow-500">{aggregatedMetrics.accuracy}</span></div> {/* Marked yellow as placeholder */}

                    {/* Raw Stats Accordion */}
                    <div className="pt-4">
                         <button
                             onClick={() => setShowRawStats(!showRawStats)}
                             className="flex items-center text-xs text-muted-foreground hover:text-foreground w-full text-left"
                         >
                             {showRawStats ? <ChevronDown className="h-4 w-4 mr-1" /> : <ChevronRight className="h-4 w-4 mr-1" />}
                             Raw Stats Per Model
                         </button>
                         {showRawStats && (
                             <ScrollArea className="mt-2 max-h-48 pr-3">
                                 <pre className="text-xs bg-muted/50 p-3 rounded-md overflow-x-auto">
                                     {JSON.stringify(aggregatedMetrics.rawStats, null, 2)}
                                 </pre>
                             </ScrollArea>
                         )}
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm text-center py-8">No comparison log selected or available for verification.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="rawLog">
             <ScrollArea className="max-h-96">
                 <pre className="text-xs bg-muted/50 p-4 rounded-md overflow-x-auto">
                   {logEntry ? JSON.stringify(logEntry, null, 2) : "No log data available."}
                 </pre>
             </ScrollArea>
          </TabsContent>
        </Tabs>

        <DialogFooter className="p-4 border-t border-border">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
