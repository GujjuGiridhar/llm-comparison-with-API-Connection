"use client";

import * as React from "react";
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Settings, ArrowRight, DatabaseZap, BarChart, Puzzle } from "lucide-react"; // Added new icons

export default function Home() {
  return (
    <main className="flex flex-col items-center justify-center min-h-[calc(100vh-3.5rem)] container mx-auto px-4 py-16 text-center">
      {/* Hero Section */}
      <section className="mb-16 max-w-3xl">
        <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-4 leading-tight">
          Compare LLM Performance<br />Make Informed Decisions
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground mb-8">
          Test and compare different language models in real-time. Analyze performance,
          response times, and quality scores to choose the right model for your needs.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90">
            <Settings className="mr-2 h-5 w-5" />
            Configure Models
          </Button>
          {/* The "Start Comparing" button will likely link to the /compare page */}
          <Link href="/compare">
            <Button size="lg" variant="secondary" className="bg-secondary text-secondary-foreground hover:bg-secondary/90 w-full sm:w-auto">
              Start Comparing <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-5xl">
        <Card className="text-left bg-card border-border shadow-lg">
          <CardHeader>
            <DatabaseZap className="h-8 w-8 mb-2 text-primary" />
            <CardTitle>Multiple Providers</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>
              Support for OpenAI, Anthropic, Google AI, Ollama, and HuggingFace models.
            </CardDescription>
          </CardContent>
        </Card>
        <Card className="text-left bg-card border-border shadow-lg">
          <CardHeader>
            <BarChart className="h-8 w-8 mb-2 text-primary" />
            <CardTitle>Real-time Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>
              Compare response times, token generation speed, and output quality.
            </CardDescription>
          </CardContent>
        </Card>
        <Card className="text-left bg-card border-border shadow-lg">
          <CardHeader>
            <Puzzle className="h-8 w-8 mb-2 text-primary" />
            <CardTitle>Easy Integration</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>
              Simple setup with API keys and custom model configurations.
            </CardDescription>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
