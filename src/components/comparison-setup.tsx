// src/components/comparison-setup.tsx
"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { Send } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import type { Connection } from "@/app/settings/page"; // Import Connection type

const ComparisonSetupSchema = z.object({
  prompt: z.string().min(1, {
    message: "Prompt cannot be empty.",
  }),
  selectedConnectionIds: z.array(z.string()).min(1, {
    message: "Please select at least one model to compare.",
  }),
});

type ComparisonSetupValues = z.infer<typeof ComparisonSetupSchema>;

type ComparisonSetupProps = {
  connections: Connection[];
  onSubmit: (data: ComparisonSetupValues) => void;
  isLoading: boolean;
};

export function ComparisonSetup({ connections, onSubmit, isLoading }: ComparisonSetupProps) {
  const form = useForm<ComparisonSetupValues>({
    resolver: zodResolver(ComparisonSetupSchema),
    defaultValues: {
      prompt: "",
      selectedConnectionIds: [],
    },
  });

  const activeConnections = connections.filter(conn => conn.isActive);

  return (
    <Card className="w-full shadow-lg bg-card border-border">
      <CardContent className="p-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Test Prompt */}
            <FormField
              control={form.control}
              name="prompt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel htmlFor="prompt-textarea" className="text-foreground font-semibold">Test Prompt</FormLabel>
                  <FormControl>
                    <Textarea
                      id="prompt-textarea"
                      placeholder="Enter your test prompt here..."
                      className="min-h-[100px] resize-none bg-input border-border text-foreground placeholder:text-muted-foreground"
                      disabled={isLoading}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Select Models to Compare */}
            <FormField
              control={form.control}
              name="selectedConnectionIds"
              render={() => (
                <FormItem>
                  <div className="mb-2">
                    <FormLabel className="text-foreground font-semibold">Select Models to Compare</FormLabel>
                  </div>
                  {activeConnections.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {activeConnections.map((connection) => (
                        <FormField
                          key={connection.id}
                          control={form.control}
                          name="selectedConnectionIds"
                          render={({ field }) => {
                            return (
                              <FormItem
                                key={connection.id}
                                className="flex flex-row items-center space-x-3 space-y-0 rounded-md border border-input p-3 bg-input/50 hover:bg-input/75 transition-colors"
                              >
                                <FormControl>
                                  <Checkbox
                                    checked={field.value?.includes(connection.id)}
                                    onCheckedChange={(checked) => {
                                      return checked
                                        ? field.onChange([...(field.value || []), connection.id])
                                        : field.onChange(
                                            (field.value || []).filter(
                                              (value) => value !== connection.id
                                            )
                                          )
                                    }}
                                    disabled={isLoading}
                                  />
                                </FormControl>
                                <FormLabel className="font-normal text-foreground truncate cursor-pointer">
                                  {connection.connectionName} ({connection.model})
                                </FormLabel>
                              </FormItem>
                            )
                          }}
                        />
                      ))}
                    </div>
                  ) : (
                     <p className="text-sm text-muted-foreground italic">
                       No active connections found. Please configure connections in Settings.
                     </p>
                  )}
                  <FormMessage /> {/* For the array validation */}
                </FormItem>
              )}
            />

            {/* Submit Button */}
             <div className="flex justify-end">
                <Button type="submit" disabled={isLoading} className="bg-primary text-primary-foreground hover:bg-primary/90">
                {isLoading ? (
                    <div className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-primary-foreground" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Comparing...
                    </div>
                ) : (
                    'Compare Models'
                )}
                </Button>
             </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
