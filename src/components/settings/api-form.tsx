// src/components/settings/api-form.tsx
"use client";

import * as React from "react";
import Link from 'next/link'; // Import Link for external link
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { ExternalLink } from "lucide-react"; // Import ExternalLink icon

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
// Removed Alert imports as testing is removed
// import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
// import { AlertTriangle, CheckCircle } from "lucide-react";


// Mock supported providers and their models
const supportedProviders = {
  openai: { name: "OpenAI", models: ["gpt-4o", "gpt-4-turbo", "gpt-3.5-turbo"], requiresApiKey: true, requiresApiUrl: false, defaultUrl: null, getApiKeyUrl: "https://platform.openai.com/api-keys" },
  anthropic: { name: "Anthropic", models: ["claude-3-opus-20240229", "claude-3-sonnet-20240229", "claude-3-haiku-20240307"], requiresApiKey: true, requiresApiUrl: false, defaultUrl: null, getApiKeyUrl: "https://console.anthropic.com/settings/keys" },
  google: { name: "Google AI", models: ["gemini-1.5-pro-latest", "gemini-1.5-flash-latest", "gemini-pro"], requiresApiKey: true, requiresApiUrl: false, defaultUrl: null, getApiKeyUrl: "https://aistudio.google.com/app/apikey" },
  together: { name: "Together AI", models: ["meta-llama/Llama-3-70b-chat-hf", "mistralai/Mixtral-8x7B-Instruct-v0.1", "mistralai/Mistral-7B-Instruct-v0.2"], requiresApiKey: true, requiresApiUrl: true, defaultUrl: "https://api.together.xyz/v1", getApiKeyUrl: "https://api.together.xyz/settings/api-keys" },
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
  // Added Temperature and Max Tokens
  temperature: z.preprocess(
    (val) => (val === "" ? undefined : Number(val)),
    z.number().min(0).max(2).optional().default(0.7) // Allow higher temps if needed, default 0.7
  ),
  maxTokens: z.preprocess(
    (val) => (val === "" ? undefined : Number(val)),
    z.number().int().positive().optional().default(1024) // Default 1024
  ),
}).refine(data => {
  const provider = supportedProviders[data.providerName as ProviderKey];
  return !provider?.requiresApiKey || (provider.requiresApiKey && !!data.apiKey?.trim());
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
    return !provider?.requiresApiUrl || (provider.requiresApiUrl && !!data.apiUrl?.trim());
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
      temperature: 0.7, // Add default
      maxTokens: 1024, // Add default
    },
  });

  // Removed testing state
  // const [isTesting, setIsTesting] = React.useState(false);
  // const [testResult, setTestResult] = React.useState<{ success: boolean; message: string } | null>(null);

  const selectedProviderKey = form.watch("providerName") as ProviderKey | undefined;
  const selectedProviderConfig = selectedProviderKey ? supportedProviders[selectedProviderKey] : null;
  const availableModels = selectedProviderConfig?.models || [];

  // Reset model selection and API URL when provider changes
  React.useEffect(() => {
    // Don't run this effect if initialData exists and provider hasn't changed
     if (initialData && initialData.providerName === selectedProviderKey) {
       // Ensure model is set correctly if editing
       if (selectedProviderConfig?.models.includes(initialData.model)) {
         form.setValue('model', initialData.model, { shouldValidate: true });
       } else {
         form.setValue('model', '', { shouldValidate: true }); // Reset if initial model is invalid for provider
       }
       // Set initial URL if editing
       form.setValue('apiUrl', initialData.apiUrl || (selectedProviderConfig?.defaultUrl || ''), { shouldValidate: true });
       form.trigger(['apiKey', 'apiUrl', 'model']);
       return;
     }


    if (selectedProviderKey) {
        const providerConfig = supportedProviders[selectedProviderKey];
         form.setValue('model', '', { shouldValidate: true }); // Reset model when provider changes

        // Set default API URL if provider changes and it has a default
        if (providerConfig?.requiresApiUrl) {
             form.setValue('apiUrl', providerConfig.defaultUrl || '', { shouldValidate: true });
        } else {
             form.setValue('apiUrl', '', { shouldValidate: true }); // Clear API URL if not required
        }

    } else {
       form.setValue('model', '', { shouldValidate: true });
       form.setValue('apiUrl', '', { shouldValidate: true });
    }
    form.trigger(['apiKey', 'apiUrl', 'model']); // Re-validate API key/URL/model requirements
    // Removed test result reset
    // setTestResult(null);
  }, [selectedProviderKey, form, initialData, selectedProviderConfig?.models, selectedProviderConfig?.requiresApiUrl, selectedProviderConfig?.defaultUrl]);

  // Removed handleTestClick function

  // Update canSaveChanges logic if needed (e.g., if test was required before)
  // For now, formState.isValid should be sufficient
  const canSaveChanges = form.formState.isValid;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
         <h3 className="text-lg font-medium mb-4 text-foreground">{initialData ? 'Edit API Connection' : 'Add API Connection'}</h3>
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
                 <div className="flex items-center justify-between">
                    <FormLabel>API Key</FormLabel>
                    {selectedProviderConfig.getApiKeyUrl && (
                      <Link href={selectedProviderConfig.getApiKeyUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline flex items-center">
                        Get API Key <ExternalLink className="ml-1 h-3 w-3" />
                      </Link>
                    )}
                 </div>
                <FormControl>
                   {/* Use type="password" to obscure the key */}
                  <Input type="password" placeholder="Enter your API Key" {...field} value={field.value || ''} disabled={isLoading} />
                </FormControl>
                 {/* Removed description as Get API Key link is added
                 <FormDescription>Your secret API key for {selectedProviderConfig.name}.</FormDescription>
                 */}
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {/* API URL (Base URL) */}
         {selectedProviderConfig?.requiresApiUrl && (
          <FormField
            control={form.control}
            name="apiUrl"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Base URL</FormLabel>
                 <FormControl>
                    <Input placeholder={selectedProviderConfig.defaultUrl || 'Enter API Base URL'} {...field} value={field.value || ''} disabled={isLoading} />
                 </FormControl>
                  {/* Updated Description */}
                 <FormDescription>The base URL for the API (usually you can keep the default).</FormDescription>
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
               {/* Removed description for model select */}
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Grid for Temperature & Max Tokens */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-6">
            {/* Temperature */}
            <FormField
                control={form.control}
                name="temperature"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Temperature</FormLabel>
                    <FormControl>
                    <Input type="number" step="0.1" min="0" max="2" placeholder="0.7" {...field} value={field.value ?? ''} onChange={e => field.onChange(e.target.value === '' ? undefined : Number(e.target.value))} disabled={isLoading} />
                    </FormControl>
                    {/* Removed description
                    <FormDescription>Controls randomness (0-2).</FormDescription>
                    */}
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
                    <Input type="number" placeholder="1024" {...field} value={field.value ?? ''} onChange={e => field.onChange(e.target.value === '' ? undefined : Number(e.target.value))} disabled={isLoading} />
                    </FormControl>
                    {/* Removed description
                    <FormDescription>Max response length.</FormDescription>
                    */}
                    <FormMessage />
                </FormItem>
                )}
            />
        </div>


        {/* Removed Test Connection Button and Result */}


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
