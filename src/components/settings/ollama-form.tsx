// src/components/settings/ollama-form.tsx
"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { ChevronDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert"; // Using Alert for the warning

const OllamaFormSchema = z.object({
  connectionName: z.string().min(1, "Connection name is required."),
  baseUrl: z.string().url("Invalid URL.").default("http://localhost:11434"),
  model: z.string().optional(), // Model might not be selected initially
  contextSize: z.preprocess(
    (val) => (val === "" ? undefined : Number(val)),
    z.number().int().positive().optional().default(4096)
  ),
  threads: z.preprocess(
    (val) => (val === "" || String(val).toLowerCase() === "auto" ? "auto" : Number(val)),
    z.union([z.literal("auto"), z.number().int().positive()])
       .optional()
       .default("auto")
  ),
  temperature: z.preprocess(
    (val) => (val === "" ? undefined : Number(val)),
    z.number().min(0).max(1).optional().default(0.7)
  ),
  maxTokens: z.preprocess(
    (val) => (val === "" ? undefined : Number(val)),
    z.number().int().positive().optional().default(2048)
  ),
});

type OllamaFormValues = z.infer<typeof OllamaFormSchema>;

type OllamaFormProps = {
  // initialData?: Partial<OllamaFormValues>; // For editing later
  onSubmit: (data: OllamaFormValues) => void;
  onCancel: () => void;
  isLoading?: boolean;
  // onTestConnection: (baseUrl: string) => Promise<{ success: boolean; models: string[] }>; // Callback to test connection
};

export function OllamaForm({
  onSubmit,
  onCancel,
  isLoading = false,
  // initialData,
  // onTestConnection,
}: OllamaFormProps) {
  const form = useForm<OllamaFormValues>({
    resolver: zodResolver(OllamaFormSchema),
    defaultValues: {
       connectionName: "New Ollama Connection",
       baseUrl: "http://localhost:11434",
       contextSize: 4096,
       threads: "auto",
       temperature: 0.7,
       maxTokens: 2048,
      // ...initialData, // Spread initial data for editing
    },
  });

  const [isTesting, setIsTesting] = React.useState(false);
  const [models, setModels] = React.useState<string[]>([]);
  const [testError, setTestError] = React.useState<string | null>(null);

  const handleTestClick = async () => {
    setIsTesting(true);
    setTestError(null);
    setModels([]);
    const baseUrl = form.getValues("baseUrl");
    try {
      // Simulate API call
      console.log(`Testing connection to ${baseUrl}...`);
      await new Promise(resolve => setTimeout(resolve, 1000));
      // const result = await onTestConnection(baseUrl);
      const result = { success: false, models: [] }; // Placeholder

      if (result.success) {
        if (result.models.length > 0) {
          setModels(result.models);
          // Optionally select the first model?
          // form.setValue('model', result.models[0]);
        } else {
          setTestError("Connection successful, but no models found.");
        }
      } else {
        setTestError("Connection failed. Make sure Ollama is running and accessible.");
      }
    } catch (error) {
      console.error("Test connection error:", error);
      setTestError("An error occurred while testing the connection.");
    } finally {
      setIsTesting(false);
    }
  };


  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Connection Name */}
        <FormField
          control={form.control}
          name="connectionName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Connection Name</FormLabel>
              <FormControl>
                <Input placeholder="My Local Llama" {...field} disabled={isLoading} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Base URL */}
        <FormField
          control={form.control}
          name="baseUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Base URL</FormLabel>
              <div className="flex items-center space-x-2">
                <FormControl>
                  <Input placeholder="http://localhost:11434" {...field} disabled={isLoading || isTesting} />
                </FormControl>
                 <Button type="button" variant="outline" onClick={handleTestClick} disabled={isLoading || isTesting}>
                   {isTesting ? "Testing..." : "Test"}
                 </Button>
              </div>
              <FormDescription>
                The URL where your Ollama instance is running.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

         {/* Test Connection Results/Errors */}
         {(testError || (models.length === 0 && !isTesting && form.formState.isSubmitted)) && (
           <Alert variant={testError && testError.startsWith("Connection failed") ? "destructive" : "default"} className={testError && testError.startsWith("Connection failed") ? "" : "text-destructive"}>
             <AlertDescription>
               {testError || "No models found. Make sure Ollama is running and has models installed."}
             </AlertDescription>
           </Alert>
         )}


        {/* Model Select */}
        <FormField
          control={form.control}
          name="model"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Model</FormLabel>
              <Select
                 onValueChange={field.onChange}
                 defaultValue={field.value}
                 disabled={isLoading || models.length === 0}
               >
                <FormControl>
                   <SelectTrigger>
                     <SelectValue placeholder={models.length > 0 ? "Select a model" : "No models available"} />
                   </SelectTrigger>
                </FormControl>
                <SelectContent>
                   {models.map((modelName) => (
                     <SelectItem key={modelName} value={modelName}>
                       {modelName}
                     </SelectItem>
                   ))}
                   {models.length === 0 && <SelectItem value="-" disabled>No models loaded</SelectItem>}
                 </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Grid for Parameters */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-6">
          {/* Context Size */}
          <FormField
            control={form.control}
            name="contextSize"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Context Size</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="4096" {...field} value={field.value ?? ''} disabled={isLoading} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Threads */}
          <FormField
             control={form.control}
             name="threads"
             render={({ field }) => (
               <FormItem>
                 <FormLabel>Threads</FormLabel>
                 <FormControl>
                   <Input placeholder="Auto" {...field} value={field.value ?? ''} onChange={(e) => {
                      const val = e.target.value;
                      if (val.toLowerCase() === 'auto' || val === '' || /^\d+$/.test(val)) {
                        field.onChange(val.toLowerCase() === 'auto' ? 'auto' : val);
                      }
                   }} disabled={isLoading} />
                 </FormControl>
                 <FormMessage />
               </FormItem>
             )}
           />

          {/* Temperature */}
          <FormField
            control={form.control}
            name="temperature"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Temperature</FormLabel>
                <FormControl>
                  <Input type="number" step="0.1" min="0" max="1" placeholder="0.7" {...field} value={field.value ?? ''} disabled={isLoading} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Max Tokens */}
          <FormField
            control={form.control}
            name="maxTokens"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Max Tokens</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="2048" {...field} value={field.value ?? ''} disabled={isLoading} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading || isTesting || models.length === 0 && !testError?.includes('successful')} className="bg-primary text-primary-foreground hover:bg-primary/90">
            {isLoading ? "Saving..." : "Update Connection"} {/* Or "Add Connection" based on context */}
          </Button>
        </div>
      </form>
    </Form>
  );
}
