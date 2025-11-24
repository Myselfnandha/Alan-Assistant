
import { UserIntent, ReasoningMode, ThoughtProcess, ThoughtStep, ProcessingMetadata } from "../types";

// LAYER 3: REASONING ENGINE - Depth Controller

/**
 * Determines if the request requires Deep Reasoning (HRM) or Shallow Processing.
 */
export const determineReasoningMode = (meta: ProcessingMetadata): ReasoningMode => {
  // Complex intents trigger DEEP mode
  if (meta.intent === UserIntent.ANALYSIS || meta.intent === UserIntent.COMMAND) {
    return ReasoningMode.DEEP;
  }
  
  // High complexity detected in text (length, keywords)
  if (meta.normalizedText.length > 50 || /analyze|plan|calculate|generate|solve/i.test(meta.normalizedText)) {
    return ReasoningMode.DEEP;
  }

  return ReasoningMode.SHALLOW;
};

/**
 * Parses the Raw LLM output to extract the structured Thought Process and the Final Response.
 */
export const parseModelOutput = (rawText: string): { finalResponse: string; thoughts: ThoughtProcess | null } => {
  const thoughtBlockRegex = /<thought_process>([\s\S]*?)<\/thought_process>/;
  const match = rawText.match(thoughtBlockRegex);

  if (!match) {
    return { finalResponse: rawText, thoughts: null };
  }

  const thoughtContent = match[1];
  const steps: ThoughtStep[] = [];

  // Extract Analysis
  const analysisMatch = thoughtContent.match(/<analysis>([\s\S]*?)<\/analysis>/);
  if (analysisMatch) {
    steps.push({
      id: 'step_1',
      layer: 'HRM_L1',
      content: analysisMatch[1].trim(),
      status: 'COMPLETE'
    });
  }

  // Extract Plan
  const planMatch = thoughtContent.match(/<plan>([\s\S]*?)<\/plan>/);
  if (planMatch) {
    const planSteps = planMatch[1].match(/<step>([\s\S]*?)<\/step>/g);
    if (planSteps) {
        const planText = planSteps.map(s => s.replace(/<\/?step>/g, '').trim()).join('\n');
        steps.push({
            id: 'step_2',
            layer: 'PLANNER',
            content: planText,
            status: 'COMPLETE'
        });
    }
  }

  // Extract Critique
  const critiqueMatch = thoughtContent.match(/<critique>([\s\S]*?)<\/critique>/);
  if (critiqueMatch) {
    steps.push({
      id: 'step_3',
      layer: 'CRITIQUE',
      content: critiqueMatch[1].trim(),
      status: 'COMPLETE'
    });
  }

  // Extract Final Response (everything inside <response> or after the thought block)
  let finalResponse = rawText.replace(thoughtBlockRegex, '').trim();
  const responseTagMatch = finalResponse.match(/<response>([\s\S]*?)<\/response>/);
  if (responseTagMatch) {
    finalResponse = responseTagMatch[1].trim();
  }

  return {
    finalResponse,
    thoughts: {
      mode: ReasoningMode.DEEP,
      steps
    }
  };
};
