// src/components/performance-chart.tsx
"use client"

import * as React from "react"
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart, // Added AreaChart
  Area, // Added Area
  PieChart, // Added PieChart
  Pie, // Added Pie
  Cell // Added Cell for PieChart colors
} from "recharts"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Settings2, RefreshCw, Download, LineChart as LineChartIcon, BarChart as BarChartIcon, AreaChart as AreaChartIcon, PieChart as PieChartIcon, Palette } from "lucide-react" // Added chart type icons and Palette
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import type { PerformanceResult } from "@/types/compare"
import { useTheme } from "next-themes" // Import useTheme

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
type ChartType = 'bar' | 'line' | 'area' | 'pie'; // Added chart types

type PerformanceChartProps = {
  results: PerformanceResult[];
  isLoading: boolean;
  chartConfig: ChartConfig; // Receive chartConfig as prop
  // Removed internal color generation, rely on passed chartConfig
};

// Function to process results for different chart types
const processResultsForChart = (results: PerformanceResult[], selectedMetric: MetricKey, chartType: ChartType): any[] => {
  const completedResults = results.filter(r => r.status === 'complete' && r[selectedMetric] !== undefined && r[selectedMetric] !== null);

  if (chartType === 'line' || chartType === 'area') {
      // Requires a common x-axis point, difficult for single-run comparison.
      // We'll adapt it to show each model as a point on a categorical axis.
      // Or maybe group by model, showing the metric value.
      // For now, let's treat it similarly to 'bar' for simplicity,
      // but structure might need rethinking for true time-series/multi-run data.
      return completedResults.map(res => ({
          name: res.connectionName,
          [res.connectionId]: res[selectedMetric], // Each model gets its own data key for Line/Area
      }));
      // A better structure for Line/Area might be:
      // [{ time: 'run1', modelA: value, modelB: value }, { time: 'run2', ... }]
      // For now, the above will plot points per model, connected if multiple runs existed.
  } else if (chartType === 'pie') {
      // Pie chart needs 'name' and 'value'
      return completedResults.map(res => ({
          name: res.connectionName,
          value: res[selectedMetric],
          fill: `var(--color-${res.connectionId})` // Use CSS variable for fill color
      }));
  } else { // Default to 'bar'
      return completedResults.map(res => ({
          name: res.connectionName,
          [selectedMetric]: res[selectedMetric], // Single metric value for the bar
          fill: `var(--color-${res.connectionId})`, // Bar color
          connectionId: res.connectionId, // Keep connectionId for tooltip/config lookup
      }));
  }
};


export function PerformanceChart({ results, isLoading, chartConfig }: PerformanceChartProps) {
  const { theme } = useTheme(); // Get current theme
  const [selectedMetric, setSelectedMetric] = React.useState<MetricKey>("tokensPerSecond");
  const [chartType, setChartType] = React.useState<ChartType>('bar'); // Default chart type

  // Filter results to only include those with 'complete' status
  const completedResults = results.filter(r => r.status === 'complete');

  // Process data for the selected chart type and metric
  const chartData = React.useMemo(
      () => processResultsForChart(completedResults, selectedMetric, chartType),
      [completedResults, selectedMetric, chartType]
  );

  const selectedMetricInfo = metricOptions.find(m => m.value === selectedMetric) as MetricInfo;

  // Tooltip Formatter
  const formatTooltipValue = (value: number | string | undefined, name: string | undefined, props: any) => {
    if (value === undefined || name === undefined) return '';

    const metricInfo = metricOptions.find(m => m.value === name);
    const unit = metricInfo?.unit || '';

    const formattedValue = typeof value === 'number'
      ? value.toFixed(name === 'processingTime' ? 2 : (name === 'tokensPerSecond' ? 1 : 0))
      : value;

    // Determine color for indicator
    let color = 'hsl(var(--foreground))'; // Default color
    const connectionId = props.payload?.connectionId || props.payload?.payload?.connectionId || name; // Try to find connectionId

    if (connectionId && chartConfig[connectionId]) {
        color = chartConfig[connectionId].color || color;
    }


    return (
       <div className="flex items-center gap-2">
          <span style={{ background: color }} className="w-2.5 h-2.5 rounded-full" />
          <span className="text-muted-foreground">{chartConfig[connectionId]?.label || name}:</span>
          <span className="font-mono font-medium tabular-nums text-foreground">{formattedValue}{unit}</span>
       </div>
    );
  };

   // Tooltip Label Formatter (Shows the model name for bar/pie, or metric name for line/area)
   const formatTooltipLabel = (label: string | number, payload: any[] | undefined) => {
     if (chartType === 'bar' || chartType === 'pie') {
        return label; // Label is the connectionName
     } else if (chartType === 'line' || chartType === 'area') {
        // For line/area, the label might be a timestamp or run index if we had multiple runs.
        // In the current single-run adaptation, 'label' might be the model name.
        // Let's return the selected metric's label.
        return selectedMetricInfo.label;
     }
     return label;
   };

   const renderChart = () => {
       switch(chartType) {
           case 'line':
               return (
                   <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                       <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border)/0.5)" />
                       <XAxis
                           dataKey="name" // Model names on X-axis for this adaptation
                           tickLine={false}
                           axisLine={false}
                           tickMargin={8}
                           tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                       />
                       <YAxis
                           tickLine={false}
                           axisLine={false}
                           tickMargin={8}
                           tickFormatter={(value) => value.toString()}
                           tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                           label={{ value: selectedMetricInfo.label + (selectedMetricInfo.unit ? ` (${selectedMetricInfo.unit.trim()})` : ''), angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: 'hsl(var(--muted-foreground))', fontSize: 12 }, dy: 60 }}
                       />
                       <Tooltip
                           cursor={{ fill: "hsl(var(--muted)/0.3)" }}
                           content={
                              <ChartTooltipContent
                                   formatter={(value, name, props) => formatTooltipValue(value, props.payload?.connectionId || name, props)} // Pass connectionId if available
                                   labelFormatter={formatTooltipLabel}
                               />
                           }
                       />
                       <Legend content={<ChartLegendContent />} verticalAlign="bottom" wrapperStyle={{ paddingTop: 20 }} />
                       {completedResults.map(res => (
                            <Line
                                key={res.connectionId}
                                type="monotone"
                                dataKey={res.connectionId} // Each line corresponds to a connection
                                name={res.connectionName} // Legend name
                                stroke={chartConfig[res.connectionId]?.color || '#8884d8'} // Use configured color
                                strokeWidth={2}
                                dot={{
                                    r: 4,
                                    fill: chartConfig[res.connectionId]?.color || '#8884d8',
                                    stroke: 'hsl(var(--background))', // Dot border matches background
                                    strokeWidth: 2,
                                }}
                                activeDot={{
                                     r: 6,
                                     fill: chartConfig[res.connectionId]?.color || '#8884d8',
                                     stroke: 'hsl(var(--background))',
                                     strokeWidth: 2,
                                }}
                           />
                       ))}
                   </LineChart>
               );
           case 'area':
                return (
                    <AreaChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                         <defs>
                              {completedResults.map((res) => (
                                <linearGradient key={`grad-${res.connectionId}`} id={`color-${res.connectionId}`} x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor={chartConfig[res.connectionId]?.color || '#8884d8'} stopOpacity={0.8}/>
                                  <stop offset="95%" stopColor={chartConfig[res.connectionId]?.color || '#8884d8'} stopOpacity={0.1}/>
                                </linearGradient>
                              ))}
                         </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border)/0.5)" />
                        <XAxis
                            dataKey="name"
                            tickLine={false}
                            axisLine={false}
                            tickMargin={8}
                            tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                        />
                        <YAxis
                            tickLine={false}
                            axisLine={false}
                            tickMargin={8}
                            tickFormatter={(value) => value.toString()}
                            tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                            label={{ value: selectedMetricInfo.label + (selectedMetricInfo.unit ? ` (${selectedMetricInfo.unit.trim()})` : ''), angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: 'hsl(var(--muted-foreground))', fontSize: 12 }, dy: 60 }}
                        />
                        <Tooltip
                            cursor={{ fill: "hsl(var(--muted)/0.3)" }}
                             content={
                              <ChartTooltipContent
                                   formatter={(value, name, props) => formatTooltipValue(value, props.payload?.connectionId || name, props)} // Pass connectionId if available
                                   labelFormatter={formatTooltipLabel}
                               />
                           }
                        />
                        <Legend content={<ChartLegendContent />} verticalAlign="bottom" wrapperStyle={{ paddingTop: 20 }} />
                         {completedResults.map(res => (
                            <Area
                                key={res.connectionId}
                                type="monotone"
                                dataKey={res.connectionId}
                                name={res.connectionName}
                                stroke={chartConfig[res.connectionId]?.color || '#8884d8'}
                                fillOpacity={1}
                                fill={`url(#color-${res.connectionId})`}
                                strokeWidth={2}
                           />
                       ))}
                    </AreaChart>
                );
           case 'pie':
               const pieLabelColor = theme === 'dark' ? '#ffffff' : '#000000'; // Dynamic label color
               return (
                   <PieChart>
                       <Tooltip
                           cursor={{ fill: "hsl(var(--muted)/0.3)" }}
                           content={
                              <ChartTooltipContent
                                   formatter={formatTooltipValue}
                                   labelFormatter={formatTooltipLabel}
                               />
                           }
                       />
                       <Legend content={<ChartLegendContent />} verticalAlign="bottom" wrapperStyle={{ paddingTop: 20 }} />
                       <Pie
                           data={chartData}
                           dataKey="value"
                           nameKey="name"
                           cx="50%"
                           cy="50%"
                           outerRadius={120} // Adjust radius as needed
                           innerRadius={50} // Make it a donut chart
                           paddingAngle={2}
                           labelLine={false}
                           label={({ cx, cy, midAngle, innerRadius, outerRadius, percent, index, name }) => {
                               const RADIAN = Math.PI / 180;
                               const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                               const x = cx + radius * Math.cos(-midAngle * RADIAN);
                               const y = cy + radius * Math.sin(-midAngle * RADIAN);
                               const percentage = (percent * 100).toFixed(0);

                               return (
                                   <text
                                       x={x}
                                       y={y}
                                       fill={pieLabelColor} // Use dynamic color
                                       textAnchor={x > cx ? 'start' : 'end'}
                                       dominantBaseline="central"
                                       fontSize={10} // Smaller font size
                                   >
                                       {`${name} (${percentage}%)`}
                                   </text>
                               );
                           }}
                       >
                           {chartData.map((entry, index) => (
                               <Cell key={`cell-${index}`} fill={entry.fill} />
                           ))}
                       </Pie>
                   </PieChart>
               );
           case 'bar':
           default:
                return (
                    <BarChart
                        data={chartData}
                        margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
                    >
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border)/0.5)" />
                         <XAxis
                            dataKey="name"
                            tickLine={false}
                            axisLine={false}
                            tickMargin={8}
                            tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                         />
                         <YAxis
                            tickLine={false}
                            axisLine={false}
                            tickMargin={8}
                            tickFormatter={(value) => value.toString()}
                            tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                            label={{ value: selectedMetricInfo.label + (selectedMetricInfo.unit ? ` (${selectedMetricInfo.unit.trim()})` : ''), angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: 'hsl(var(--muted-foreground))', fontSize: 12 }, dy: 60 }}
                        />
                         <Tooltip
                            cursor={{ fill: "hsl(var(--muted)/0.3)" }}
                            content={
                                <ChartTooltipContent
                                    formatter={formatTooltipValue}
                                    labelFormatter={formatTooltipLabel}
                                />
                            }
                          />
                          <Legend content={<ChartLegendContent />} verticalAlign="bottom" wrapperStyle={{ paddingTop: 20 }} />
                         <Bar dataKey={selectedMetric} radius={4} />
                    </BarChart>
                );
       }
   }


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

              {/* Chart Type Selector */}
               <div className="flex items-center gap-2">
                 <Label htmlFor="chart-type-select" className="text-sm font-medium text-muted-foreground whitespace-nowrap">
                    Chart Type:
                 </Label>
                  <Select
                     value={chartType}
                     onValueChange={(value) => setChartType(value as ChartType)}
                     disabled={isLoading || completedResults.length === 0}
                    >
                    <SelectTrigger id="chart-type-select" className="w-auto h-9">
                        <SelectValue placeholder="Select Type" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="bar"><BarChartIcon className="h-4 w-4 mr-2 inline-block" />Bar Chart</SelectItem>
                        <SelectItem value="line"><LineChartIcon className="h-4 w-4 mr-2 inline-block" />Line Chart</SelectItem>
                        <SelectItem value="area"><AreaChartIcon className="h-4 w-4 mr-2 inline-block" />Area Chart</SelectItem>
                        <SelectItem value="pie"><PieChartIcon className="h-4 w-4 mr-2 inline-block" />Pie Chart</SelectItem>
                    </SelectContent>
                 </Select>
               </div>

              {/* Chart Actions */}
              <div className="flex items-center gap-1 ml-auto">
                   {/* Removed Settings button, replaced with Customize Colors */}
                   {/* <Button variant="ghost" size="sm" onClick={onCustomizeColors} disabled={isLoading || completedResults.length === 0}>
                       <Palette className="h-4 w-4" />
                       <span className="sr-only">Customize Colors</span>
                   </Button> */}
                  {/* Refresh and Download remain placeholders for now */}
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
                 <ResponsiveContainer width="100%" height="100%">
                     {renderChart()}
                 </ResponsiveContainer>
             </ChartContainer>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
```