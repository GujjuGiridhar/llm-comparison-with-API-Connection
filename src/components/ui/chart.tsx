"use client"

import * as React from "react"
import * as RechartsPrimitive from "recharts"

import { cn } from "@/lib/utils"

// Format: { THEME_NAME: CSS_SELECTOR }
const THEMES = { light: "", dark: ".dark" } as const

export type ChartConfig = {
  [k in string]: { // Key can be connectionId or any unique identifier
    label?: React.ReactNode
    icon?: React.ComponentType
  } & (
    | { color: string; theme?: never } // Use direct color property
    | { color?: never; theme: Record<keyof typeof THEMES, string> }
  )
}

type ChartContextProps = {
  config: ChartConfig
}

const ChartContext = React.createContext<ChartContextProps | null>(null)

function useChart() {
  const context = React.useContext(ChartContext)

  if (!context) {
    throw new Error("useChart must be used within a <ChartContainer />")
  }

  return context
}

const ChartContainer = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & {
    config: ChartConfig
    children: React.ComponentProps<
      typeof RechartsPrimitive.ResponsiveContainer
    >["children"]
  }
>(({ id, className, children, config, ...props }, ref) => {
  const uniqueId = React.useId()
  const chartId = `chart-${id || uniqueId.replace(/:/g, "")}`

  return (
    <ChartContext.Provider value={{ config }}>
      <div
        data-chart={chartId}
        ref={ref}
        className={cn(
          "flex aspect-video justify-center text-xs [&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground [&_.recharts-cartesian-grid_line[stroke='#ccc']]:stroke-border/50 [&_.recharts-curve.recharts-tooltip-cursor]:stroke-border [&_.recharts-dot[stroke='#fff']]:stroke-transparent [&_.recharts-layer]:outline-none [&_.recharts-polar-grid_[stroke='#ccc']]:stroke-border [&_.recharts-radial-bar-background-sector]:fill-muted [&_.recharts-rectangle.recharts-tooltip-cursor]:fill-muted [&_.recharts-reference-line_[stroke='#ccc']]:stroke-border [&_.recharts-sector[stroke='#fff']]:stroke-transparent [&_.recharts-sector]:outline-none [&_.recharts-surface]:outline-none",
          className
        )}
        {...props}
      >
        <ChartStyle id={chartId} config={config} />
        <RechartsPrimitive.ResponsiveContainer>
          {children}
        </RechartsPrimitive.ResponsiveContainer>
      </div>
    </ChartContext.Provider>
  )
})
ChartContainer.displayName = "Chart"

const ChartStyle = ({ id, config }: { id: string; config: ChartConfig }) => {
  const colorConfig = Object.entries(config).filter(
    ([, itemConfig]) => itemConfig.color || itemConfig.theme // Check for direct color or theme
  )

  if (!colorConfig.length) {
    return null
  }

  return (
    <style
      dangerouslySetInnerHTML={{
        __html: Object.entries(THEMES)
          .map(
            ([theme, prefix]) => `
${prefix} [data-chart=${id}] {
${colorConfig
  .map(([key, itemConfig]) => {
    // Use direct color if available, otherwise resolve theme color
    const color =
      itemConfig.color ||
      itemConfig.theme?.[theme as keyof typeof itemConfig.theme]
    return color ? `  --color-${key}: ${color};` : null
  })
  .join("\n")}
}
`
          )
          .join("\n"),
      }}
    />
  )
}


const ChartTooltip = RechartsPrimitive.Tooltip

const ChartTooltipContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<typeof RechartsPrimitive.Tooltip> &
    React.ComponentProps<"div"> & {
      hideLabel?: boolean
      hideIndicator?: boolean
      indicator?: "line" | "dot" | "dashed"
      nameKey?: string
      labelKey?: string
    }
>(
  (
    {
      active,
      payload,
      className,
      indicator = "dot",
      hideLabel = false,
      hideIndicator = false,
      label,
      labelFormatter,
      labelClassName,
      formatter,
      color, // Allow overriding color via prop
      nameKey, // Use nameKey to get the label from config
      labelKey,
    },
    ref
  ) => {
    const { config } = useChart()

    const tooltipLabel = React.useMemo(() => {
        if (hideLabel || !payload?.length) {
            return null
        }

        const item = payload[0]; // Get label from the first item in payload
        const value = labelKey ? item.payload[labelKey] : label; // Use labelKey for data field or direct label prop

        if (labelFormatter) {
            // Pass the raw label value and the full payload to the formatter
            return <div className={cn("font-medium", labelClassName)}>{labelFormatter(value, payload)}</div>;
        }

        if (!value) {
            return null;
        }

        // Default rendering of the label
        return <div className={cn("font-medium", labelClassName)}>{value}</div>;

    }, [label, labelFormatter, payload, hideLabel, labelClassName, labelKey]);


    if (!active || !payload?.length) {
      return null
    }

    const nestLabel = payload.length === 1 && indicator !== "dot"

    return (
      <div
        ref={ref}
        className={cn(
          "grid min-w-[8rem] items-start gap-1.5 rounded-lg border border-border/50 bg-background px-2.5 py-1.5 text-xs shadow-xl",
          className
        )}
      >
        {!nestLabel ? tooltipLabel : null}
        <div className="grid gap-1.5">
          {payload.map((item, index) => {
             // Extract the base key (connectionId) from the dataKey (e.g., "mock-ollama-1_tokensPerSecond" -> "mock-ollama-1")
             const key = item.dataKey?.substring(0, item.dataKey.indexOf('_')) || item.name || 'value';
             const itemConfig = config[key as keyof typeof config]; // Get config using connectionId
             const indicatorColor = color || item.color || `var(--color-${key})`; // Use prop color, item color, or CSS variable


            return (
              <div
                key={item.dataKey}
                className={cn(
                  "flex w-full flex-wrap items-stretch gap-2 [&>svg]:h-2.5 [&>svg]:w-2.5 [&>svg]:text-muted-foreground",
                  indicator === "dot" && "items-center"
                )}
              >
                {formatter && item?.value !== undefined && item.name ? (
                   formatter(item.value, item.name, item, index, item.payload) // Pass name for formatter
                ) : (
                  <>
                    {itemConfig?.icon ? (
                      <itemConfig.icon />
                    ) : (
                      !hideIndicator && (
                        <div
                          className={cn(
                            "shrink-0 rounded-[2px] border-[--color-border] bg-[--color-bg]",
                            {
                              "h-2.5 w-2.5": indicator === "dot",
                              "w-1": indicator === "line",
                              "w-0 border-[1.5px] border-dashed bg-transparent":
                                indicator === "dashed",
                              "my-0.5": nestLabel && indicator === "dashed",
                            }
                          )}
                          style={
                            {
                              "--color-bg": indicatorColor,
                              "--color-border": indicatorColor,
                            } as React.CSSProperties
                          }
                        />
                      )
                    )}
                    <div
                      className={cn(
                        "flex flex-1 justify-between leading-none",
                        nestLabel ? "items-end" : "items-center"
                      )}
                    >
                      <div className="grid gap-1.5">
                        {nestLabel ? tooltipLabel : null}
                        <span className="text-muted-foreground">
                           {itemConfig?.label || item.name} {/* Use label from config or fallback to name */}
                        </span>
                      </div>
                      {item.value !== undefined && item.value !== null && (
                        <span className="font-mono font-medium tabular-nums text-foreground">
                           {item.value.toLocaleString()} {/* Ensure value is present before formatting */}
                        </span>
                      )}
                    </div>
                  </>
                )}
              </div>
            )
          })}
        </div>
      </div>
    )
  }
)
ChartTooltipContent.displayName = "ChartTooltip"

const ChartLegend = RechartsPrimitive.Legend

const ChartLegendContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> &
    Pick<RechartsPrimitive.LegendProps, "payload" | "verticalAlign"> & {
      hideIcon?: boolean
      nameKey?: string // This prop might not be needed if payload provides enough info
    }
>(
  (
    { className, hideIcon = false, payload, verticalAlign = "bottom", nameKey },
    ref
  ) => {
    const { config } = useChart()

    if (!payload?.length) {
      return null
    }

    return (
      <div
        ref={ref}
        className={cn(
          "flex items-center justify-center gap-4 flex-wrap", // Allow wrapping
          verticalAlign === "top" ? "pb-3" : "pt-3",
          className
        )}
      >
        {payload.map((item) => {
           // Legend payload item 'id' often corresponds to the dataKey or name used in the Line component
           // Or sometimes 'value' holds the label if specified directly in Legend props
           // We assume 'id' or 'value' holds the key corresponding to our chartConfig (connectionId)
           const key = item.id || item.value || 'unknown';
           const itemConfig = config[key as keyof typeof config];
           const color = item.color || `var(--color-${key})`; // Use item color or CSS variable


          return (
            <div
              key={key} // Use the derived key
              className={cn(
                "flex items-center gap-1.5 text-xs cursor-pointer [&>svg]:h-3 [&>svg]:w-3 [&>svg]:text-muted-foreground" // Reduce font size
              )}
            >
              {itemConfig?.icon && !hideIcon ? (
                <itemConfig.icon />
              ) : (
                !hideIcon && ( // Ensure icon is not hidden
                    <div
                    className="h-2 w-2 shrink-0 rounded-[2px]"
                    style={{
                        backgroundColor: color, // Use determined color
                    }}
                    />
                )
              )}
              {/* Use label from config or fallback to item's value */}
              {itemConfig?.label || item.value}
            </div>
          )
        })}
      </div>
    )
  }
)
ChartLegendContent.displayName = "ChartLegend"

// Helper to extract item config from a payload. (Keep as is, or adapt if necessary)
function getPayloadConfigFromPayload(
  config: ChartConfig,
  payload: unknown,
  key: string // key might represent connectionId here
): ChartConfig[string] | undefined { // Return type adjusted
  if (typeof payload !== "object" || payload === null) {
    return undefined
  }

   // Direct check if the key exists in config
   if (key in config) {
       return config[key];
   }

   // Fallback or further logic if needed, e.g., checking payload structure
   // This part might need adjustment based on how Recharts structures the tooltip payload
   const payloadPayload =
     "payload" in payload &&
     typeof payload.payload === "object" &&
     payload.payload !== null
       ? payload.payload
       : undefined;

   if (payloadPayload && key in payloadPayload) {
     const configLabelKey = payloadPayload[key as keyof typeof payloadPayload];
     if (typeof configLabelKey === 'string' && configLabelKey in config) {
       return config[configLabelKey];
     }
   }

  // If no specific config found, return undefined
  return undefined
}


export {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  ChartStyle,
  type ChartConfig, // Export ChartConfig type
}
