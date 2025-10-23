import { storage } from "../storage";
import { buildSystemPrompt, buildSurveyContext } from "../ai-response-schema";

/**
 * Optimize search query to 15-40 tokens (60-160 chars) for better vector search
 * Language-agnostic approach that works across all languages
 */
function optimizeSearchQuery(query: string): string {
  // Normalize whitespace and trim
  let optimizedQuery = query.trim().replace(/\s+/g, ' ');
  
  // If query is within optimal range (60-160 chars), use as-is
  if (optimizedQuery.length >= 60 && optimizedQuery.length <= 160) {
    console.log(`[VECTOR_SEARCH] Query already optimal: ${optimizedQuery.length} chars`);
    return optimizedQuery;
  }
  
  // If too long, intelligently truncate at sentence/phrase boundaries
  if (optimizedQuery.length > 160) {
    // Try to cut at sentence boundaries first (. ! ? ,)
    const truncated = optimizedQuery.substring(0, 160);
    const lastPunctuation = Math.max(
      truncated.lastIndexOf('.'),
      truncated.lastIndexOf('!'),
      truncated.lastIndexOf('?'),
      truncated.lastIndexOf(',')
    );
    
    // If we found punctuation in the last 40 chars, cut there
    if (lastPunctuation > 120) {
      optimizedQuery = truncated.substring(0, lastPunctuation + 1).trim();
    } else {
      // Otherwise, try to cut at last word boundary
      const lastSpace = truncated.lastIndexOf(' ');
      optimizedQuery = lastSpace > 120 ? truncated.substring(0, lastSpace).trim() : truncated.trim();
    }
  }
  
  // If too short (< 60 chars), keep as-is - short queries can still be meaningful
  // No artificial padding needed
  
  console.log(`[VECTOR_SEARCH] Original query length: ${query.length} chars`);
  console.log(`[VECTOR_SEARCH] Optimized query length: ${optimizedQuery.length} chars`);
  console.log(`[VECTOR_SEARCH] Optimized query: "${optimizedQuery}"`);
  
  return optimizedQuery;
}

/**
 * Build website context from similar content search
 */
export async function buildWebsiteContext(
  chatbotConfigId: number,
  searchQuery: string,
  conversationHistory: Array<{ role: string; content: string }> = [],
  maxContentLength: number = 500
): Promise<string> {
  try {
    // Build contextual query by including recent conversation history
    let contextualQuery = searchQuery;
    
    // If the user message is very short (< 20 chars), add context from recent messages
    if (searchQuery.length < 20 && conversationHistory.length > 0) {
      // Get last 3 messages for context (exclude the current user message)
      const recentMessages = conversationHistory.slice(-4, -1);
      
      // Combine recent assistant messages with current query for better context
      const contextMessages = recentMessages
        .filter(msg => msg.content && msg.content.length > 10)
        .map(msg => msg.content)
        .join(' ');
      
      if (contextMessages.length > 0) {
        // Combine and ensure we don't exceed 160 chars before optimization
        const combined = `${contextMessages} ${searchQuery}`;
        contextualQuery = combined.length > 160 ? combined.substring(0, 160).trim() : combined;
        console.log(`[VECTOR_SEARCH] Short query detected, added conversation context`);
      }
    }
    
    // Optimize the search query for better vector search performance
    const optimizedQuery = optimizeSearchQuery(contextualQuery);
    
    const relevantContent = await storage.searchSimilarContent(
      chatbotConfigId,
      optimizedQuery,
      3,
    );

    if (relevantContent.length > 0) {
      return (
        "\n\nRELEVANT CONTEXT FROM WEBSITE:\n" +
        relevantContent
          .map(
            (content, index) =>
              `[${index + 1}] ${content.title || "Untitled"}\n${content.content.substring(0, maxContentLength)}...`,
          )
          .join("\n\n") +
        "\n\nUse this context to provide more accurate and relevant responses. If the context is relevant to the user's question, incorporate the information naturally into your response."
      );
    }
  } catch (error) {
    console.error("Error searching website content:", error);
  }
  
  return "";
}

/**
 * Build survey context for active surveys
 */
export async function buildActiveSurveyContext(sessionId: string, chatbotConfig?: any): Promise<{
  context: string;
  hasMenuRequired: boolean;
  questionIndex: number;
}> {
  console.log(`[SURVEY] Checking for active survey context for session: ${sessionId}`);
  
  try {
    const surveySession = await storage.getActiveSurveySession(sessionId);
    console.log(`[SURVEY AI CONTEXT] Active survey session retrieved:`, surveySession ? { 
      id: surveySession.id, 
      surveyId: surveySession.surveyId, 
      status: surveySession.status,
      currentQuestionIndex: surveySession.currentQuestionIndex,
      completionHandled: surveySession.completionHandled
    } : null);
    
    if (surveySession && surveySession.status === 'active') {
      const survey = await storage.getSurvey(surveySession.surveyId);
      console.log(`[SURVEY AI CONTEXT] Survey found:`, survey ? {
        id: survey.id,
        name: survey.name
      } : null);
      
      if (survey) {
        const context = buildSurveyContext(survey, surveySession, chatbotConfig);
        
        // Check if current question has options (requires menu)
        const currentQuestionIndex = surveySession.currentQuestionIndex || 0;
        const questions = (survey.surveyConfig as any)?.questions;
        const hasMenuRequired = !!(questions && questions[currentQuestionIndex]?.options?.length > 0);
        
        if (hasMenuRequired) {
          console.log(`[SURVEY MENU REQUIRED] Question ${currentQuestionIndex + 1} has ${questions[currentQuestionIndex].options.length} options - MENU BUBBLE REQUIRED`);
        }
        
        console.log(`[SURVEY AI CONTEXT] Built survey context (${context.length} chars) for question index ${surveySession.currentQuestionIndex}`);
        
        return {
          context,
          hasMenuRequired,
          questionIndex: currentQuestionIndex
        };
      }
    } else if (surveySession && surveySession.status === 'completed' && !surveySession.completionHandled) {
      // One-time completion context injection
      const survey = await storage.getSurvey(surveySession.surveyId);
      if (survey) {
        console.log(`[SURVEY COMPLETION] Providing one-time completion context for completed survey`);
        
        // Mark completion as handled to prevent repeated injections
        await storage.updateSurveySession(surveySession.id, {
          completionHandled: true
        });
        
        const context = buildSurveyContext(survey, surveySession, chatbotConfig);
        
        return {
          context,
          hasMenuRequired: false,
          questionIndex: surveySession.currentQuestionIndex || 0
        };
      }
    }
  } catch (error) {
    console.error("[SURVEY AI CONTEXT] Error building survey context:", error);
  }
  
  return { context: "", hasMenuRequired: false, questionIndex: -1 };
}

/**
 * Build complete system prompt with all contexts
 */
export async function buildCompleteSystemPrompt(
  chatbotConfig: any,
  sessionId: string,
  searchQuery: string,
  conversationHistory: Array<{ role: string; content: string }> = []
): Promise<{ 
  systemPrompt: string; 
  surveyInfo: { hasMenuRequired: boolean; questionIndex: number } 
}> {
  // Check if there's an active survey to determine which message types to show
  const { context: surveyContext, hasMenuRequired, questionIndex } = await buildActiveSurveyContext(sessionId, chatbotConfig);
  const isSurveyActive = !!surveyContext;
  
  // Base system prompt with survey context
  let systemPrompt = buildSystemPrompt(chatbotConfig, surveyContext, isSurveyActive);
  
  // Add website context if available, including conversation history for better context
  if (chatbotConfig?.id) {
    const websiteContext = await buildWebsiteContext(
      chatbotConfig.id, 
      searchQuery,
      conversationHistory
    );
    systemPrompt += websiteContext;
  }
  
  // Survey context is already included in buildSystemPrompt above
  
  if (surveyContext) {
    console.log(`[SURVEY] Using survey context in system prompt`);
  }
  
  return {
    systemPrompt,
    surveyInfo: { hasMenuRequired, questionIndex }
  };
}