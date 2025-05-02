// src/components/settings/ollama-form.tsx
"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { AlertTriangle, CheckCircle } from "lucide-react"; // Import icons

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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"; // Using Alert for the warning/success

const OllamaFormSchema = z.object({
  connectionName: z.string().min(1, "Connection name is required."),
  baseUrl: z.string().url("Invalid URL.").default("http://localhost:11434"),
  model: z.string().min(1, "Please select a model after testing the connection."), // Make model required after testing
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
  onSubmit: (data: OllamaFormValues) => void;
  onCancel: () => void;
  isLoading?: boolean;
};

export function OllamaForm({
  onSubmit,
  onCancel,
  isLoading = false,
}: OllamaFormProps) {
  const form = useForm<OllamaFormValues>({
    resolver: zodResolver(OllamaFormSchema),
    defaultValues: {
       connectionName: "New Ollama Connection",
       baseUrl: "http://localhost:11434",
       model: "", // Start with empty model
       contextSize: 4096,
       threads: "auto",
       temperature: 0.7,
       maxTokens: 2048,
    },
  });

  const [isTesting, setIsTesting] = React.useState(false);
  const [models, setModels] = React.useState<string[]>([]);
  const [testResult, setTestResult] = React.useState<{ success: boolean; message: string } | null>(null);

  const handleTestClick = async () => {
    setIsTesting(true);
    setTestResult(null);
    setModels([]);
    form.setValue('model', ''); // Reset model selection
    form.clearErrors('model'); // Clear model validation error
    const baseUrl = form.getValues("baseUrl");

    try {
      console.log(`Testing connection to ${baseUrl}...`);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate network delay

      // --- Mock API Call ---
      // Simulate success if URL contains 'localhost', otherwise fail.
      // In a real app, replace this with: `await fetch(baseUrl + '/api/tags')`
      let result: { success: boolean; models: string[]; message?: string };
      if (baseUrl.includes("localhost")) {
         // Simulate finding models
         const mockModels = ["llama3:latest", "mistral:latest", "codegemma:7b"];
         result = { success: true, models: mockModels, message: `Connection successful. Found ${mockModels.length} models.` };
         setModels(mockModels);
         // Optionally set the first model as default, but only if models were found
         if (mockModels.length > 0) {
            // form.setValue('model', mockModels[0], { shouldValidate: true }); // Set and validate
         } else {
             result = { success: true, models: [], message: "Connection successful, but no models found on the server." };
         }
      } else {
         result = { success: false, models: [], message: "Connection failed. Could not reach the Ollama server at the specified Base URL. Ensure it's running and accessible." };
      }
      // --- End Mock API Call ---


      setTestResult({ success: result.success, message: result.message || (result.success ? 'Success' : 'Failure') });

    } catch (error) {
      console.error("Test connection error:", error);
      setTestResult({ success: false, message: "An error occurred while testing the connection. Check the console for details." });
      setModels([]);
    } finally {
      setIsTesting(false);
    }
  };

  // Check if the form is valid *except* for the model field,
  // which becomes valid only after a successful test with models.
  const isFormOtherwiseValid = React.useMemo(() => {
    const errors = form.formState.errors;
    return Object.keys(errors).length === 0 || (Object.keys(errors).length === 1 && errors.model);
  }, [form.formState.errors]);

   // Determine if the save button should be enabled
   const canSaveChanges = form.formState.isValid && models.length > 0 && testResult?.success === true;


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
                  <Input
                     placeholder="http://localhost:11434"
                     {...field}
                     disabled={isLoading || isTesting}
                     onChange={(e) => {
                         field.onChange(e);
                         setTestResult(null); // Reset test result on URL change
                         setModels([]); // Clear models on URL change
                         form.setValue('model', ''); // Reset model selection
                     }}
                  />
                </FormControl>
                 <Button type="button" variant="outline" onClick={handleTestClick} disabled={isLoading || isTesting || !form.getValues('baseUrl')}>
                   {isTesting ? "Testing..." : "Test Connection"}
                 </Button>
              </div>
              <FormDescription>
                The URL where your Ollama instance is running (e.g., http://localhost:11434 or http://your-server-ip:11434).
              </FormDescription>
              <FormMessage /> {/* For URL validation errors */}
            </FormItem>
          )}
        />

         {/* Test Connection Results */}
         {testResult && (
           <Alert variant={testResult.success ? "default" : "destructive"} className={testResult.success ? "border-green-500/50 dark:border-green-600/60" : ""}>
             {testResult.success ? <CheckCircle className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
             <AlertTitle>{testResult.success ? "Connection Test Successful" : "Connection Test Failed"}</AlertTitle>
             <AlertDescription>
               {testResult.message}
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
                 value={field.value} // Use controlled value
                 disabled={isLoading || models.length === 0}
               >
                <FormControl>
                   <SelectTrigger>
                     <SelectValue placeholder={isTesting ? "Loading models..." : (models.length > 0 ? "Select a model" : "Test connection to load models")} />
                   </SelectTrigger>
                </FormControl>
                <SelectContent>
                   {models.map((modelName) => (
                     <SelectItem key={modelName} value={modelName}>
                       {modelName}
                     </SelectItem>
                   ))}
                   {models.length === 0 && !isTesting && <SelectItem value="-" disabled>
                     {testResult?.success === false ? "Connection failed" : "No models found"}
                    </SelectItem>}
                 </SelectContent>
              </Select>
              <FormDescription>Select the Ollama model to use after testing the connection.</FormDescription>
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
                 <FormDescription>Max context window size.</FormDescription>
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
                      // Allow empty string, 'auto', or positive integers
                      if (val === '' || val.toLowerCase() === 'auto' || /^\d+$/.test(val)) {
                         const processedVal = val.toLowerCase() === 'auto' ? 'auto' : (val === '' ? '' : Number(val));
                         // Only update if it's 'auto' or a non-negative number
                         if (processedVal === 'auto' || (typeof processedVal === 'number' && processedVal >= 0)) {
                           field.onChange(processedVal);
                         } else if (val === '') {
                           field.onChange(undefined); // Treat empty as undefined for potential default value
                         }
                      }
                   }} disabled={isLoading} />
                 </FormControl>
                 <FormDescription>CPU threads (e.g., 4, 8, or 'auto').</FormDescription>
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
                <FormDescription>Controls randomness (0-1).</FormDescription>
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
                 <FormDescription>Max response length.</FormDescription>
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
          <Button type="submit" disabled={!canSaveChanges || isLoading} className="bg-primary text-primary-foreground hover:bg-primary/90">
            {isLoading ? "Saving..." : "Update Connection"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
