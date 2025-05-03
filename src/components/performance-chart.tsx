// src/components/performance-chart.tsx
"use client"

import * as React from "react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Settings2, RefreshCw, Download } from "lucide-react"
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import type { PerformanceResult } from "@/types/compare"

// Define metric options - Updated labels for clarity
const metricOptions = [
  { value: "tokensPerSecond", label: "Tokens/Second", unit: " t/s" },
  { value: "responseTime", label: "Response Time", unit: "ms" },
  { value: "processingTime", label: "Processing Time", unit: "s" },
  { value: "totalTokens", label: "Total Tokens", unit: "" },
  { value: "promptTokens", label: "Prompt Tokens", unit: "" },
  { value: "completionTokens", label: "Completion Tokens", unit: "" },
] as const;

type MetricKey = typeof metricOptions[number]['value'];
type MetricInfo = typeof metricOptions[number];

type PerformanceChartProps = {
  results: PerformanceResult[];
  isLoading: boolean;
  // lastRunTimestamp prop is removed as we are not showing time-series anymore
};

// Function to process results for BarChart
const processResultsForBarChart = (results: PerformanceResult[], selectedMetric: MetricKey): any[] => {
  return results
    .filter(r => r.status === 'complete' && r[selectedMetric] !== undefined) // Only use completed results with valid data for the selected metric
    .map(res => ({
      name: res.connectionName, // Use connectionName for X-axis labels
      [selectedMetric]: res[selectedMetric], // Value for the selected metric
      fill: `var(--color-${res.connectionId})` // Use CSS variable for fill color
    }));
};

// Generate chart colors dynamically based on number of results
const generateChartColors = (numColors: number): { [key: string]: string } => {
    const colors: { [key: string]: string } = {};
    const hueStep = 360 / Math.max(numColors, 1);
    for (let i = 0; i < numColors; i++) {
        const hue = (175 + i * hueStep) % 360;
        colors[`model${i + 1}`] = `hsl(${hue}, 60%, 55%)`;
    }
    return colors;
};

export function PerformanceChart({ results, isLoading }: PerformanceChartProps) {
  const [selectedMetric, setSelectedMetric] = React.useState<MetricKey>("tokensPerSecond");

  // Filter results to only include those with 'complete' status
  const completedResults = results.filter(r => r.status === 'complete');

  // Process data for the BarChart based on the selected metric
  const chartData = React.useMemo(
      () => processResultsForBarChart(completedResults, selectedMetric),
      [completedResults, selectedMetric]
  );

  // Prepare Chart Config based on *all* results (for consistent coloring/legend)
  const chartColors = React.useMemo(() => generateChartColors(results.length), [results.length]);
  const chartConfig = React.useMemo(() => {
      const config: ChartConfig = {};
      results.forEach((res, index) => {
          const colorKey = `model${index + 1}`;
          config[res.connectionId] = { // Use connectionId as the key
              label: res.connectionName,
              color: chartColors[colorKey],
          };
      });
      return config;
  }, [results, chartColors]);

  const selectedMetricInfo = metricOptions.find(m => m.value === selectedMetric) as MetricInfo;

  // Tooltip Formatter
  const formatTooltipValue = (value: number | string | undefined, name: string | undefined) => {
    if (value === undefined || name === undefined) return '';
    // Name will be the selectedMetric key in this BarChart context
    const metricInfo = metricOptions.find(m => m.value === name);
    const unit = metricInfo?.unit || '';

    const formattedValue = typeof value === 'number'
      ? value.toFixed(name === 'processingTime' ? 2 : (name === 'tokensPerSecond' ? 1 : 0))
      : value;

    return `${formattedValue}${unit}`;
  };

  // Tooltip Label Formatter (Shows the model name)
  const formatTooltipLabel = (label: string) => {
      return label; // Label is the connectionName from chartData
  };


  return (
    <Card className="shadow-lg border-border">
      <CardHeader>
        <CardTitle>Performance Metrics</CardTitle>
        <CardDescription>Comparing model performance for the last run</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-6 p-4 border border-input rounded-lg bg-card/50">
           <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              {/* Metric Selector */}
              <div className="flex items-center gap-2">
                 <Label htmlFor="metric-select" className="text-sm font-medium text-muted-foreground whitespace-nowrap">
                    Metric:
                 </Label>
                 <Select
                     value={selectedMetric}
                     onValueChange={(value) => setSelectedMetric(value as MetricKey)}
                     disabled={isLoading || completedResults.length === 0}
                    >
                    <SelectTrigger id="metric-select" className="w-[180px] h-9">
                        <SelectValue placeholder="Select Metric" />
                    </SelectTrigger>
                    <SelectContent>
                        {metricOptions.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                            {option.label}
                        </SelectItem>
                        ))}
                    </SelectContent>
                 </Select>
              </div>

              {/* Removed Smoothing Slider, Data Points Toggle, Sync Tooltips, Zoom */}

              {/* Chart Actions */}
              <div className="flex items-center gap-1 ml-auto"> {/* Moved actions to the right */}
                  <Button variant="ghost" size="sm" disabled={isLoading || completedResults.length === 0}><Settings2 className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="sm" disabled={isLoading || completedResults.length === 0}><RefreshCw className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="sm" disabled={isLoading || completedResults.length === 0}><Download className="h-4 w-4" /></Button>
              </div>
           </div>
        </div>

        <div className="h-[350px] w-full">
           {isLoading && completedResults.length === 0 ? (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                 Loading chart data...
              </div>
           ) : !isLoading && completedResults.length === 0 ? (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                  Run a comparison with successful results to view performance metrics.
              </div>
           ) : chartData.length === 0 ? (
               <div className="flex items-center justify-center h-full text-muted-foreground">
                   No valid data for the selected metric ({selectedMetricInfo.label}) in the last run.
               </div>
           ) : (
             <ChartContainer config={chartConfig} className="h-full w-full">
                <BarChart
                    data={chartData}
                    margin={{ top: 5, right: 20, left: 0, bottom: 5 }} // Adjusted bottom margin
                    >
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border)/0.5)" />
                     <XAxis
                        dataKey="name" // Model names on X-axis
                        tickLine={false}
                        axisLine={false}
                        tickMargin={8}
                        tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                        // Consider interval={0} if names overlap, or angled labels
                     />
                     <YAxis
                        // domain={yAxisDomain} // Domain calculation might need adjustment for BarChart
                        tickLine={false}
                        axisLine={false}
                        tickMargin={8}
                        tickFormatter={(value) => value.toString()} // Simple formatter
                        tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                        label={{ value: selectedMetricInfo.label + (selectedMetricInfo.unit ? ` (${selectedMetricInfo.unit.trim()})` : ''), angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: 'hsl(var(--muted-foreground))', fontSize: 12 }, dy: 60 }} // Y-axis label
                    />
                     <Tooltip
                        cursor={{ fill: "hsl(var(--muted)/0.3)" }} // Use fill cursor for bars
                        content={
                            <ChartTooltipContent
                                formatter={formatTooltipValue}
                                labelFormatter={formatTooltipLabel} // Use the model name as label
                             />
                        }
                      />
                      {/* Legend might not be necessary if colors are directly on bars based on config */}
                      {/* <Legend content={<ChartLegendContent />} verticalAlign="bottom" wrapperStyle={{ paddingTop: 20 }} /> */}
                     <Bar dataKey={selectedMetric} radius={4} /* fill is set per item in chartData */ />
                     {/* Add more bars here if comparing multiple metrics simultaneously */}
                </BarChart>
             </ChartContainer>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
