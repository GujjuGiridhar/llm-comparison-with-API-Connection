"use client";

import type * as React from 'react';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Send } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const FormSchema = z.object({
  prompt: z.string().min(1, {
    message: "Prompt cannot be empty.",
  }),
});

type PromptFormProps = {
  onSubmit: (data: z.infer<typeof FormSchema>) => void;
  isLoading?: boolean;
};

export function PromptForm({ onSubmit, isLoading = false }: PromptFormProps) {
  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      prompt: "",
    },
  });

  return (
    <Card className="w-full shadow-lg bg-card border-border">
      <CardHeader>
        <CardTitle>Enter Your Prompt</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="prompt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel htmlFor="prompt-textarea" className="text-foreground">Prompt</FormLabel>
                  <FormControl>
                    <Textarea
                      id="prompt-textarea"
                      placeholder="e.g., Explain the concept of quantum entanglement in simple terms."
                      className="min-h-[100px] resize-none bg-input border-border text-foreground placeholder:text-muted-foreground"
                      disabled={isLoading}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isLoading} className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
              {isLoading ? (
                <div className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-accent-foreground" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Generating...
                </div>
              ) : (
                <>
                  Generate Responses <Send className="ml-2 h-4 w-4" /> {/* Adjusted icon size */}
                </>
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
