// src/components/performance-chart.tsx
"use client"

import * as React from "react"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Dot,
} from "recharts"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Settings2, RefreshCw, Download, ZoomIn, ZoomOut } from "lucide-react"
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart"; // Assuming chart components are in ui/chart
import type { PerformanceResult } from "@/types/compare" // Import shared type

// Define metric options
const metricOptions = [
  { value: "tokensPerSecond", label: "Tokens/Second" },
  { value: "responseTime", label: "Response Time (ms)" },
  { value: "processingTime", label: "Processing Time (s)" },
  { value: "totalTokens", label: "Total Tokens" },
  { value: "promptTokens", label: "Prompt Tokens" },
  { value: "completionTokens", label: "Completion Tokens" },
] as const;

type MetricKey = typeof metricOptions[number]['value'];

type PerformanceChartProps = {
  results: PerformanceResult[];
  isLoading: boolean;
  lastRunTimestamp: Date | null; // Add timestamp prop
};

// Mock time-series data generation (replace with actual data structure)
// Update mock generation to handle potentially undefined metric values gracefully
const generateMockTimeSeries = (results: PerformanceResult[], timestamp: Date | null) => {
    const timePoints = 10; // Number of data points over time
    // Use the provided timestamp if available, otherwise fallback to current time
    const endTime = timestamp ? timestamp.getTime() : new Date().getTime();
    const startTime = endTime - (timePoints * 2000); // Start N seconds before the end time
    const data: any[] = [];

    console.log("Generating chart data based on timestamp:", timestamp); // Add logging

    for (let i = 0; i < timePoints; i++) {
        const pointTime = startTime + i * 2000;
        const timeLabel = new Date(pointTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        const point: any = { time: timeLabel, timestamp: pointTime };

        results.forEach(res => {
            // Use optional chaining and default values (e.g., 0)
            const baseTps = res.tokensPerSecond ?? 0;
            const baseResp = res.responseTime ?? 0;
            const baseProc = res.processingTime ?? 0;
            const baseTotal = res.totalTokens ?? 0;
            const basePrompt = res.promptTokens ?? 0;
            const baseComp = res.completionTokens ?? 0;

            // Simulate metric fluctuation over time - add slight variation based on timestamp too
            const timeFactor = 1 + Math.sin(pointTime / 50000) * 0.1; // Slow oscillation based on time

            point[`${res.connectionId}_tokensPerSecond`] = parseFloat((baseTps * (0.8 + Math.random() * 0.4) * timeFactor).toFixed(1)) || 0; // Ensure not NaN
            point[`${res.connectionId}_responseTime`] = Math.round(baseResp * (0.9 + Math.random() * 0.2) * timeFactor);
            point[`${res.connectionId}_processingTime`] = parseFloat((baseProc * (0.9 + Math.random() * 0.2) * timeFactor).toFixed(2)) || 0; // Ensure not NaN
            // Ensure totalTokens fluctuation doesn't go below promptTokens
            const simulatedTotal = baseTotal - Math.floor(Math.random() * (baseTotal * 0.1));
            point[`${res.connectionId}_totalTokens`] = Math.max(basePrompt, simulatedTotal); // Can't be less than prompt tokens
            point[`${res.connectionId}_promptTokens`] = basePrompt; // Prompt tokens likely constant
            // Calculate completion tokens based on simulated total
            point[`${res.connectionId}_completionTokens`] = Math.max(0, point[`${res.connectionId}_totalTokens`] - basePrompt);
        });
        data.push(point);
    }
    return data;
};


// Generate chart colors dynamically based on number of results
const generateChartColors = (numColors: number): { [key: string]: string } => {
    const colors: { [key: string]: string } = {};
    const hueStep = 360 / Math.max(numColors, 1); // Avoid division by zero
    for (let i = 0; i < numColors; i++) {
        // Use HSL for better distribution - vary hue, keep saturation and lightness consistent
        const hue = (175 + i * hueStep) % 360; // Start near accent color (175)
        colors[`model${i + 1}`] = `hsl(${hue}, 60%, 55%)`; // Consistent saturation/lightness
    }
    return colors;
};

export function PerformanceChart({ results, isLoading, lastRunTimestamp }: PerformanceChartProps) {
  const [selectedMetric, setSelectedMetric] = React.useState<MetricKey>("tokensPerSecond");
  const [smoothing, setSmoothing] = React.useState(55);
  const [showDataPoints, setShowDataPoints] = React.useState(false);
  const [syncTooltips, setSyncTooltips] = React.useState(true);
  // Add zoom state if implementing zoom functionality
  // const [zoomLevel, setZoomLevel] = React.useState({ start: 0, end: 100 });

  // Filter results to only include those with 'complete' status for chart data generation
  const completedResults = results.filter(r => r.status === 'complete');

  // Regenerate chartData when lastRunTimestamp changes
  const chartData = React.useMemo(() => generateMockTimeSeries(completedResults, lastRunTimestamp), [completedResults, lastRunTimestamp]);


  // Prepare Chart Config based on *all* results (for consistent coloring/legend) but only generate data for completed ones
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


    // Get the Y-axis domain based on the selected metric and data
   const getDomain = (dataKey: string): [number, number] => {
        if (!chartData || chartData.length === 0) return [0, 100]; // Default domain

        let minVal = Infinity;
        let maxVal = -Infinity;

        chartData.forEach(point => {
            completedResults.forEach(res => { // Only use completed results for domain calculation
                const value = point[`${res.connectionId}_${dataKey}`];
                if (typeof value === 'number') {
                    minVal = Math.min(minVal, value);
                    maxVal = Math.max(maxVal, value);
                }
            });
        });

        // Handle cases where min/max are still Infinity or equal
        if (minVal === Infinity || maxVal === -Infinity) return [0, 100];
        if (minVal === maxVal) return [minVal - 1, maxVal + 1]; // Add padding if all values are same

        // Add some padding to the domain
        const padding = (maxVal - minVal) * 0.1 || 1; // Ensure some padding even if range is 0

        return [Math.max(0, Math.floor(minVal - padding)), Math.ceil(maxVal + padding)];
    };

    const yAxisDomain = React.useMemo(() => getDomain(selectedMetric), [selectedMetric, chartData, completedResults]); // Use completedResults


    // Tooltip Formatter
    const formatTooltipValue = (value: number | string | undefined, name: string | undefined) => {
        if (value === undefined || name === undefined) return '';

        const metricInfo = metricOptions.find(m => name.endsWith(m.value));
        let unit = '';
        if (metricInfo?.value.includes('Time')) unit = metricInfo.value.includes('processingTime') ? 's' : 'ms';
        else if (metricInfo?.value.includes('Second')) unit = ' t/s';

        // Format value based on type
        const formattedValue = typeof value === 'number' ? value.toFixed(metricInfo?.value.includes('processingTime') ? 2 : (metricInfo?.value === 'tokensPerSecond' ? 1 : 0)) : value;


        return `${formattedValue}${unit}`;
    };


  return (
    <Card className="shadow-lg border-border">
      <CardHeader>
        <CardTitle>Performance Metrics</CardTitle>
        <CardDescription>Visualizing model performance over time</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-6 p-4 border border-input rounded-lg bg-card/50">
           <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
              {/* Metric Selector */}
              <div className="flex items-center gap-2">
                 <Label htmlFor="metric-select" className="text-sm font-medium text-muted-foreground whitespace-nowrap">
                    Metric:
                 </Label>
                 <Select
                     value={selectedMetric}
                     onValueChange={(value) => setSelectedMetric(value as MetricKey)}
                     disabled={isLoading || completedResults.length === 0} // Disable if no completed results
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

              {/* Smoothing Slider */}
              <div className="flex items-center gap-2 flex-grow md:max-w-xs">
                 <Label htmlFor="smoothing-slider" className="text-sm font-medium text-muted-foreground whitespace-nowrap">
                    Smoothing: {smoothing}%
                 </Label>
                 <Slider
                    id="smoothing-slider"
                    min={0}
                    max={100}
                    step={1}
                    value={[smoothing]}
                    onValueChange={(value) => setSmoothing(value[0])}
                    className="w-full"
                    disabled={isLoading || completedResults.length === 0} // Disable if no completed results
                 />
              </div>

              {/* Chart Actions */}
              <div className="flex items-center gap-1">
                  <Button variant="ghost" size="sm" disabled={isLoading || completedResults.length === 0}><Settings2 className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="sm" disabled={isLoading || completedResults.length === 0}><RefreshCw className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="sm" disabled={isLoading || completedResults.length === 0}><Download className="h-4 w-4" /></Button>
              </div>
           </div>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                 {/* Toggles */}
                <div className="flex items-center gap-4">
                    <div className="flex items-center space-x-2">
                        <Switch id="show-data-points" checked={showDataPoints} onCheckedChange={setShowDataPoints} disabled={isLoading || completedResults.length === 0}/>
                        <Label htmlFor="show-data-points" className="text-sm text-muted-foreground">Show Data Points</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Switch id="sync-tooltips" checked={syncTooltips} onCheckedChange={setSyncTooltips} disabled={isLoading || completedResults.length === 0}/>
                        <Label htmlFor="sync-tooltips" className="text-sm text-muted-foreground">Sync Tooltips</Label>
                    </div>
                </div>

                {/* Zoom (Placeholder) */}
                <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Zoom: 0% to 100%</span>
                    <Button variant="ghost" size="icon" className="h-7 w-7" disabled={isLoading || completedResults.length === 0}><ZoomIn className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7" disabled={isLoading || completedResults.length === 0}><ZoomOut className="h-4 w-4" /></Button>
                </div>
            </div>

        </div>

        <div className="h-[350px] w-full">
           {isLoading && completedResults.length === 0 ? ( // Show loading only if loading AND no completed results yet
              <div className="flex items-center justify-center h-full text-muted-foreground">
                 Loading chart data...
              </div>
           ) : !isLoading && completedResults.length === 0 ? ( // Show message if not loading and still no completed results
              <div className="flex items-center justify-center h-full text-muted-foreground">
                  Run a comparison to view performance metrics.
              </div>
           ) : (
             <ChartContainer config={chartConfig} className="h-full w-full">
                <LineChart
                    data={chartData}
                    margin={{ top: 5, right: 20, left: 0, bottom: 40 }} // Added bottom margin for legend
                    >
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border)/0.5)" />
                     <XAxis
                        dataKey="time" // Use the formatted time label for the axis
                        tickLine={false}
                        axisLine={false}
                        tickMargin={8}
                        tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                     />
                     <YAxis
                        domain={yAxisDomain}
                        tickLine={false}
                        axisLine={false}
                        tickMargin={8}
                        tickFormatter={(value) => {
                            // Simple formatting for large numbers (optional)
                            if (value >= 1000) return `${(value / 1000).toFixed(1)}k`;
                            return value.toString();
                         }}
                        tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                    />
                     <Tooltip
                        cursor={{ stroke: "hsl(var(--border))", strokeWidth: 1.5, strokeDasharray: "3 3" }}
                        content={
                            <ChartTooltipContent
                                indicator={showDataPoints ? "dot" : "line"} // Show dot if points are visible
                                labelKey="time" // Use time as the label in tooltip
                                formatter={formatTooltipValue}
                             />
                        }
                        shared={syncTooltips} // Use sync state for shared tooltip
                      />
                      <Legend content={<ChartLegendContent />} verticalAlign="bottom" wrapperStyle={{ paddingTop: 20 }} />
                     {completedResults.map((res) => ( // Only map completed results for drawing lines
                        <Line
                            key={res.connectionId}
                            dataKey={`${res.connectionId}_${selectedMetric}`}
                            name={res.connectionName} // Name used by Legend and Tooltip
                            type={smoothing > 0 ? "monotone" : "linear"} // Use monotone if smoothing > 0
                            stroke={`var(--color-${res.connectionId})`} // Use CSS variable from config
                            strokeWidth={2}
                            dot={showDataPoints ? (props: any) => <Dot {...props} r={3} fill={`var(--color-${res.connectionId})`} /> : false}
                            activeDot={showDataPoints ? { r: 5, strokeWidth: 1 } : false}
                            connectNulls={false} // Don't connect lines over missing data points
                            // Apply smoothing if needed (adjust tension for 'monotone')
                            // For true smoothing, data pre-processing is better
                            // Monotone 'tension' affects curve shape:
                            // tension={1 - smoothing / 100} // Example: higher smoothing = lower tension
                        />
                    ))}
                </LineChart>
             </ChartContainer>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
