// src/app/compare/page.tsx
"use client"; // Add "use client" directive

import * as React from "react";
import { PromptForm } from "@/components/prompt-form";
import { ResponseCard } from "@/components/response-card";
import { Separator } from "@/components/ui/separator";
import { Metadata } from "next";

// Placeholder component for the actual comparison logic
const ComparisonComponent = () => {
  // This state and logic will be moved from the old page.tsx
  // For now, just rendering the UI structure.
  const [isLoading, setIsLoading] = React.useState(false);
  const [response1, setResponse1] = React.useState<string | undefined>(undefined);
  const [response2, setResponse2] = React.useState<string | undefined>(undefined);
  const [rating1, setRating1] = React.useState<{rating: number; explanation: string} | null>(null);
  const [rating2, setRating2] = React.useState<{rating: number; explanation: string} | null>(null);


  const handlePromptSubmit = async (data: { prompt: string }) => {
    console.log("Prompt submitted:", data.prompt);
    // Logic to fetch and rate responses will go here
    setIsLoading(true);
    // Simulate API calls
    await new Promise(resolve => setTimeout(resolve, 1500));
    setResponse1(`Mock response Alpha for: "${data.prompt}"`);
    setResponse2(`Mock response Beta for: "${data.prompt}"`);
    setRating1({ rating: 8.5, explanation: "Alpha did well." });
    setRating2({ rating: 7.2, explanation: "Beta was okay." });
    setIsLoading(false);
  };

  return (
     <>
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
     </>
  );
};


// Note: Metadata should ideally be defined in a separate Server Component or layout
// if the entire page needs to be a Client Component. For simplicity, keeping it here.
// Consider refactoring if needed for RSC best practices.
// export const metadata: Metadata = {
//   title: 'Compare Models | LLM Comparo',
//   description: 'Compare LLM responses side-by-side.',
// };

export default function ComparePage() {
  // Set metadata dynamically in Client Component if needed, or move to layout
  React.useEffect(() => {
    document.title = 'Compare Models | LLM Comparo';
    // You might need a more robust way to handle metadata in client components
    const descriptionMeta = document.querySelector('meta[name="description"]');
    if (descriptionMeta) {
      descriptionMeta.setAttribute('content', 'Compare LLM responses side-by-side.');
    }
  }, []);


  return (
    <main className="container mx-auto px-4 py-8 md:py-12">
       <header className="text-center mb-8 md:mb-12">
        <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
          Compare LLM Responses
        </h1>
        <p className="text-muted-foreground">
          Enter a prompt and see how different models respond.
        </p>
      </header>
      <ComparisonComponent />
    </main>
  );
}
