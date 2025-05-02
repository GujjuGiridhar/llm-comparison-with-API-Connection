// src/app/settings/page.tsx
"use client";

import * as React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus } from "lucide-react";
import { OllamaForm } from "@/components/settings/ollama-form"; // Import the new form

export default function SettingsPage() {
  const [showOllamaForm, setShowOllamaForm] = React.useState(false);
  const [showApiForm, setShowApiForm] = React.useState(false); // State for API form visibility

  React.useEffect(() => {
    document.title = 'Settings | LLM Comparo';
    const descriptionMeta = document.querySelector('meta[name="description"]');
    if (descriptionMeta) {
      descriptionMeta.setAttribute('content', 'Configure model connections.');
    }
  }, []);

  const handleAddOllama = () => {
    setShowOllamaForm(true);
    setShowApiForm(false); // Close API form if open
  };

  const handleAddApi = () => {
    setShowApiForm(true);
    setShowOllamaForm(false); // Close Ollama form if open
  };

  const handleCancelOllama = () => {
    setShowOllamaForm(false);
  };

  const handleCancelApi = () => {
     setShowApiForm(false);
  };

  const handleSaveOllama = (data: any) => {
    console.log("Saving Ollama connection:", data);
    // Add logic to save the connection
    setShowOllamaForm(false); // Close form after save
  };

   const handleSaveApi = (data: any) => {
    console.log("Saving API connection:", data);
    // Add logic to save the connection
    setShowApiForm(false); // Close form after save
  };


  // Determine which tab should be active based on which form is shown
  const activeTab = showOllamaForm ? "ollama" : showApiForm ? "api" : "ollama"; // Default to ollama if no form open

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
            {/* Conditionally hide Add button if a form is already open */}
            {/*!showOllamaForm && !showApiForm && (
              <Button size="sm" onClick={() => activeTab === 'ollama' ? handleAddOllama() : handleAddApi()} className="bg-primary text-primary-foreground hover:bg-primary/90">
                <Plus className="mr-2 h-4 w-4" />
                Add Connection
              </Button>
            )*/}
             {/* Keep Add button always visible, but disable if a form is shown? Or maybe handle inside tabs? */}
          </CardHeader>
          <CardContent>
            <Tabs defaultValue={activeTab} value={activeTab} className="w-full">
               {/* Show TabsList only when no form is open, or adjust logic */}
               {!showOllamaForm && !showApiForm && (
                 <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="ollama">Ollama</TabsTrigger>
                  <TabsTrigger value="api">API</TabsTrigger>
                 </TabsList>
               )}

              {/* Ollama Tab Content */}
              <TabsContent value="ollama" className="mt-4">
                {showOllamaForm ? (
                  <OllamaForm onCancel={handleCancelOllama} onSubmit={handleSaveOllama} />
                ) : (
                  <div className="min-h-[100px] flex flex-col items-center justify-center text-center space-y-4">
                    <p className="text-muted-foreground">No Ollama connections configured</p>
                    <Button size="sm" onClick={handleAddOllama} className="bg-primary text-primary-foreground hover:bg-primary/90">
                       <Plus className="mr-2 h-4 w-4" />
                       Add Ollama Connection
                     </Button>
                    {/* Future: List existing Ollama connections here */}
                  </div>
                )}
              </TabsContent>

              {/* API Tab Content */}
              <TabsContent value="api" className="mt-4">
                 {showApiForm ? (
                   // Replace with actual API form component when created
                   <div>
                     <h3 className="text-lg font-medium mb-4">Add API Connection</h3>
                     <p className="text-muted-foreground mb-4">API configuration form will go here.</p>
                     <div className="flex justify-end space-x-2">
                       <Button variant="outline" onClick={handleCancelApi}>Cancel</Button>
                       <Button onClick={() => handleSaveApi({})} className="bg-primary text-primary-foreground hover:bg-primary/90">Save API Connection</Button>
                     </div>
                   </div>
                 ) : (
                   <div className="min-h-[100px] flex flex-col items-center justify-center text-center space-y-4">
                     <p className="text-muted-foreground">No API connections configured</p>
                      <Button size="sm" onClick={handleAddApi} className="bg-primary text-primary-foreground hover:bg-primary/90">
                       <Plus className="mr-2 h-4 w-4" />
                       Add API Connection
                     </Button>
                     {/* Future: List existing API connections here */}
                   </div>
                 )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
