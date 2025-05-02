"use client";

import * as React from "react";
import { useState } from "react";
import type { z } from "zod";

import { PromptForm } from "@/components/prompt-form";
import { ResponseCard } from "@/components/response-card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { rateLlmQuality, type RateLlmQualityInput, type RateLlmQualityOutput } from "@/ai/flows/rate-llm-quality"; // Import the AI flow

// Mock LLM response generation - replace with actual API calls if needed
const generateMockResponse = async (prompt: string, modelName: string): Promise<string> => {
  await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1500)); // Simulate network delay
  if (prompt.toLowerCase().includes("error")) {
     throw new Error(`Simulated error from ${modelName}`);
  }
  return `Response from ${modelName} for prompt: "${prompt}".\n\nThis is a simulated response demonstrating the capability of ${modelName}. It might discuss topics like ${Math.random() > 0.5 ? 'AI ethics' : 'quantum computing'} or ${Math.random() > 0.5 ? 'the future of web development' : 'culinary arts'}. The length varies slightly to mimic real LLM behavior. Random number: ${Math.random()}`;
};

type RatingState = RateLlmQualityOutput | null;

export default function Home() {
  const [prompt, setPrompt] = useState<string>("");
  const [response1, setResponse1] = useState<string | undefined>(undefined);
  const [response2, setResponse2] = useState<string | undefined>(undefined);
  const [rating1, setRating1] = useState<RatingState>(null);
  const [rating2, setRating2] = useState<RatingState>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { toast } = useToast();

  const handlePromptSubmit = async (data: { prompt: string }) => {
    setIsLoading(true);
    setPrompt(data.prompt);
    setResponse1(undefined);
    setResponse2(undefined);
    setRating1(null);
    setRating2(null);

    try {
      // Generate responses (concurrently)
      const [res1, res2] = await Promise.all([
        generateMockResponse(data.prompt, "LLM Model Alpha"),
        generateMockResponse(data.prompt, "LLM Model Beta"),
      ]);

      setResponse1(res1);
      setResponse2(res2);

      // Rate responses (sequentially or concurrently, depends on preference/API limits)
      const criteria = "accuracy, helpfulness, clarity, and conciseness";
      const ratingInput1: RateLlmQualityInput = { prompt: data.prompt, response: res1, criteria };
      const ratingInput2: RateLlmQualityInput = { prompt: data.prompt, response: res2, criteria };

      try {
        const [rateOutput1, rateOutput2] = await Promise.all([
            rateLlmQuality(ratingInput1),
            rateLlmQuality(ratingInput2)
        ]);
        setRating1(rateOutput1);
        setRating2(rateOutput2);
      } catch (ratingError) {
         console.error("AI Rating Error:", ratingError);
         toast({
           title: "AI Rating Failed",
           description: "Could not get AI quality ratings for the responses.",
           variant: "destructive",
         });
         // Still show responses even if rating fails
         setRating1(null); // Ensure ratings are cleared on error
         setRating2(null);
      }

    } catch (error) {
      console.error("Error generating responses:", error);
      toast({
        title: "Error Generating Responses",
        description: error instanceof Error ? error.message : "An unknown error occurred.",
        variant: "destructive",
      });
      setResponse1("Error generating response.");
      setResponse2("Error generating response.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="container mx-auto px-4 py-8 md:py-12">
      <header className="text-center mb-8 md:mb-12">
        <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
          LLM Showdown
        </h1>
        <p className="text-muted-foreground">
          Compare and rate Large Language Model responses side-by-side.
        </p>
      </header>

      <div className="mb-8">
        <PromptForm onSubmit={handlePromptSubmit} isLoading={isLoading} />
      </div>

      {(isLoading || response1 || response2) && (
        <>
          <Separator className="my-8" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ResponseCard
              title="LLM Model Alpha"
              response={response1}
              rating={rating1?.rating}
              explanation={rating1?.explanation}
              isLoading={isLoading && !response1}
            />
            <ResponseCard
              title="LLM Model Beta"
              response={response2}
              rating={rating2?.rating}
              explanation={rating2?.explanation}
              isLoading={isLoading && !response2}
            />
          </div>
        </>
      )}
    </main>
  );
}
