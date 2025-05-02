// Defines a Genkit flow to rate the quality of LLM responses based on accuracy and helpfulness.

'use server';

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';

const RateLlmQualityInputSchema = z.object({
  response: z.string().describe('The LLM response to rate.'),
  prompt: z.string().describe('The prompt that generated the response.'),
  criteria: z.string().describe('The criteria to use when rating the response, such as accuracy and helpfulness.'),
});
export type RateLlmQualityInput = z.infer<typeof RateLlmQualityInputSchema>;

const RateLlmQualityOutputSchema = z.object({
  rating: z.number().describe('A numerical rating of the LLM response quality based on the provided criteria.'),
  explanation: z.string().describe('An explanation of why the response received the given rating.'),
});
export type RateLlmQualityOutput = z.infer<typeof RateLlmQualityOutputSchema>;

export async function rateLlmQuality(input: RateLlmQualityInput): Promise<RateLlmQualityOutput> {
  return rateLlmQualityFlow(input);
}

const rateLlmQualityPrompt = ai.definePrompt({
  name: 'rateLlmQualityPrompt',
  input: {
    schema: z.object({
      response: z.string().describe('The LLM response to rate.'),
      prompt: z.string().describe('The prompt that generated the response.'),
      criteria: z.string().describe('The criteria to use when rating the response, such as accuracy and helpfulness.'),
    }),
  },
  output: {
    schema: z.object({
      rating: z.number().describe('A numerical rating of the LLM response quality based on the provided criteria.'),
      explanation: z.string().describe('An explanation of why the response received the given rating.'),
    }),
  },
  prompt: `You are an AI-powered quality rater that evaluates LLM responses based on specific criteria.\n\nGiven the following LLM response and the prompt that generated it, rate the quality of the response based on the following criteria: {{{criteria}}}.\n\nPrompt: {{{prompt}}}\n\nResponse: {{{response}}}\n\nProvide a numerical rating (1-10) and an explanation for your rating.\n`,
});

const rateLlmQualityFlow = ai.defineFlow<
  typeof RateLlmQualityInputSchema,
  typeof RateLlmQualityOutputSchema
>({
  name: 'rateLlmQualityFlow',
  inputSchema: RateLlmQualityInputSchema,
  outputSchema: RateLlmQualityOutputSchema,
},
async input => {
  const {output} = await rateLlmQualityPrompt(input);
  return output!;
}
);
