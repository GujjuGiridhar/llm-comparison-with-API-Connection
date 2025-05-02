"use client"; // Make this a client component

import * as React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus } from "lucide-react";

// Note: Removed Metadata export as it's better handled in layout for client components
// If needed dynamically, use useEffect hook

export default function SettingsPage() {
   // Dynamic title update for client component
  React.useEffect(() => {
    document.title = 'Settings | LLM Comparo';
    // You might need a more robust way to handle metadata in client components
    const descriptionMeta = document.querySelector('meta[name="description"]');
    if (descriptionMeta) {
      descriptionMeta.setAttribute('content', 'Configure model connections.');
    }
  }, []);

  return (
    <main className="container mx-auto px-4 py-8 md:py-12">
      <header className="mb-8 md:mb-12"> {/* Removed text-center */}
        <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
          Settings
        </h1>
        {/* Optional: Add a description back if needed
         <p className="text-muted-foreground">
           Configure your model connections.
         </p>
        */}
      </header>

      <div className="max-w-4xl mx-auto space-y-8"> {/* Increased max-width */}
        <Card className="shadow-lg border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-4"> {/* Adjusted layout */}
            <CardTitle className="text-xl">Model Connections</CardTitle>
             <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
               <Plus className="mr-2 h-4 w-4" />
               Add Connection
             </Button>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="ollama" className="w-full">
              <TabsList className="grid w-full grid-cols-2"> {/* Made tabs take full width */}
                <TabsTrigger value="ollama">Ollama</TabsTrigger>
                <TabsTrigger value="api">API</TabsTrigger>
              </TabsList>
              <TabsContent value="ollama" className="mt-4 min-h-[100px] flex items-center justify-center">
                {/* Placeholder Content for Ollama */}
                <p className="text-muted-foreground">No Ollama connections configured</p>
                {/* Future: List Ollama connections here */}
              </TabsContent>
              <TabsContent value="api" className="mt-4 min-h-[100px] flex items-center justify-center">
                {/* Placeholder Content for API */}
                <p className="text-muted-foreground">No API connections configured</p>
                {/* Future: List API connections (OpenAI, Google, Anthropic etc.) here */}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Removed the old API Keys and Model Selection Cards */}

      </div>
    </main>
  );
}
