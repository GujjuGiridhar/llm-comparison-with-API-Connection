import type * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Star } from "lucide-react";

type ResponseCardProps = {
  title: string;
  response?: string;
  rating?: number;
  explanation?: string;
  isLoading: boolean;
};

export function ResponseCard({ title, response, rating, explanation, isLoading }: ResponseCardProps) {
  return (
    <Card className="flex flex-col h-full shadow-md transition-all duration-300 ease-in-out">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex-grow overflow-y-auto prose prose-sm max-w-none">
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        ) : response ? (
          <p className="text-foreground/90 whitespace-pre-wrap">{response}</p>
        ) : (
          <p className="text-muted-foreground italic">No response generated yet.</p>
        )}
      </CardContent>
      {(isLoading || rating !== undefined) && (
        <CardFooter className="mt-auto pt-4 border-t">
          {isLoading ? (
            <div className="flex items-center space-x-2 w-full">
              <Skeleton className="h-6 w-16 rounded-md" />
              <Skeleton className="h-4 w-full" />
            </div>
          ) : (
            rating !== undefined && (
              <div className="flex flex-col w-full space-y-2">
                <div className="flex items-center space-x-2">
                  <Badge variant="secondary" className="bg-secondary text-secondary-foreground">
                    <Star className="mr-1 h-4 w-4 fill-current" /> {rating.toFixed(1)}/10
                  </Badge>
                   <p className="text-sm text-muted-foreground">AI Quality Rating</p>
                </div>
                {explanation && <p className="text-xs text-muted-foreground italic">{explanation}</p>}
              </div>
            )
          )}
        </CardFooter>
      )}
    </Card>
  );
}
