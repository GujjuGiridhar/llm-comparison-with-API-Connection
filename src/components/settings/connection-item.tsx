// src/components/settings/connection-item.tsx
"use client";

import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2 } from "lucide-react";
import type { Connection } from "@/app/settings/page"; // Import the Connection type

type ConnectionItemProps = {
  connection: Connection;
  onEdit: () => void;
  onDelete: () => void;
  onToggleActive: () => void;
};

export function ConnectionItem({ connection, onEdit, onDelete, onToggleActive }: ConnectionItemProps) {

  const getProviderDisplay = (conn: Connection): string => {
     if (conn.type === 'ollama') return 'Ollama';
     // For API type, use providerName if available, otherwise default
     return conn.providerName || 'API';
  }

   const getUrlDisplay = (conn: Connection): string => {
     if (conn.type === 'ollama') return conn.baseUrl;
     return conn.apiUrl || 'N/A';
  }


  return (
    <Card className="border border-border bg-card/50 p-4 shadow-sm hover:shadow-md transition-shadow duration-200">
      <CardContent className="p-0 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        {/* Left side: Toggle, Name, Badge */}
        <div className="flex items-center gap-3 flex-grow min-w-0">
          <Switch
            checked={connection.isActive}
            onCheckedChange={onToggleActive}
            aria-label={`Toggle ${connection.connectionName} active state`}
          />
          <div className="flex items-center gap-2 overflow-hidden">
             <span className="font-medium text-foreground truncate" title={connection.connectionName}>
                {connection.connectionName}
             </span>
             {connection.isActive && (
                <Badge variant="secondary" className="bg-green-600/20 text-green-400 border-green-600/30 whitespace-nowrap">
                  Active
                </Badge>
              )}
          </div>
        </div>

        {/* Middle: Details */}
        <div className="text-xs text-muted-foreground space-y-1 w-full sm:w-auto sm:flex-shrink-0 sm:text-right sm:ml-auto">
           <p><span className="font-medium">Provider:</span> {getProviderDisplay(connection)}</p>
           <p><span className="font-medium">Model:</span> {connection.model || 'Not Set'}</p>
           <p><span className="font-medium">URL:</span> <span className="break-all">{getUrlDisplay(connection)}</span></p>
        </div>

        {/* Right side: Actions */}
        <div className="flex gap-2 items-center flex-shrink-0">
          <Button variant="ghost" size="sm" onClick={onEdit} className="text-muted-foreground hover:text-foreground">
            <Edit className="h-4 w-4 mr-1" /> Edit
          </Button>
          <Button variant="ghost" size="sm" onClick={onDelete} className="text-destructive hover:text-destructive/80 hover:bg-destructive/10">
            <Trash2 className="h-4 w-4 mr-1" /> Delete
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
