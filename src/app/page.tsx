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
          response times, and token generation speed, and output quality to choose the right model for your needs.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Link href="/settings" passHref legacyBehavior>
            <Button
              as="a" // Render as an anchor tag for Link compatibility
              role="button" // Add role for semantics
              size="lg"
              // className="btn" // Removed potentially conflicting class
              variant="primary" // Apply primary variant for styling
            >
              <Settings className="mr-2 h-5 w-5" />
              Configure Models
            </Button>
          </Link>
          {/* The "Start Comparing" button will likely link to the /compare page */}
          <Link href="/compare" passHref legacyBehavior>
            <Button
              as="a" // Render as an anchor tag
              role="button" // Add role for semantics
              size="lg"
              variant="secondary"
              className="btn" // Apply base btn class for global hover/focus
            >
              Start Comparing <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-5xl">
        <Card className="text-left bg-card/70 border-border card-glow">
          <CardHeader className="rounded-t-lg relative overflow-hidden before:absolute before:inset-0 before:bg-gradient-to-br before:from-primary/10 before:via-transparent before:to-secondary/10 before:opacity-70 before:blur-lg"> {/* Added glowing background */}
             <div className="relative z-10"> {/* Content needs to be above the glow */}
               <DatabaseZap className="h-8 w-8 mb-2 text-primary" />
               <CardTitle>Multiple Providers</CardTitle>
             </div>
          </CardHeader>
          <CardContent>
            <CardDescription>
              Support for Ollama, OpenAI, Anthropic, Google AI, and Together AI models.
            </CardDescription>
          </CardContent>
        </Card>
        <Card className="text-left bg-card/70 border-border card-glow">
          <CardHeader className="rounded-t-lg relative overflow-hidden before:absolute before:inset-0 before:bg-gradient-to-br before:from-primary/10 before:via-transparent before:to-secondary/10 before:opacity-70 before:blur-lg"> {/* Added glowing background */}
             <div className="relative z-10"> {/* Content needs to be above the glow */}
               <BarChart className="h-8 w-8 mb-2 text-primary" />
               <CardTitle>Real-time Analysis</CardTitle>
             </div>
          </CardHeader>
          <CardContent>
            <CardDescription>
              Compare response times, token generation speed, and output quality.
            </CardDescription>
          </CardContent>
        </Card>
        <Card className="text-left bg-card/70 border-border card-glow">
          <CardHeader className="rounded-t-lg relative overflow-hidden before:absolute before:inset-0 before:bg-gradient-to-br before:from-primary/10 before:via-transparent before:to-secondary/10 before:opacity-70 before:blur-lg"> {/* Added glowing background */}
             <div className="relative z-10"> {/* Content needs to be above the glow */}
               <Puzzle className="h-8 w-8 mb-2 text-primary" />
               <CardTitle>Easy Configuration</CardTitle>
             </div>
          </CardHeader>
          <CardContent>
            <CardDescription>
              Simple setup with API keys and custom model configurations via proxy.
            </CardDescription>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
