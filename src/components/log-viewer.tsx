// src/components/log-viewer.tsx
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Trash2, Download, Search, Filter, Clock, Cpu } from "lucide-react"; // Added Cpu icon for model
import type { ComparisonLog } from "@/types/compare";
import { format } from 'date-fns';
import { cn } from "@/lib/utils"; // Import cn

type LogViewerProps = {
  isOpen: boolean;
  onClose: () => void;
  logs: ComparisonLog[];
  onClearLogs: () => void;
};

export function LogViewer({ isOpen, onClose, logs, onClearLogs }: LogViewerProps) {
  const [searchTerm, setSearchTerm] = React.useState("");
  const [filterType, setFilterType] = React.useState("all"); // 'all', 'complete', 'error'
  const [filterModel, setFilterModel] = React.useState("all"); // 'all', or specific model name
  const [sortOrder, setSortOrder] = React.useState("newest"); // 'newest', 'oldest'
  const [selectedLogId, setSelectedLogId] = React.useState<string | null>(null);

  // Get unique model names from logs for the filter dropdown
  const uniqueModelNames = React.useMemo(() => {
    const modelSet = new Set<string>();
    logs.forEach(log => {
      log.results.forEach(result => {
        modelSet.add(result.modelName);
      });
    });
    return Array.from(modelSet).sort();
  }, [logs]);

  const filteredAndSortedLogs = React.useMemo(() => {
    return logs
      .filter(log => {
        // Filter by search term (check prompt or model names)
        const lowerSearchTerm = searchTerm.toLowerCase();
        const searchMatch = lowerSearchTerm === "" ||
          log.prompt.toLowerCase().includes(lowerSearchTerm) ||
          log.results.some(res => res.modelName.toLowerCase().includes(lowerSearchTerm));

        // Filter by type (status of results)
        const typeMatch = filterType === 'all' ||
          (filterType === 'complete' && log.results.every(res => res.status === 'complete')) ||
          (filterType === 'error' && log.results.some(res => res.status === 'error'));

        // Filter by model name
        const modelMatch = filterModel === 'all' ||
            log.results.some(res => res.modelName === filterModel);

        return searchMatch && typeMatch && modelMatch; // Added modelMatch
      })
      .sort((a, b) => {
        // Sort by timestamp
        const dateA = new Date(a.timestamp).getTime();
        const dateB = new Date(b.timestamp).getTime();
        return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
      });
  }, [logs, searchTerm, filterType, filterModel, sortOrder]); // Added filterModel dependency

  // Select the first log by default if none is selected or the selected one is filtered out
  React.useEffect(() => {
      if (filteredAndSortedLogs.length > 0) {
          const currentSelectedLog = filteredAndSortedLogs.find(log => log.id === selectedLogId);
          if (!currentSelectedLog) {
              setSelectedLogId(filteredAndSortedLogs[0].id);
          }
      } else {
          setSelectedLogId(null); // No logs match filter/sort
      }
  }, [filteredAndSortedLogs, selectedLogId]);

  const selectedLog = React.useMemo(() => {
      return filteredAndSortedLogs.find(log => log.id === selectedLogId);
  }, [filteredAndSortedLogs, selectedLogId]);


  const formatTimestamp = (isoString: string) => {
      try {
          return format(new Date(isoString), "yyyy/MM/dd, HH:mm:ss");
      } catch {
          return "Invalid Date";
      }
  };

  const handleDownloadLogs = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(logs, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `comparison_logs_${new Date().toISOString()}.json`);
    document.body.appendChild(downloadAnchorNode); // required for firefox
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const handleRefresh = () => {
    // Reset all filters and sorting to default
    setSearchTerm("");
    setFilterType("all");
    setFilterModel("all"); // Reset model filter
    setSortOrder("newest");
    // Selection will reset automatically via useEffect
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl h-[85vh] flex flex-col p-0"> {/* Increased width and height slightly */}
        <DialogHeader className="p-4 border-b border-border">
          <DialogTitle className="text-lg">Log Viewer</DialogTitle>
        </DialogHeader>

        {/* Toolbar */}
        <div className="flex items-center justify-between gap-2 px-4 py-2 border-b border-border flex-wrap">
           {/* Left Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button variant="outline" size="sm" onClick={handleRefresh}>
              <RefreshCw className="h-4 w-4 mr-1" /> Refresh
            </Button>
            <Button variant="outline" size="sm" onClick={onClearLogs}>
              <Trash2 className="h-4 w-4 mr-1" /> Clear
            </Button>
            <Button variant="outline" size="sm" onClick={handleDownloadLogs}>
              <Download className="h-4 w-4 mr-1" /> Download
            </Button>
          </div>

           {/* Right Filters */}
          <div className="flex items-center gap-2 flex-grow justify-end flex-wrap">
             {/* Search Input */}
            <div className="relative flex-grow sm:flex-grow-0">
              <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search logs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 h-9 w-full min-w-[150px] sm:w-48"
              />
            </div>
             {/* Status Filter */}
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-auto min-w-[110px] h-9">
                 <Filter className="h-3 w-3 mr-1 text-muted-foreground inline-block" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="complete">Complete</SelectItem>
                <SelectItem value="error">Errors</SelectItem>
              </SelectContent>
            </Select>
            {/* Model Filter */}
             <Select value={filterModel} onValueChange={setFilterModel}>
              <SelectTrigger className="w-auto min-w-[130px] h-9">
                 <Cpu className="h-3 w-3 mr-1 text-muted-foreground inline-block" />
                <SelectValue placeholder="Model" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Models</SelectItem>
                {uniqueModelNames.map(modelName => (
                    <SelectItem key={modelName} value={modelName}>
                        {modelName}
                    </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {/* Sort Order */}
             <Select value={sortOrder} onValueChange={setSortOrder}>
              <SelectTrigger className="w-auto min-w-[110px] h-9">
                 <Clock className="h-3 w-3 mr-1 text-muted-foreground inline-block" />
                <SelectValue placeholder="Sort" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest</SelectItem>
                <SelectItem value="oldest">Oldest</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex flex-1 overflow-hidden">
          {/* Log List */}
          <ScrollArea className="w-1/3 border-r border-border">
             <div className="p-2 space-y-1">
               <div className="px-2 py-1 text-xs text-muted-foreground">
                  Showing {filteredAndSortedLogs.length} of {logs.length} logs
               </div>
               {filteredAndSortedLogs.map((log) => (
                  <button
                      key={log.id}
                      onClick={() => setSelectedLogId(log.id)}
                      className={cn(
                        "w-full text-left p-2 rounded-md text-sm hover:bg-muted transition-colors",
                        selectedLogId === log.id ? "bg-muted" : ""
                      )}
                    >
                      <div className="flex justify-between items-center mb-1">
                          <span className="font-medium truncate">{log.id.replace('comparison-', '')}</span>
                           <Badge
                              variant={log.results.some(r => r.status === 'error') ? 'destructive' : 'secondary'}
                              className={`text-xs whitespace-nowrap ${log.results.some(r => r.status === 'error') ? '' : 'bg-green-600/20 text-green-400 border-green-600/30'}`}
                           >
                              {log.results.some(r => r.status === 'error') ? 'Error' : 'Complete'}
                           </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground">
                           {formatTimestamp(log.timestamp)}
                      </div>
                      <p className="text-xs text-muted-foreground truncate mt-1" title={log.prompt}>
                          Prompt: {log.prompt}
                      </p>
                      {/* Optionally show models included */}
                      {/* <p className="text-xs text-muted-foreground truncate mt-1">
                          Models: {log.results.map(r => r.modelName).join(', ')}
                      </p> */}
                  </button>
               ))}
                 {filteredAndSortedLogs.length === 0 && (
                     <p className="text-sm text-muted-foreground text-center p-4">No logs match your criteria.</p>
                 )}
             </div>
          </ScrollArea>

          {/* Log Details */}
          <ScrollArea className="w-2/3">
             <div className="p-4">
               {selectedLog ? (
                 <pre className="text-xs bg-muted/50 p-4 rounded-md overflow-x-auto">
                   {JSON.stringify(
                       {
                           id: selectedLog.id,
                           timestamp: selectedLog.timestamp,
                           duration: selectedLog.duration,
                           prompt: selectedLog.prompt,
                           results: selectedLog.results.map(r => ({
                               modelId: r.modelId,
                               modelName: r.modelName,
                               status: r.status,
                               responseTime: r.responseTime,
                               tokensPerSecond: r.tokensPerSecond,
                               totalTokens: r.totalTokens,
                               promptTokens: r.promptTokens,
                               completionTokens: r.completionTokens,
                               processingTime: r.processingTime,
                               errorMessage: r.errorMessage,
                           })),
                       },
                        null,
                        2
                    )}
                 </pre>
               ) : (
                 <div className="flex items-center justify-center h-full text-muted-foreground">
                   {logs.length === 0 ? "No logs available." : "Select a log to view details or adjust filters."}
                 </div>
               )}
             </div>
          </ScrollArea>
        </div>

        <DialogFooter className="p-4 border-t border-border">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
