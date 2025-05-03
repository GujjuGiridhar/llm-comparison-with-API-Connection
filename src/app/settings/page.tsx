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

const LOCAL_STORAGE_KEY = 'llm_connections';

// Helper function to generate mock data
const getMockConnections = (): Connection[] => [
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
    },
    {
        id: 'mock-ollama-2',
        type: 'ollama',
        connectionName: "Local Mistral",
        baseUrl: "http://localhost:11434",
        model: "mistral:latest",
        contextSize: 8192,
        threads: "auto",
        temperature: 0.6,
        maxTokens: 4096,
        isActive: true,
    },
     {
        id: 'mock-api-1',
        type: 'api',
        providerName: 'openai', // Ensure this matches a key in supportedProviders
        connectionName: "OpenAI GPT-4o",
        apiKey: "mock-key", // Use placeholder
        apiUrl: "", // OpenAI doesn't need URL
        model: "gpt-4o",
        temperature: 0.7,
        maxTokens: 1024,
        isActive: true,
    }
];

export default function SettingsPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = React.useState<"ollama" | "api">("ollama");
  const [showForm, setShowForm] = React.useState(false);
  const [connections, setConnections] = React.useState<Connection[]>([]);
  const [editingConnection, setEditingConnection] = React.useState<Connection | null>(null);
  const [connectionToDelete, setConnectionToDelete] = React.useState<Connection | null>(null);
  const [isInitialLoadComplete, setIsInitialLoadComplete] = React.useState(false); // Track initial load


   // Load connections from localStorage on mount
  React.useEffect(() => {
    const savedConnections = localStorage.getItem(LOCAL_STORAGE_KEY);
    let loadedConnections: Connection[] = [];

    if (savedConnections) {
       try {
         // Attempt to parse existing connections
         const parsedConnections = JSON.parse(savedConnections) as Connection[];
         // Basic validation: Check if it's an array
         if (Array.isArray(parsedConnections)) {
            loadedConnections = parsedConnections;
         } else {
            console.error("Invalid data format in localStorage for connections. Expected array.");
            // Optionally clear invalid data
            // localStorage.removeItem(LOCAL_STORAGE_KEY);
         }
       } catch (error) {
         console.error("Failed to parse connections from localStorage", error);
         // Clear invalid data if parsing fails
         localStorage.removeItem(LOCAL_STORAGE_KEY);
       }
     } else {
         // ONLY add mock data if the key doesn't exist at all
         console.log("No connections found in localStorage. Adding mock data.");
         loadedConnections = getMockConnections();
         // Save mocks to localStorage for next load
         localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(loadedConnections));
     }

     setConnections(loadedConnections);
     setIsInitialLoadComplete(true); // Mark initial load as complete

  }, []); // Empty dependency array ensures this runs only once on mount

   // Save connections to localStorage whenever they change, BUT only after initial load
   React.useEffect(() => {
     // Prevent saving during the initial load phase before connections are properly set
     if (!isInitialLoadComplete) {
         return;
     }
     try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(connections));
     } catch (error) {
         console.error("Failed to save connections to localStorage", error);
         toast({
             title: "Error Saving Settings",
             description: "Could not save connection changes to local storage.",
             variant: "destructive",
         });
     }
   }, [connections, isInitialLoadComplete, toast]); // Depend on connections and the load flag


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
            ? { ...conn, ...data, type: connectionType, id: editingConnection.id, isActive: editingConnection.isActive } // Ensure ID and isActive are preserved on edit
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
      return <OllamaForm onSubmit={handleSaveConnection as (data: OllamaFormValues) => void} onCancel={handleCancelForm} initialData={editingConnection?.type === 'ollama' ? editingConnection as OllamaFormValues : undefined} isLoading={false} />;
    } else if (activeTab === 'api') {
       return <ApiForm onSubmit={handleSaveConnection as (data: ApiFormValues) => void} onCancel={handleCancelForm} initialData={editingConnection?.type === 'api' ? editingConnection as ApiFormValues : undefined} isLoading={false} />;
    }
    return null;
  };

  const renderConnectionList = () => {
    if (showForm) return null; // Don't show list when form is open

     if (!isInitialLoadComplete) {
        // Optional: Show a loading state while reading from localStorage
        return <div className="p-6 text-center text-muted-foreground">Loading connections...</div>;
     }

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
      <header className="mb-8 md:mb-12 flex justify-between items-center">
        <h1 className="text-3xl md:text-4xl font-bold text-foreground">
          Settings
        </h1>
         {/* Add Connection button moved to header, shown only when list is visible */}
         {!showForm && (
              <Button size="sm" onClick={handleAddConnectionClick} className="bg-primary text-primary-foreground hover:bg-primary/90">
                <Plus className="mr-2 h-4 w-4" />
                Add Connection
              </Button>
          )}
      </header>

      <div className="max-w-4xl mx-auto space-y-8">
        <Card className="shadow-lg border-border">
           {/* Card Header - Show title or form status */}
          <CardHeader className="pb-4">
               <CardTitle className="text-xl">{showForm ? (editingConnection ? 'Edit Connection' : 'Add New Connection') : 'Model Connections'}</CardTitle>
          </CardHeader>

          <CardContent>
             {/* Show tabs only when list is visible */}
            {!showForm && (
              <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "ollama" | "api")} className="w-full mb-4">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="ollama">Ollama</TabsTrigger>
                  <TabsTrigger value="api">API</TabsTrigger>
                </TabsList>
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
