import { storage } from "../storage";
import { buildSystemPrompt, buildSurveyContext } from "../ai-response-schema";

/**
 * Build website context from similar content search
 */
export async function buildWebsiteContext(
  chatbotConfigId: number,
  searchQuery: string,
  maxContentLength: number = 500
): Promise<string> {
  try {
    const relevantContent = await storage.searchSimilarContent(
      chatbotConfigId,
      searchQuery,
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
  searchQuery: string
): Promise<{ 
  systemPrompt: string; 
  surveyInfo: { hasMenuRequired: boolean; questionIndex: number } 
}> {
  // Check if there's an active survey to determine which message types to show
  const { context: surveyContext, hasMenuRequired, questionIndex } = await buildActiveSurveyContext(sessionId, chatbotConfig);
  const isSurveyActive = !!surveyContext;
  
  // Base system prompt with survey context
  let systemPrompt = buildSystemPrompt(chatbotConfig, surveyContext, isSurveyActive);
  
  // Add website context if available
  if (chatbotConfig?.id) {
    const websiteContext = await buildWebsiteContext(chatbotConfig.id, searchQuery);
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