import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, BarChart3, Clock, Users, TrendingUp, CheckCircle, XCircle } from "lucide-react";
import { Link } from "wouter";
import { useState } from "react";
import { format } from "date-fns";

interface SurveySession {
  id: number;
  surveyId: number;
  sessionId: string;
  userId: string | null;
  currentQuestionIndex: number;
  responses: any;
  status: string;
  startedAt: string;
  completedAt?: string;
}

interface QuestionAnalytics {
  questionId: string;
  questionText: string;
  responses: any[];
  responseCount: number;
}

interface SurveyBreakdown {
  surveyId: number;
  surveyName: string;
  totalResponses: number;
  completedResponses: number;
  abandonedResponses: number;
  completionRate: number;
  avgCompletionTime: number;
  questionAnalytics: QuestionAnalytics[];
}

interface SurveyAnalyticsResponse {
  totalSurveys: number;
  totalResponses: number;
  completionRate: number;
  averageCompletionTime: number;
  surveyBreakdown: SurveyBreakdown[];
}

interface ChatbotConfig {
  id: number;
  guid: string;
  name: string;
  description: string;
}

export default function SurveyAnalytics() {
  const { guid } = useParams<{ guid: string }>();
  const [selectedSurvey, setSelectedSurvey] = useState<number | null>(null);

  // Fetch chatbot details
  const { data: chatbot } = useQuery<ChatbotConfig>({
    queryKey: [`/api/chatbots/${guid}`],
    enabled: !!guid,
  });

  // Fetch survey analytics for this chatbot
  const { data: analytics, isLoading: analyticsLoading } = useQuery<SurveyAnalyticsResponse>({
    queryKey: [`/api/chatbots/${chatbot?.id}/surveys/analytics`],
    enabled: !!chatbot?.id,
  });

  const formatTime = (milliseconds: number) => {
    if (milliseconds < 60000) {
      return `${Math.round(milliseconds / 1000)}s`;
    } else {
      return `${Math.round(milliseconds / 60000)}m`;
    }
  };

  const formatCompletionRate = (rate: number) => {
    return `${rate.toFixed(1)}%`;
  };

  const getResponseSummary = (responses: any[]) => {
    if (!responses || responses.length === 0) return "No responses";
    const uniqueResponses = Array.from(new Set(responses));
    if (uniqueResponses.length <= 3) {
      return uniqueResponses.join(", ");
    } else {
      return `${uniqueResponses.slice(0, 3).join(", ")} + ${uniqueResponses.length - 3} more`;
    }
  };

  if (analyticsLoading) {
    return (
      <div className="container max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  const selectedSurveyData = analytics?.surveyBreakdown.find(s => s.surveyId === selectedSurvey);

  return (
    <div className="container max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8" data-testid="survey-analytics-page">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link href="/dashboard" data-testid="link-back-dashboard">
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-page-title">Survey Analytics</h1>
          {chatbot && (
            <p className="text-muted-foreground" data-testid="text-chatbot-name">
              {chatbot.name}
            </p>
          )}
        </div>
      </div>

      {!analytics || analytics.totalSurveys === 0 ? (
        <Card data-testid="card-no-surveys">
          <CardContent className="pt-6 text-center">
            <BarChart3 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Survey Data</h3>
            <p className="text-muted-foreground mb-4">
              This chatbot doesn't have any surveys with responses yet.
            </p>
            <Link href={`/chatbots/${guid}/surveys`}>
              <Button data-testid="button-create-survey">Create Survey</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Overview Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card data-testid="card-total-surveys">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Surveys</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="text-total-surveys">
                  {analytics.totalSurveys}
                </div>
              </CardContent>
            </Card>

            <Card data-testid="card-total-responses">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Responses</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="text-total-responses">
                  {analytics.totalResponses}
                </div>
              </CardContent>
            </Card>

            <Card data-testid="card-completion-rate">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="text-completion-rate">
                  {formatCompletionRate(analytics.completionRate)}
                </div>
              </CardContent>
            </Card>

            <Card data-testid="card-avg-completion-time">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg. Completion Time</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="text-avg-completion-time">
                  {formatTime(analytics.averageCompletionTime)}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Survey Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Survey List */}
            <Card data-testid="card-survey-list">
              <CardHeader>
                <CardTitle>Survey Performance</CardTitle>
                <CardDescription>
                  Click on a survey to view detailed question analytics
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {analytics.surveyBreakdown.map((survey) => (
                  <div
                    key={survey.surveyId}
                    className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                      selectedSurvey === survey.surveyId
                        ? "bg-primary/5 border-primary"
                        : "hover:bg-muted/50"
                    }`}
                    onClick={() => setSelectedSurvey(survey.surveyId)}
                    data-testid={`survey-item-${survey.surveyId}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium" data-testid={`text-survey-name-${survey.surveyId}`}>
                        {survey.surveyName}
                      </h3>
                      <Badge
                        variant={survey.completionRate > 70 ? "default" : "secondary"}
                        data-testid={`badge-completion-rate-${survey.surveyId}`}
                      >
                        {formatCompletionRate(survey.completionRate)}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {survey.totalResponses}
                      </div>
                      <div className="flex items-center gap-1">
                        <CheckCircle className="w-3 h-3 text-green-600" />
                        {survey.completedResponses}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatTime(survey.avgCompletionTime)}
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Question Analytics */}
            <Card data-testid="card-question-analytics">
              <CardHeader>
                <CardTitle>Question Analytics</CardTitle>
                <CardDescription>
                  {selectedSurveyData
                    ? `Detailed responses for ${selectedSurveyData.surveyName}`
                    : "Select a survey to view question-level analytics"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {selectedSurveyData ? (
                  <div className="space-y-4">
                    {selectedSurveyData.questionAnalytics.map((question, index) => (
                      <div
                        key={question.questionId}
                        className="p-4 rounded-lg border bg-muted/20"
                        data-testid={`question-analytics-${question.questionId}`}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <h4 className="font-medium text-sm" data-testid={`text-question-${question.questionId}`}>
                            Q{index + 1}: {question.questionText}
                          </h4>
                          <Badge variant="outline" data-testid={`badge-response-count-${question.questionId}`}>
                            {question.responseCount} responses
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground" data-testid={`text-response-summary-${question.questionId}`}>
                          <strong>Responses:</strong> {getResponseSummary(question.responses)}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <BarChart3 className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>Select a survey from the list to view question analytics</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}