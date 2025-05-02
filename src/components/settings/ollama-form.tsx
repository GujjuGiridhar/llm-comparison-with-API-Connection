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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const OllamaFormSchema = z.object({
  connectionName: z.string().min(1, "Connection name is required."),
  baseUrl: z.string().url("Invalid URL.").default("http://localhost:11434"),
  // Model is initially optional, becomes required after successful test with models
  model: z.string().optional(),
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
}).refine(data => {
    // This refinement makes `model` required if the form is submitted.
    // We handle the "required after test" logic via button disabling.
    return !!data.model;
}, {
    message: "Please select a model after testing the connection.",
    path: ["model"], // Path of the error
});


export type OllamaFormValues = z.infer<typeof OllamaFormSchema>;

type OllamaFormProps = {
  onSubmit: (data: OllamaFormValues) => void;
  onCancel: () => void;
  initialData?: OllamaFormValues; // Add initialData prop
  isLoading?: boolean;
};

export function OllamaForm({
  onSubmit,
  onCancel,
  initialData, // Use initialData
  isLoading = false,
}: OllamaFormProps) {
  const form = useForm<OllamaFormValues>({
    resolver: zodResolver(OllamaFormSchema),
    // Use initialData if provided, otherwise use defaults
    defaultValues: initialData || {
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
  const [hasTestedSuccessfullyWithModels, setHasTestedSuccessfullyWithModels] = React.useState(false);


   // Pre-populate models and test status if initialData exists and has a model
   React.useEffect(() => {
     if (initialData?.model && initialData.baseUrl) {
       // Simulate a successful test to pre-load models for editing
       // In a real app, you might fetch models again or trust initialData
       const mockModels = [initialData.model, "llama3:latest", "mistral:latest", "codegemma:7b"].filter((v, i, a) => a.indexOf(v) === i); // Ensure unique, includes initial model
       setModels(mockModels);
       setTestResult({ success: true, message: "Connection previously established." });
       setHasTestedSuccessfullyWithModels(true);
       form.setValue('model', initialData.model); // Ensure model is set in the form
     }
   }, [initialData, form]);

  const handleTestClick = async () => {
    setIsTesting(true);
    setTestResult(null);
    setModels([]);
    setHasTestedSuccessfullyWithModels(false);
    form.setValue('model', ''); // Reset model selection
    form.clearErrors('model'); // Clear model validation error if any
    const baseUrl = form.getValues("baseUrl");

    try {
      console.log(`Testing connection to ${baseUrl}...`);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate network delay

      // --- Mock API Call ---
      let result: { success: boolean; models: string[]; message?: string };
      if (baseUrl.includes("localhost") || baseUrl.includes("127.0.0.1")) { // Simple check for mock success
         const mockModels = ["llama3:latest", "mistral:latest", "codegemma:7b", "phi3:mini"];
         result = { success: true, models: mockModels, message: `Connection successful. Found ${mockModels.length} models.` };
         setModels(mockModels);
         if (mockModels.length > 0) {
           setHasTestedSuccessfullyWithModels(true);
           // Optionally select the first model or the initial model if it exists in the list
           const modelToSelect = initialData?.model && mockModels.includes(initialData.model) ? initialData.model : (mockModels[0] || "");
           form.setValue('model', modelToSelect, { shouldValidate: true });
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
      setHasTestedSuccessfullyWithModels(false);
    } finally {
      setIsTesting(false);
    }
  };


   // Determine if the save button should be enabled
   // Requires a successful test AND a selected model
   const canSaveChanges = form.formState.isValid && hasTestedSuccessfullyWithModels && !!form.watch('model');


  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <h3 className="text-lg font-medium mb-4 text-foreground">{initialData ? 'Edit' : 'Add'} Ollama Connection</h3>
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
                         setHasTestedSuccessfullyWithModels(false); // Reset test success state
                         form.setValue('model', ''); // Reset model selection
                         form.clearErrors('model');
                     }}
                  />
                </FormControl>
                 <Button type="button" variant="outline" onClick={handleTestClick} disabled={isLoading || isTesting || !form.watch('baseUrl')}>
                   {isTesting ? "Testing..." : "Test Connection"}
                 </Button>
              </div>
              <FormDescription>
                The URL where your Ollama instance is running.
              </FormDescription>
              <FormMessage /> {/* For URL validation errors */}
            </FormItem>
          )}
        />

         {/* Test Connection Results */}
         {testResult && (
           <Alert variant={testResult.success ? "success" : "destructive"} className={testResult.success ? "border-green-500/50 dark:border-green-600/60" : ""}>
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
                 onValueChange={(value) => field.onChange(value)} // Ensure value updates form state
                 value={field.value || ""} // Use controlled value, default to "" if undefined/null
                 disabled={isLoading || models.length === 0 || isTesting}
               >
                <FormControl>
                   <SelectTrigger>
                     <SelectValue placeholder={
                       isTesting ? "Loading models..." :
                       !testResult ? "Test connection first" :
                       !testResult.success ? "Connection failed" :
                       models.length === 0 ? "No models found" :
                       "Select a model"
                     } />
                   </SelectTrigger>
                </FormControl>
                <SelectContent>
                   {models.map((modelName) => (
                     <SelectItem key={modelName} value={modelName}>
                       {modelName}
                     </SelectItem>
                   ))}
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
                  <Input type="number" placeholder="4096" {...field} value={field.value ?? ''} onChange={e => field.onChange(e.target.value === '' ? undefined : Number(e.target.value))} disabled={isLoading} />
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
                      if (val === '' || val.toLowerCase() === 'auto' || /^\d+$/.test(val)) {
                         const processedVal = val.toLowerCase() === 'auto' ? 'auto' : (val === '' ? undefined : Number(val));
                         field.onChange(processedVal);
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
                  <Input type="number" step="0.1" min="0" max="1" placeholder="0.7" {...field} value={field.value ?? ''} onChange={e => field.onChange(e.target.value === '' ? undefined : Number(e.target.value))} disabled={isLoading} />
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
                  <Input type="number" placeholder="2048" {...field} value={field.value ?? ''} onChange={e => field.onChange(e.target.value === '' ? undefined : Number(e.target.value))} disabled={isLoading} />
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
            {isLoading ? "Saving..." : (initialData ? "Update Connection" : "Save Connection")}
          </Button>
        </div>
      </form>
    </Form>
  );
}
