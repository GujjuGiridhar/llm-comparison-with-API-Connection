// src/components/customize-colors-dialog.tsx
"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Circle, Palette, X } from "lucide-react";
import type { Connection } from "@/app/settings/page"; // Import Connection type
import type { ChartConfig } from "@/components/ui/chart"; // Import ChartConfig type
import { cn } from "@/lib/utils";
import { generateDefaultChartConfig } from "@/lib/chart-utils"; // Import helper

type CustomizeColorsDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  connections: Connection[]; // Pass the connections used in the current comparison
  initialConfig: ChartConfig;
  onSave: (newConfig: ChartConfig) => void;
};

// Predefined color palette
const colorPalette = [
  "#ef4444", // red-500
  "#f97316", // orange-500
  "#eab308", // yellow-500
  "#22c55e", // green-500
  "#0ea5e9", // sky-500
  "#3b82f6", // blue-500
  "#8b5cf6", // violet-500
  "#ec4899", // pink-500

  "#fca5a5", // red-300
  "#fdba74", // orange-300
  "#fde047", // yellow-300
  "#86efac", // green-300
  "#7dd3fc", // sky-300
  "#93c5fd", // blue-300
  "#c4b5fd", // violet-300
  "#f9a8d4", // pink-300

  "#1f2937", // gray-800
  "#4b5563", // gray-600
  "#6b7280", // gray-500
  "#9ca3af", // gray-400
  "#0891b2", // cyan-600
  "#059669", // emerald-600
  "#7e22ce", // purple-700
  "#be185d", // pink-700

  "#ffffff", // white
  "#d1d5db", // gray-300
  "#e5e7eb", // gray-200
  "#f3f4f6", // gray-100
  "#fee2e2", // red-100
  "#ffedd5", // orange-100
  "#fef9c3", // yellow-100
  "#fecdd3", // pink-100
];


export function CustomizeColorsDialog({
  isOpen,
  onClose,
  connections,
  initialConfig,
  onSave,
}: CustomizeColorsDialogProps) {
  // Ensure initialConfig has entries for all connections being displayed
  const safeInitialConfig = React.useMemo(() => generateDefaultChartConfig(connections, initialConfig), [connections, initialConfig]);

  const [currentConfig, setCurrentConfig] = React.useState<ChartConfig>(safeInitialConfig);
  const [selectedConnectionId, setSelectedConnectionId] = React.useState<string | null>(
    connections.length > 0 ? connections[0].id : null
  );

  // Update internal state if initialConfig prop changes (e.g., due to new comparison run)
  React.useEffect(() => {
      const updatedSafeConfig = generateDefaultChartConfig(connections, initialConfig);
      setCurrentConfig(updatedSafeConfig);
      // Reset selection if the previously selected model is no longer present
      if (selectedConnectionId && !connections.some(c => c.id === selectedConnectionId)) {
          setSelectedConnectionId(connections.length > 0 ? connections[0].id : null);
      } else if (!selectedConnectionId && connections.length > 0) {
          // Select first model if none was selected
          setSelectedConnectionId(connections[0].id);
      }
  }, [initialConfig, connections, selectedConnectionId]); // Added selectedConnectionId dependency


  const handleColorSelect = (color: string) => {
    if (!selectedConnectionId) return;
    setCurrentConfig((prev) => ({
      ...prev,
      [selectedConnectionId]: {
        ...prev[selectedConnectionId], // Keep existing label/icon
        color: color, // Update color
      },
    }));
  };

  const handleCustomColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleColorSelect(e.target.value);
  };

  const handleSave = () => {
    onSave(currentConfig);
  };

  const selectedColor = selectedConnectionId ? currentConfig[selectedConnectionId]?.color : '#000000';


  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Customize Model Colors
          </DialogTitle>
        </DialogHeader>

        <div className="py-4 space-y-4">
          {/* Model Selection */}
          <div>
            <Label className="text-sm font-medium mb-2 block">Select Model</Label>
            <Tabs
              value={selectedConnectionId || ""}
              onValueChange={setSelectedConnectionId}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 h-auto flex-wrap">
                {connections.map((conn) => (
                  <TabsTrigger
                    key={conn.id}
                    value={conn.id}
                    className={cn(
                        "flex items-center gap-2 text-xs px-2 py-1.5 whitespace-nowrap truncate",
                        selectedConnectionId === conn.id ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                    )}
                    title={conn.connectionName}
                  >
                    <Circle
                      className="h-3 w-3 flex-shrink-0"
                      style={{ fill: currentConfig[conn.id]?.color, color: currentConfig[conn.id]?.color }}
                    />
                    <span className="truncate">{conn.connectionName}</span>
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
              {connections.length === 0 && <p className="text-sm text-muted-foreground italic mt-2">No models available to customize.</p>}
          </div>

          {selectedConnectionId && (
            <>
              {/* Color Palette */}
              <div>
                <Label className="text-sm font-medium mb-2 block">Color Palette</Label>
                <div className="grid grid-cols-8 gap-2">
                  {colorPalette.map((color) => (
                    <Button
                      key={color}
                      variant="outline"
                      className={cn(
                        "h-8 w-8 rounded-full p-0 border-2",
                        selectedColor?.toLowerCase() === color.toLowerCase()
                          ? "border-ring ring-2 ring-ring ring-offset-2 ring-offset-background"
                          : "border-transparent"
                      )}
                      style={{ backgroundColor: color }}
                      onClick={() => handleColorSelect(color)}
                      aria-label={`Select color ${color}`}
                    />
                  ))}
                </div>
              </div>

              {/* Custom Color Input */}
              <div>
                <Label htmlFor="custom-color-input" className="text-sm font-medium mb-2 block">Custom Color</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="custom-color-input"
                    type="color"
                    value={selectedColor}
                    onChange={handleCustomColorChange}
                    className="h-10 w-10 p-1 cursor-pointer" // Basic styling for color input
                  />
                   <Input
                       type="text"
                       value={selectedColor}
                       onChange={handleCustomColorChange} // Allow text input for hex code
                       className="h-10 flex-1 font-mono text-sm"
                       placeholder="#ffffff"
                   />
                </div>
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button onClick={handleSave} disabled={connections.length === 0}>Done</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
