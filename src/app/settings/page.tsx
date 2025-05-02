// src/app/settings/page.tsx
"use client";

import * as React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Trash2, Edit } from "lucide-react";
import { OllamaForm, OllamaFormValues } from "@/components/settings/ollama-form";
import { ApiForm, ApiFormValues } from "@/components/settings/api-form"; // Import API form
import { ConnectionItem } from "@/components/settings/connection-item"; // Import ConnectionItem
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/hooks/use-toast"; // Import useToast
import { buttonVariants } from "@/components/ui/button"; // Import buttonVariants

// Define connection types
export type Connection = (
  | (OllamaFormValues & { type: 'ollama'; id: string; isActive: boolean })
  | (ApiFormValues & { type: 'api'; id: string; isActive: boolean })
);


export default function SettingsPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = React.useState<"ollama" | "api">("ollama");
  const [showForm, setShowForm] = React.useState(false);
  const [connections, setConnections] = React.useState<Connection[]>([]);
  const [editingConnection, setEditingConnection] = React.useState<Connection | null>(null);
  const [connectionToDelete, setConnectionToDelete] = React.useState<Connection | null>(null);


  // --- Mock Data Loading (Replace with actual data fetching) ---
  React.useEffect(() => {
    // Simulate loading saved connections
    const savedConnections: Connection[] = [
       // Example initial connection (optional)
       {
         id: 'mock-ollama-1',
         type: 'ollama',
         connectionName: "Local Llama",
         baseUrl: "http://localhost:11434",
         model: "llama3:latest",
         contextSize: 4096,
         threads: "auto",
         temperature: 0.7,
         maxTokens: 2048,
         isActive: true,
       }
    ];
    setConnections(savedConnections);
  }, []);
   // --- End Mock Data Loading ---


  React.useEffect(() => {
    document.title = 'Settings | LLM Comparo';
    const descriptionMeta = document.querySelector('meta[name="description"]');
    if (descriptionMeta) {
      descriptionMeta.setAttribute('content', 'Configure model connections.');
    }
  }, []);

  const handleAddConnectionClick = () => {
    setEditingConnection(null); // Ensure not in edit mode
    setShowForm(true);
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingConnection(null);
  };

  const handleSaveConnection = (data: OllamaFormValues | ApiFormValues) => {
    const connectionType = activeTab; // Determine type from the active tab
    console.log(`Saving ${connectionType} connection:`, data);

    if (editingConnection) {
      // Update existing connection
      setConnections(prev =>
        prev.map(conn =>
          conn.id === editingConnection.id
            ? { ...conn, ...data, type: connectionType } // Ensure type is preserved/updated
            : conn
        )
      );
      toast({
        title: "Connection Updated",
        description: `"${data.connectionName}" has been updated.`,
      });
    } else {
      // Add new connection
      const newConnection: Connection = {
        ...data,
        id: `${connectionType}-${Date.now()}-${Math.random().toString(16).slice(2)}`, // Simple unique ID
        type: connectionType,
        isActive: true, // Default to active for new connections
      };
      setConnections(prev => [...prev, newConnection]);
      toast({
        title: "Connection Added",
        description: `"${data.connectionName}" has been added.`,
      });
    }

    setShowForm(false);
    setEditingConnection(null);
  };

  const handleEditConnection = (connection: Connection) => {
    setActiveTab(connection.type); // Switch to the correct tab
    setEditingConnection(connection);
    setShowForm(true);
  };

 const handleDeleteConnection = (connection: Connection) => {
     setConnectionToDelete(connection);
  };

  const confirmDelete = () => {
    if (connectionToDelete) {
      setConnections(prev => prev.filter(conn => conn.id !== connectionToDelete.id));
       toast({
         title: "Connection Deleted",
         description: `"${connectionToDelete.connectionName}" has been deleted.`,
         variant: "destructive",
       });
      setConnectionToDelete(null); // Close the dialog
    }
  };

  const handleToggleActive = (connectionId: string) => {
     let updatedConnName = '';
     let wasActive: boolean | undefined = undefined;
    setConnections(prev =>
      prev.map(conn => {
        if (conn.id === connectionId) {
            updatedConnName = conn.connectionName;
            wasActive = conn.isActive;
            return { ...conn, isActive: !conn.isActive };
        }
        return conn;
        })
    );

      if (updatedConnName && wasActive !== undefined) {
        toast({
          title: `Connection ${wasActive ? 'Deactivated' : 'Activated'}`, // State *before* toggle
          description: `"${updatedConnName}" is now ${wasActive ? 'inactive' : 'active'}.`, // State *after* toggle
        });
      }
  };

  const filteredConnections = connections.filter(conn => conn.type === activeTab);

  const renderForm = () => {
    if (!showForm) return null;

    if (activeTab === 'ollama') {
      return <OllamaForm onSubmit={handleSaveConnection as (data: OllamaFormValues) => void} onCancel={handleCancelForm} initialData={editingConnection as OllamaFormValues | undefined} />;
    } else if (activeTab === 'api') {
       return <ApiForm onSubmit={handleSaveConnection as (data: ApiFormValues) => void} onCancel={handleCancelForm} initialData={editingConnection as ApiFormValues | undefined} />;
    }
    return null;
  };

  const renderConnectionList = () => {
    if (showForm) return null; // Don't show list when form is open

    if (filteredConnections.length === 0) {
      return (
        <div className="min-h-[150px] flex flex-col items-center justify-center text-center space-y-4 p-6 border border-dashed border-border rounded-lg mt-4">
          <p className="text-muted-foreground">No {activeTab === 'ollama' ? 'Ollama' : 'API'} connections configured yet.</p>
          <Button size="sm" onClick={handleAddConnectionClick} className="bg-primary text-primary-foreground hover:bg-primary/90">
            <Plus className="mr-2 h-4 w-4" />
            Add {activeTab === 'ollama' ? 'Ollama' : 'API'} Connection
          </Button>
        </div>
      );
    }

    return (
      <div className="mt-4 space-y-4">
        {filteredConnections.map(conn => (
          <ConnectionItem
            key={conn.id}
            connection={conn}
            onEdit={() => handleEditConnection(conn)}
            onDelete={() => handleDeleteConnection(conn)}
            onToggleActive={() => handleToggleActive(conn.id)}
          />
        ))}
      </div>
    );
  };


  return (
    <main className="container mx-auto px-4 py-8 md:py-12">
      <header className="mb-8 md:mb-12">
        <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
          Settings
        </h1>
      </header>

      <div className="max-w-4xl mx-auto space-y-8">
        <Card className="shadow-lg border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <CardTitle className="text-xl">Model Connections</CardTitle>
            {!showForm && ( // Only show Add button if form is not visible
              <Button size="sm" onClick={handleAddConnectionClick} className="bg-primary text-primary-foreground hover:bg-primary/90">
                <Plus className="mr-2 h-4 w-4" />
                Add Connection
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {!showForm && ( // Only show tabs if form is not visible
              <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "ollama" | "api")} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="ollama">Ollama</TabsTrigger>
                  <TabsTrigger value="api">API</TabsTrigger>
                </TabsList>
                {/* Content is rendered below */}
              </Tabs>
            )}

            {/* Render Form or List based on showForm state */}
            {renderForm()}
            {renderConnectionList()}

          </CardContent>
        </Card>
      </div>

       {/* Delete Confirmation Dialog */}
       <AlertDialog open={!!connectionToDelete} onOpenChange={(open) => !open && setConnectionToDelete(null)}>
         {/* AlertDialogTrigger is not needed here as we open programmatically */}
         <AlertDialogContent>
           <AlertDialogHeader>
             <AlertDialogTitle>Are you sure?</AlertDialogTitle>
             <AlertDialogDescription>
               This action cannot be undone. This will permanently delete the connection
               <span className="font-medium text-foreground"> "{connectionToDelete?.connectionName}"</span>.
             </AlertDialogDescription>
           </AlertDialogHeader>
           <AlertDialogFooter>
             <AlertDialogCancel onClick={() => setConnectionToDelete(null)}>Cancel</AlertDialogCancel>
             <AlertDialogAction onClick={confirmDelete} className={buttonVariants({ variant: "destructive" })}>
               <Trash2 className="mr-2 h-4 w-4" /> Delete
              </AlertDialogAction>
           </AlertDialogFooter>
         </AlertDialogContent>
       </AlertDialog>
    </main>
  );
}
