
import { InteractionMetric, LearningProfile, Sentiment, UserIntent, AlanSettings } from "../types";
import { memoryService } from "./memoryService";

/**
 * LAYER 10: LEARNING & SELF-OPTIMIZATION MODULE
 * 
 * Functions:
 * - Analyzes interaction history
 * - Updates internal profile (adaptation)
 * - Suggests system tweaks based on patterns
 */

export const getInitialProfile = (): LearningProfile => ({
    totalInteractions: 0,
    intentCounts: {},
    toolUsage: {},
    averageSentimentScore: 0,
    adaptationLevel: 0,
    suggestedOptimizations: []
});

export const learningService = {

    /**
     * Logs an interaction and saves it to Memory Core
     */
    logInteraction: async (
        intent: UserIntent, 
        sentiment: Sentiment, 
        success: boolean, 
        toolUsed?: string
    ) => {
        const metric: InteractionMetric = {
            id: crypto.randomUUID(),
            timestamp: Date.now(),
            intent,
            sentiment,
            success,
            toolUsed
        };
        await memoryService.saveMetric(metric);
        console.log("[LEARNING_CORE] Interaction Logged:", metric);
    },

    /**
     * Re-builds the Learning Profile by analyzing all historical data.
     */
    analyzeProfile: async (): Promise<LearningProfile> => {
        const metrics = await memoryService.getAllMetrics();
        const profile = getInitialProfile();

        if (metrics.length === 0) return profile;

        profile.totalInteractions = metrics.length;
        
        let sentimentSum = 0;

        metrics.forEach(m => {
            // Count Intents
            profile.intentCounts[m.intent] = (profile.intentCounts[m.intent] || 0) + 1;

            // Count Tools
            if (m.toolUsed && m.toolUsed !== 'NONE') {
                profile.toolUsage[m.toolUsed] = (profile.toolUsage[m.toolUsed] || 0) + 1;
            }

            // Sentiment Score
            if (m.sentiment === Sentiment.POSITIVE) sentimentSum += 1;
            else if (m.sentiment === Sentiment.NEGATIVE) sentimentSum -= 1;
        });

        profile.averageSentimentScore = parseFloat((sentimentSum / metrics.length).toFixed(2));
        
        // Calculate Adaptation Level based on data quantity
        // Assume 50 interactions is "Full Adaptation" for this demo
        profile.adaptationLevel = Math.min(Math.round((metrics.length / 50) * 100), 100);

        // Generate Optimization Suggestions
        profile.suggestedOptimizations = generateSuggestions(profile);

        return profile;
    },

    /**
     * Applies learned optimizations to settings automatically
     */
    autoOptimize: (settings: AlanSettings, profile: LearningProfile): AlanSettings => {
        let newSettings = { ...settings };

        // Example Logic: If user is consistently negative, reduce humor
        if (profile.averageSentimentScore < -0.3 && settings.humorLevel > 20) {
            newSettings.humorLevel = Math.max(0, settings.humorLevel - 10);
            console.log("[LEARNING_CORE] Auto-adjusting: Lowering Humor due to negative feedback.");
        }

        // Example Logic: If user is consistently positive, slightly increase humor
        if (profile.averageSentimentScore > 0.5 && settings.humorLevel < 80) {
             newSettings.humorLevel = Math.min(100, settings.humorLevel + 5);
             console.log("[LEARNING_CORE] Auto-adjusting: Increasing Humor due to positive rapport.");
        }

        return newSettings;
    }
};

const generateSuggestions = (profile: LearningProfile): string[] => {
    const suggestions: string[] = [];

    // Analyze Tools
    const topTool = Object.entries(profile.toolUsage).sort((a,b) => b[1] - a[1])[0];
    if (topTool) {
        suggestions.push(`High usage of ${topTool[0]} detected. Prioritizing ${topTool[0]} resources.`);
    }

    // Analyze Sentiment
    if (profile.averageSentimentScore < -0.2) {
        suggestions.push("User sentiment trending negative. Reduce personality quirks.");
    } else if (profile.averageSentimentScore > 0.5) {
        suggestions.push("Strong rapport established. Adaptation successful.");
    }

    // Analyze Intent
    if ((profile.intentCounts[UserIntent.COMMAND] || 0) > (profile.intentCounts[UserIntent.CHAT] || 0) * 2) {
        suggestions.push("User prefers direct commands over chat. Switching to Brief Mode recommended.");
    }

    return suggestions;
};
