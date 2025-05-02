// src/components/settings/api-form.tsx
"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { AlertTriangle, CheckCircle } from "lucide-react";

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

// Mock supported providers and their models
const supportedProviders = {
  openai: { name: "OpenAI", models: ["gpt-4", "gpt-3.5-turbo"], requiresApiKey: true, requiresApiUrl: false },
  anthropic: { name: "Anthropic", models: ["claude-3-opus-20240229", "claude-3-sonnet-20240229"], requiresApiKey: true, requiresApiUrl: false },
  google: { name: "Google AI", models: ["gemini-pro", "gemini-1.5-pro-latest"], requiresApiKey: true, requiresApiUrl: false },
  together: { name: "Together AI", models: ["llama-2-70b-chat", "mistral-7b-instruct"], requiresApiKey: true, requiresApiUrl: true },
  // Add more providers as needed
};

type ProviderKey = keyof typeof supportedProviders;

const ApiFormSchema = z.object({
  connectionName: z.string().min(1, "Connection name is required."),
  providerName: z.nativeEnum(Object.keys(supportedProviders).reduce((acc, key) => { acc[key] = key; return acc; }, {} as Record<ProviderKey, ProviderKey>) , {
      errorMap: () => ({ message: "Please select a valid provider." })
  }),
  apiKey: z.string().optional(), // Optional initially, made required based on provider
  apiUrl: z.string().optional(), // Optional initially, made required based on provider
  model: z.string().min(1, "Please select a model after choosing a provider."),
}).refine(data => {
  const provider = supportedProviders[data.providerName as ProviderKey];
  return !provider?.requiresApiKey || (provider.requiresApiKey && !!data.apiKey);
}, {
  message: "API Key is required for this provider.",
  path: ["apiKey"],
}).refine(data => {
    const provider = supportedProviders[data.providerName as ProviderKey];
    // Validate URL only if it's required and provided
    if (provider?.requiresApiUrl && data.apiUrl) {
        try {
            new URL(data.apiUrl);
            return true;
        } catch (_) {
            return false; // Invalid URL format
        }
    }
    // If not required, or required but not provided yet (let the other refinement handle required), pass
    return true;
}, {
    message: "Invalid API URL format.",
    path: ["apiUrl"],
}).refine(data => {
    const provider = supportedProviders[data.providerName as ProviderKey];
    // Require API URL only if the provider needs it
    return !provider?.requiresApiUrl || (provider.requiresApiUrl && !!data.apiUrl);
}, {
    message: "API URL is required for this provider.",
    path: ["apiUrl"],
});


export type ApiFormValues = z.infer<typeof ApiFormSchema>;

type ApiFormProps = {
  onSubmit: (data: ApiFormValues) => void;
  onCancel: () => void;
  initialData?: ApiFormValues;
  isLoading?: boolean;
};

export function ApiForm({
  onSubmit,
  onCancel,
  initialData,
  isLoading = false,
}: ApiFormProps) {
  const form = useForm<ApiFormValues>({
    resolver: zodResolver(ApiFormSchema),
    defaultValues: initialData || {
      connectionName: "New API Connection",
      providerName: undefined, // Start with no provider selected
      apiKey: "",
      apiUrl: "",
      model: "",
    },
  });

  const [isTesting, setIsTesting] = React.useState(false);
  const [testResult, setTestResult] = React.useState<{ success: boolean; message: string } | null>(null);

  const selectedProviderKey = form.watch("providerName") as ProviderKey | undefined;
  const selectedProviderConfig = selectedProviderKey ? supportedProviders[selectedProviderKey] : null;
  const availableModels = selectedProviderConfig?.models || [];

  // Reset model selection when provider changes
  React.useEffect(() => {
    if (selectedProviderKey) {
        // If editing and the initial model belongs to the new provider, keep it. Otherwise reset.
        if (!initialData || initialData.providerName !== selectedProviderKey || !selectedProviderConfig?.models.includes(initialData.model)) {
            form.setValue('model', '', { shouldValidate: true });
        } else {
             form.setValue('model', initialData.model, { shouldValidate: true }); // Keep existing valid model
        }
    } else {
       form.setValue('model', '', { shouldValidate: true });
    }
    form.trigger(['apiKey', 'apiUrl']); // Re-validate API key/URL requirements
    setTestResult(null); // Reset test result on provider change
  }, [selectedProviderKey, form, initialData, selectedProviderConfig?.models]);

  // Simulate testing connection (replace with actual API call if possible/needed)
  const handleTestClick = async () => {
    setIsTesting(true);
    setTestResult(null);
    const { apiKey, apiUrl, providerName } = form.getValues();
    const provider = supportedProviders[providerName as ProviderKey];

    // Basic validation before "testing"
    if (provider?.requiresApiKey && !apiKey) {
        setTestResult({ success: false, message: "API Key is required to test this connection." });
        setIsTesting(false);
        return;
    }
     if (provider?.requiresApiUrl && !apiUrl) {
        setTestResult({ success: false, message: "API URL is required to test this connection." });
        setIsTesting(false);
        return;
    }
     if (provider?.requiresApiUrl && apiUrl) {
        try {
            new URL(apiUrl); // Basic URL validation
        } catch {
             setTestResult({ success: false, message: "Invalid API URL format provided." });
             setIsTesting(false);
             return;
        }
    }


    try {
      console.log(`Testing connection for ${provider?.name}...`);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate network delay

      // --- Mock API Test Logic ---
      // For simplicity, assume test passes if required fields seem present.
      // A real test would involve making a simple call (e.g., list models)
      let success = true;
      let message = `Connection test simulated for ${provider?.name || 'provider'}. Ensure credentials are correct.`;

      if (!provider) {
        success = false;
        message = "Please select a provider first.";
      }
      // Add more specific mock failures if needed based on provider/credentials
      // else if (provider?.requiresApiKey && apiKey === 'fail') { ... }
      // --- End Mock API Test Logic ---

      setTestResult({ success, message });

    } catch (error) {
      console.error("Test connection error:", error);
      setTestResult({ success: false, message: "An error occurred during the test simulation." });
    } finally {
      setIsTesting(false);
    }
  };

  const canSaveChanges = form.formState.isValid; // Simple check for now

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
         <h3 className="text-lg font-medium mb-4 text-foreground">{initialData ? 'Edit' : 'Add'} API Connection</h3>
        {/* Connection Name */}
        <FormField
          control={form.control}
          name="connectionName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Connection Name</FormLabel>
              <FormControl>
                <Input placeholder="My OpenAI Key" {...field} disabled={isLoading} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Provider Select */}
        <FormField
          control={form.control}
          name="providerName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Provider</FormLabel>
              <Select
                onValueChange={(value) => {
                    field.onChange(value);
                }}
                value={field.value || ""}
                disabled={isLoading}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a provider (e.g., OpenAI, Anthropic)" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {Object.entries(supportedProviders).map(([key, { name }]) => (
                    <SelectItem key={key} value={key}>
                      {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* API Key */}
        {selectedProviderConfig?.requiresApiKey && (
          <FormField
            control={form.control}
            name="apiKey"
            render={({ field }) => (
              <FormItem>
                <FormLabel>API Key</FormLabel>
                <FormControl>
                  <Input type="password" placeholder="Enter your API Key" {...field} value={field.value || ''} disabled={isLoading || isTesting} />
                </FormControl>
                <FormDescription>Your secret API key for {selectedProviderConfig.name}.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {/* API URL */}
         {selectedProviderConfig?.requiresApiUrl && (
          <FormField
            control={form.control}
            name="apiUrl"
            render={({ field }) => (
              <FormItem>
                <FormLabel>API URL</FormLabel>
                 <FormControl>
                    <Input placeholder={`e.g., ${selectedProviderKey === 'together' ? 'https://api.together.xyz/v1' : 'Enter API URL'}`} {...field} value={field.value || ''} disabled={isLoading || isTesting} />
                 </FormControl>
                 <FormDescription>The base URL for the {selectedProviderConfig.name} API.</FormDescription>
                 <FormMessage />
              </FormItem>
            )}
          />
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
                value={field.value || ""}
                disabled={isLoading || !selectedProviderKey || availableModels.length === 0}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={!selectedProviderKey ? "Select a provider first" : "Select a model"} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {availableModels.map((modelName) => (
                    <SelectItem key={modelName} value={modelName}>
                      {modelName}
                    </SelectItem>
                  ))}
                  {!selectedProviderKey && <SelectItem value="-" disabled>Select a provider</SelectItem>}
                  {selectedProviderKey && availableModels.length === 0 && <SelectItem value="-" disabled>No models listed for this provider</SelectItem>}
                </SelectContent>
              </Select>
               <FormDescription>Choose the model provided by {selectedProviderConfig?.name || 'the selected provider'}.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Test Connection Button and Result */}
         {selectedProviderKey && ( // Only show test button if provider is selected
            <div className="space-y-2">
                <Button type="button" variant="outline" onClick={handleTestClick} disabled={isLoading || isTesting || !selectedProviderKey}>
                {isTesting ? "Testing..." : "Test Connection"}
                </Button>
                {testResult && (
                <Alert variant={testResult.success ? "default" : "destructive"} className={testResult.success ? "border-green-500/50 dark:border-green-600/60" : ""}>
                    {testResult.success ? <CheckCircle className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
                    <AlertTitle>{testResult.success ? "Connection Test Simulated" : "Connection Test Failed"}</AlertTitle>
                    <AlertDescription>
                    {testResult.message}
                    </AlertDescription>
                </Alert>
                )}
            </div>
         )}


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
```