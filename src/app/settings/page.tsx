// src/app/settings/page.tsx
import * as React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: 'Settings | LLM Comparo',
  description: 'Configure API keys and model settings.',
};

export default function SettingsPage() {
  return (
    <main className="container mx-auto px-4 py-8 md:py-12">
      <header className="text-center mb-8 md:mb-12">
        <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
          Settings
        </h1>
        <p className="text-muted-foreground">
          Configure your API keys and model preferences.
        </p>
      </header>

      <div className="max-w-2xl mx-auto space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>API Keys</CardTitle>
            <CardDescription>Enter your API keys for different LLM providers.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="openai-key">OpenAI API Key</Label>
              <Input id="openai-key" type="password" placeholder="sk-..." />
            </div>
            <div className="space-y-2">
              <Label htmlFor="google-key">Google AI API Key</Label>
              <Input id="google-key" type="password" placeholder="AIza..." />
            </div>
             <div className="space-y-2">
              <Label htmlFor="anthropic-key">Anthropic API Key</Label>
              <Input id="anthropic-key" type="password" placeholder="anthropic-..." />
            </div>
            {/* Add more providers as needed */}
             <Button>Save API Keys</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Model Selection</CardTitle>
            <CardDescription>Choose the default models to compare.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Add dropdowns or selectors for choosing models */}
            <p className="text-muted-foreground italic">Model selection options coming soon...</p>
            <Button>Save Model Preferences</Button>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
