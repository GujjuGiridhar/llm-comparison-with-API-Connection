// src/lib/chart-utils.ts
import type { Connection } from "@/app/settings/page";
import type { ChartConfig } from "@/components/ui/chart";

// Function to generate default chart colors dynamically
const getDefaultChartColors = (numColors: number): string[] => {
    const colors: string[] = [];
    // Using a base hue that works well in both light/dark themes (e.g., teal/blue range)
    const baseHue = 190;
    const hueStep = 360 / Math.max(numColors, 1);
    const saturation = 65; // Adjust saturation
    const lightness = 55; // Adjust lightness

    for (let i = 0; i < numColors; i++) {
        // Distribute hues, ensuring variation
        const hue = (baseHue + i * hueStep + (i % 2) * (hueStep / 2)) % 360;
        colors.push(`hsl(${hue.toFixed(0)}, ${saturation}%, ${lightness}%)`);
    }
    return colors;
};

// Function to generate or update chart config, ensuring all connections have an entry
export const generateDefaultChartConfig = (
    connections: Connection[],
    existingConfig: ChartConfig = {}
): ChartConfig => {
    const newConfig = { ...existingConfig };
    const defaultColors = getDefaultChartColors(connections.length);
    let colorIndex = 0;

    connections.forEach((conn) => {
        if (!newConfig[conn.id] || !newConfig[conn.id].color) {
            // Assign a default color if missing or color is not set
            const assignedColor = defaultColors[colorIndex % defaultColors.length];
            newConfig[conn.id] = {
                label: conn.connectionName, // Use connection name as label by default
                ...(newConfig[conn.id] || {}), // Keep existing properties like icon if present
                color: newConfig[conn.id]?.color || assignedColor, // Use existing color if available, else assign default
            };
            colorIndex++;
        } else if (!newConfig[conn.id].label) {
             // Ensure label is set even if color exists
             newConfig[conn.id].label = conn.connectionName;
        }
    });

    // Optional: Remove entries from config that are not in the current connections list
    Object.keys(newConfig).forEach(key => {
        if (!connections.some(conn => conn.id === key)) {
            // Decide if you want to keep old configs or remove them
            // delete newConfig[key];
        }
    });

    return newConfig;
};
