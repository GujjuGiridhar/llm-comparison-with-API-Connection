// src/components/result-card.tsx
"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { AlertTriangle, CheckCircle, Clock } from "lucide-react";
import type { PerformanceResult } from "@/types/compare"; // Import shared type

type ResultCardProps = {
  result: PerformanceResult;
  isLoading: boolean;
};

export function ResultCard({ result, isLoading }: ResultCardProps) {
    const {
        connectionName,
        modelName, // Get modelName
        status,
        processingTime,
        responseTime,
        tokensPerSecond,
        totalTokens,
        promptTokens,
        completionTokens,
        elapsedTime, // Assuming this is calculated or provided
        output,
        rating,
        errorMessage // Get errorMessage
    } = result;

    const isComplete = status === 'complete';
    const isRunning = status === 'running';
    const isError = status === 'error';

    // Format time values
    const formatTime = (value: number | undefined, unit: 's' | 'ms'): string => {
        if (value === undefined) return 'N/A';
        if (unit === 's') return `${value.toFixed(2)}s`;
        // For ms, show as integer
        return `${Math.round(value)}ms`;
    };

    // Calculate progress percentage (simplified)
    // In a real scenario, this might come from streaming updates
    const progress = isComplete ? 100 : (isRunning ? 50 : 0); // Basic progress simulation

    return (
        <Card className={`shadow-md border ${isError ? 'border-destructive/50' : 'border-border'} ${isRunning ? 'opacity-70' : ''}`}>
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
             <div>
                 <CardTitle className="text-lg font-semibold truncate" title={connectionName}>
                     {connectionName}
                 </CardTitle>
                 {/* Display Model Name below Connection Name */}
                 <CardDescription className="text-xs text-muted-foreground">{modelName}</CardDescription>
             </div>
            <Badge variant={isComplete ? "secondary" : isError ? "destructive" : "outline"} className={`ml-auto whitespace-nowrap ${isComplete ? 'bg-green-600/20 text-green-400 border-green-600/30' : ''} ${isError ? '' : ''} ${isRunning ? 'bg-yellow-600/20 text-yellow-400 border-yellow-600/30' : ''}`}>
                {isComplete ? <CheckCircle className="h-3 w-3 mr-1" /> : isError ? <AlertTriangle className="h-3 w-3 mr-1" /> : <Clock className="h-3 w-3 mr-1 animate-spin" />}
                {status}
            </Badge>
        </CardHeader>
        <CardContent className="space-y-4">
            {/* Metrics Grid */}
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <div className="text-muted-foreground">Processing Time</div>
                <div className="text-right font-mono">{formatTime(processingTime, 's')}</div>

                <div className="text-muted-foreground">Response Time</div>
                <div className="text-right font-mono">{formatTime(responseTime, 'ms')}</div>

                <div className="text-muted-foreground">Tokens/Second</div>
                <div className="text-right font-mono">{tokensPerSecond?.toFixed(1) ?? 'N/A'}</div>

                <div className="text-muted-foreground">Total Tokens</div>
                <div className="text-right font-mono">{totalTokens ?? 'N/A'}</div>

                <div className="text-muted-foreground">Prompt Tokens</div>
                <div className="text-right font-mono">{promptTokens ?? 'N/A'}</div>

                <div className="text-muted-foreground">Completion Tokens</div>
                <div className="text-right font-mono">{completionTokens ?? 'N/A'}</div>
            </div>

             {/* Elapsed Time & Progress */}
            <div className="space-y-1">
                <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Elapsed Time: {formatTime(elapsedTime, 's')}</span>
                    <span>{progress}%</span>
                </div>
                 <Progress value={progress} aria-label={`Comparison progress ${progress}%`} className="h-2" />
            </div>

             {/* Output Section (conditionally rendered) */}
             {isComplete && output && (
                 <div className="pt-4 border-t border-border">
                     <h4 className="mb-2 text-sm font-semibold text-foreground">Output</h4>
                     <div className="prose prose-sm dark:prose-invert max-w-none max-h-48 overflow-y-auto p-3 bg-muted/30 rounded-md border border-input text-sm">
                         <pre className="whitespace-pre-wrap break-words">{output}</pre>
                     </div>
                 </div>
             )}

             {/* Error Message */}
             {isError && (
                  <div className="pt-4 border-t border-border text-destructive text-sm">
                     {errorMessage || 'Failed to get response for this model.'}
                 </div>
             )}

             {/* Loading Placeholder */}
             {isRunning && (
                  <div className="pt-4 border-t border-border text-muted-foreground text-sm flex items-center justify-center h-24">
                      <Clock className="h-4 w-4 mr-2 animate-spin" /> Generating response...
                 </div>
             )}

            {/* AI Rating (Optional) */}
             {isComplete && rating && (
                <div className="pt-4 border-t border-border text-xs text-muted-foreground italic">
                    AI Rating: {rating.rating}/10 - {rating.explanation}
                </div>
             )}

        </CardContent>
        </Card>
    );
}