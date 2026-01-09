import { useState, useEffect } from "react";
import { useParams, Link } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { type Survey as BaseSurvey, type SurveyConfig, type SurveyQuestion } from "@shared/schema";
import SurveyAssistantChatbox from "@/components/chat/survey-assistant-chatbox";

// Use BaseSurvey type directly to ensure compatibility
type Survey = BaseSurvey;
import {
  ArrowLeft,
  Plus,
  Trash2,
  Edit,
  Save,
  Eye,
  ChevronUp,
  ChevronDown,
  FileText,
  BarChart3,
  MessageSquare,
  PlusCircle,
  Settings,
  Wand2,
} from "lucide-react";

// Helper function to safely get surveyConfig
const getSurveyConfig = (survey: Survey | null): SurveyConfig => {
  if (!survey || !survey.surveyConfig) {
    return {
      id: `survey_${Date.now()}`,
      title: "New Survey",
      description: "A new survey",
      questions: [],
      conditionalFlow: false,
      completionMessage: "Thank you for completing the survey!",
      aiInstructions: "Conduct this survey with a friendly and professional tone.",
      settings: {
        allowBackNavigation: true,
        showProgress: true,
        savePartialResponses: true,
      },
    };
  }

  // Type-safe handling of unknown surveyConfig
  const config = survey.surveyConfig as any;

  return {
    id: config?.id || `survey_${Date.now()}`,
    title: config?.title || "Untitled Survey",
    description: config?.description || "No description",
    questions: config?.questions || [],
    conditionalFlow: config?.conditionalFlow ?? false,
    completionMessage: config?.completionMessage || "Thank you!",
    aiInstructions: config?.aiInstructions || "Respond professionally.",
    settings: {
      allowBackNavigation: config?.settings?.allowBackNavigation ?? true,
      showProgress: config?.settings?.showProgress ?? true,
      savePartialResponses: config?.settings?.savePartialResponses ?? true,
    },
  };
};


export default function SurveyBuilderPage() {
  const { guid } = useParams();
  const { user, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [selectedSurvey, setSelectedSurvey] = useState<Survey | null>(null);
  const [editingQuestion, setEditingQuestion] = useState<number | null>(null);
  const [newQuestion, setNewQuestion] = useState<Partial<SurveyQuestion>>({
    text: "",
    type: "single_choice",
    options: [],
    required: true,
    allowFreeChoice: false,
  });

  // Local state for editing fields to prevent constant updates
  const [localSurveyName, setLocalSurveyName] = useState<string>("");
  const [localSurveyDescription, setLocalSurveyDescription] = useState<string>("");
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);

  // Update local state when selectedSurvey changes
  useEffect(() => {
    if (selectedSurvey) {
      setLocalSurveyName(selectedSurvey.name);
      setLocalSurveyDescription(selectedSurvey.description || "");
      setHasUnsavedChanges(false);
    }
  }, [selectedSurvey]);

  // Track changes to enable save button
  useEffect(() => {
    if (selectedSurvey) {
      const nameChanged = localSurveyName !== selectedSurvey.name;
      const descChanged = localSurveyDescription !== (selectedSurvey.description || "");
      setHasUnsavedChanges(nameChanged || descChanged);
    }
  }, [localSurveyName, localSurveyDescription, selectedSurvey]);

  // Fetch chatbot details
  const { data: chatbot } = useQuery<{ name: string; id: number; description?: string }>({
    queryKey: [`/api/chatbots/${guid}`],
    enabled: !!guid && isAuthenticated,
  });

  // Fetch surveys for this chatbot
  const { data: surveys = [], isLoading } = useQuery<Survey[]>({
    queryKey: [`/api/chatbots/${chatbot?.id}/surveys`],
    enabled: !!chatbot?.id && isAuthenticated,
  });

  // Create survey mutation
  const createSurveyMutation = useMutation({
    mutationFn: async (data: { name: string; description: string; surveyConfig: SurveyConfig }) => {
      return await apiRequest("POST", `/api/chatbots/${chatbot?.id}/surveys`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/chatbots/${chatbot?.id}/surveys`] });
      toast({ title: "Survey created successfully!" });
    },
    onError: (error: any) => {
      toast({
        title: "Error creating survey",
        description: error.message || "Failed to create survey",
        variant: "destructive",
      });
    },
  });

  // Update survey mutation
  const updateSurveyMutation = useMutation({
    mutationFn: async (data: { id: number; updates: Partial<Survey> }) => {
      return await apiRequest("PATCH", `/api/surveys/${data.id}`, data.updates);
    },
    onSuccess: (data, variables) => {
      // Only invalidate queries to refetch data - this updates the list
      queryClient.invalidateQueries({ queryKey: [`/api/chatbots/${chatbot?.id}/surveys`] });

      // Update the selected survey in local state to prevent UI jumps
      if (selectedSurvey && selectedSurvey.id === variables.id) {
        const updatedSurvey = { ...selectedSurvey, ...variables.updates };
        setSelectedSurvey(updatedSurvey);

        // Update local form state for name/description
        if (variables.updates.name) {
          setLocalSurveyName(variables.updates.name);
        }
        if (variables.updates.description !== undefined) {
          setLocalSurveyDescription(variables.updates.description || "");
        }

        // Update local settings state if surveyConfig changed
        if (variables.updates.surveyConfig) {
          const config = variables.updates.surveyConfig as SurveyConfig;
          if (config.completionMessage !== undefined) {
            setLocalCompletionMessage(config.completionMessage);
          }
          if (config.aiInstructions !== undefined) {
            setLocalAiInstructions(config.aiInstructions);
          }
        }

        // Clear unsaved changes flags
        setHasUnsavedChanges(false);
        setHasUnsavedSettings(false);
      }

      toast({ title: "Survey updated successfully!" });
    },
    onError: (error: any) => {
      toast({
        title: "Error updating survey",
        description: error.message || "Failed to update survey",
        variant: "destructive",
      });
    },
  });

  // Delete survey mutation
  const deleteSurveyMutation = useMutation({
    mutationFn: async (surveyId: number) => {
      return await apiRequest("DELETE", `/api/surveys/${surveyId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/chatbots/${chatbot?.id}/surveys`] });
      setSelectedSurvey(null);
      toast({ title: "Survey deleted successfully!" });
    },
    onError: (error: any) => {
      toast({
        title: "Error deleting survey",
        description: error.message || "Failed to delete survey",
        variant: "destructive",
      });
    },
  });

  const handleCreateSurvey = async () => {
    const defaultConfig: SurveyConfig = {
      id: `survey_${Date.now()}`,
      title: "New Survey",
      description: "A new survey",
      questions: [],
      conditionalFlow: false,
      completionMessage: "Thank you for completing the survey!",
      aiInstructions: "Conduct this survey with a friendly and professional tone.",
      settings: {
        allowBackNavigation: true,
        showProgress: true,
        savePartialResponses: true,
      },
    };

    createSurveyMutation.mutate({
      name: "New Survey",
      description: "A new survey",
      surveyConfig: defaultConfig,
    });
  };

  const handleAddQuestion = (surveyId: number) => {
    if (!selectedSurvey) return;

    const newQuestionData: SurveyQuestion = {
      id: `q_${Date.now()}`,
      text: newQuestion.text || "New Question",
      type: newQuestion.type || "single_choice",
      options: newQuestion.type === "text" ? undefined : [
        { id: "option1", text: "Option 1" },
        { id: "option2", text: "Option 2" },
      ],
      required: newQuestion.required ?? true,
      allowFreeChoice: newQuestion.allowFreeChoice ?? false,
    };

    const currentConfig = getSurveyConfig(selectedSurvey);
      const updatedConfig = {
        ...currentConfig,
        questions: [...currentConfig.questions, newQuestionData],
      };

    updateSurveyMutation.mutate({
      id: surveyId,
      updates: { surveyConfig: updatedConfig },
    });

    setNewQuestion({ text: "", type: "single_choice", options: [], required: true, allowFreeChoice: false });
  };

  const handleDeleteQuestion = (surveyId: number, questionIndex: number) => {
    if (!selectedSurvey) return;

    const currentConfig = getSurveyConfig(selectedSurvey);
      const updatedConfig = {
        ...currentConfig,
        questions: currentConfig.questions.filter((_: SurveyQuestion, index: number) => index !== questionIndex),
      };

    updateSurveyMutation.mutate({
      id: surveyId,
      updates: { surveyConfig: updatedConfig },
    });
  };

  const handleMoveQuestionUp = (surveyId: number, questionIndex: number) => {
    if (!selectedSurvey || questionIndex === 0) return;

    const currentConfig = getSurveyConfig(selectedSurvey);
    const questions = [...currentConfig.questions];
    
    // Swap with previous question
    [questions[questionIndex - 1], questions[questionIndex]] = [questions[questionIndex], questions[questionIndex - 1]];
    
    const updatedConfig = {
      ...currentConfig,
      questions,
    };

    updateSurveyMutation.mutate({
      id: surveyId,
      updates: { surveyConfig: updatedConfig },
    });
  };

  const handleMoveQuestionDown = (surveyId: number, questionIndex: number) => {
    if (!selectedSurvey) return;

    const currentConfig = getSurveyConfig(selectedSurvey);
    if (questionIndex >= currentConfig.questions.length - 1) return;
    
    const questions = [...currentConfig.questions];
    
    // Swap with next question
    [questions[questionIndex], questions[questionIndex + 1]] = [questions[questionIndex + 1], questions[questionIndex]];
    
    const updatedConfig = {
      ...currentConfig,
      questions,
    };

    updateSurveyMutation.mutate({
      id: surveyId,
      updates: { surveyConfig: updatedConfig },
    });
  };

  // Save survey details function
  const handleSaveSurveyDetails = () => {
    if (!selectedSurvey) return;

    updateSurveyMutation.mutate({
      id: selectedSurvey.id,
      updates: { 
        name: localSurveyName,
        description: localSurveyDescription 
      },
    });
  };

  // Local state for editing questions to prevent constant updates
  const [localQuestionText, setLocalQuestionText] = useState<{ [key: number]: string }>({});
  const [localOptionTexts, setLocalOptionTexts] = useState<{ [key: string]: string }>({});
  
  // Local state for question settings to prevent immediate saves
  const [localQuestionSettings, setLocalQuestionSettings] = useState<{ [key: number]: Partial<SurveyQuestion> }>({});
  
  // Local state for survey settings
  const [localCompletionMessage, setLocalCompletionMessage] = useState<string>("");
  const [localAiInstructions, setLocalAiInstructions] = useState<string>("");
  const [hasUnsavedSettings, setHasUnsavedSettings] = useState<boolean>(false);

  // Update local settings state when selectedSurvey changes
  useEffect(() => {
    if (selectedSurvey) {
      const config = getSurveyConfig(selectedSurvey);
      setLocalCompletionMessage(config.completionMessage || "");
      setLocalAiInstructions(config.aiInstructions || "");
      setHasUnsavedSettings(false);
    }
  }, [selectedSurvey]);

  // Track changes to settings
  useEffect(() => {
    if (selectedSurvey) {
      const config = getSurveyConfig(selectedSurvey);
      const completionChanged = localCompletionMessage !== (config.completionMessage || "");
      const aiChanged = localAiInstructions !== (config.aiInstructions || "");
      setHasUnsavedSettings(completionChanged || aiChanged);
    }
  }, [localCompletionMessage, localAiInstructions, selectedSurvey]);

  const handleUpdateQuestion = (surveyId: number, questionIndex: number, updates: Partial<SurveyQuestion>) => {
    if (!selectedSurvey) return;

    const currentConfig = getSurveyConfig(selectedSurvey);
    const updatedQuestions = currentConfig.questions.map((q: SurveyQuestion, index: number) =>
      index === questionIndex ? { ...q, ...updates } : q
    );

    const updatedConfig = {
      ...currentConfig,
      questions: updatedQuestions,
    };

    updateSurveyMutation.mutate({
      id: surveyId,
      updates: { surveyConfig: updatedConfig },
    });
  };

  const handleQuestionTextChange = (questionIndex: number, text: string) => {
    setLocalQuestionText(prev => ({ ...prev, [questionIndex]: text }));
  };

  const handleQuestionTextSave = (questionIndex: number) => {
    const text = localQuestionText[questionIndex];
    if (text !== undefined && selectedSurvey) {
      handleUpdateQuestion(selectedSurvey.id, questionIndex, { text });
      setLocalQuestionText(prev => {
        const newState = { ...prev };
        delete newState[questionIndex];
        return newState;
      });
    }
  };

  const handleOptionTextChange = (questionIndex: number, optionIndex: number, text: string) => {
    const key = `${questionIndex}-${optionIndex}`;
    setLocalOptionTexts(prev => ({ ...prev, [key]: text }));
  };

  const handleQuestionSettingChange = (questionIndex: number, updates: Partial<SurveyQuestion>) => {
    setLocalQuestionSettings(prev => ({
      ...prev,
      [questionIndex]: { ...prev[questionIndex], ...updates }
    }));
  };

  const getQuestionSetting = (questionIndex: number, key: keyof SurveyQuestion, defaultValue: any) => {
    const localSettings = localQuestionSettings[questionIndex];
    if (localSettings && localSettings[key] !== undefined) {
      return localSettings[key];
    }
    const question = getSurveyConfig(selectedSurvey).questions[questionIndex];
    return question?.[key] ?? defaultValue;
  };

  const handleOptionTextSave = (questionIndex: number, optionIndex: number) => {
    const key = `${questionIndex}-${optionIndex}`;
    const text = localOptionTexts[key];
    if (text !== undefined && selectedSurvey) {
      const question = getSurveyConfig(selectedSurvey).questions[questionIndex];
      if (question.options) {
        const updatedOptions = [...question.options];
        updatedOptions[optionIndex] = { ...updatedOptions[optionIndex], text };
        handleUpdateQuestion(selectedSurvey.id, questionIndex, { options: updatedOptions });
      }
      setLocalOptionTexts(prev => {
        const newState = { ...prev };
        delete newState[key];
        return newState;
      });
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="container max-w-4xl mx-auto py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Authentication Required</h1>
          <p className="text-muted-foreground">Please log in to access the survey builder.</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Link>
            </Button>
          </div>
          <div className="flex items-center gap-3 mb-2">
            <BarChart3 className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold tracking-tight">Survey Builder</h1>
          </div>
          <p className="text-muted-foreground">
            Create and manage surveys for {chatbot?.name || "your chatbot"}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left sidebar - Survey list */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Surveys
                  </CardTitle>
                  <Button
                    size="sm"
                    onClick={handleCreateSurvey}
                    disabled={createSurveyMutation.isPending}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    New Survey
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {surveys?.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No surveys yet</p>
                    <p className="text-sm">Create your first survey to get started</p>
                  </div>
                ) : (
                  surveys?.map((survey: Survey) => (
                    <Card
                      key={survey.id}
                      className={`cursor-pointer transition-colors ${
                        selectedSurvey?.id === survey.id
                          ? "border-primary bg-primary/5"
                          : "hover:bg-accent"
                      }`}
                      onClick={() => setSelectedSurvey(survey)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-semibold text-sm">{survey.name}</h3>
                            {survey.description && (
                              <p className="text-xs text-muted-foreground mt-1">
                                {survey.description}
                              </p>
                            )}
                            <div className="flex items-center gap-2 mt-2">
                              <Badge variant={survey.status === "active" ? "default" : "secondary"}>
                                {survey.status}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {getSurveyConfig(survey).questions.length} questions
                              </span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </CardContent>
            </Card>
          </div>

          {/* Main content - Survey editor */}
          <div className="lg:col-span-2">
            {selectedSurvey ? (
              <Tabs defaultValue="questions" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="questions">Questions</TabsTrigger>
                  <TabsTrigger value="settings">Settings</TabsTrigger>
                  <TabsTrigger value="preview">Preview</TabsTrigger>
                  <TabsTrigger value="ai-assistant" data-testid="tab-ai-assistant">
                    <Wand2 className="h-4 w-4 mr-2" />
                    AI Assistant
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="questions" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle>Questions</CardTitle>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteQuestion(selectedSurvey.id, 0)}
                            disabled={deleteSurveyMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete Survey
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              updateSurveyMutation.mutate({
                                id: selectedSurvey.id,
                                updates: { 
                                  status: selectedSurvey.status === "active" ? "draft" : "active" 
                                },
                              });
                            }}
                          >
                            {selectedSurvey.status === "active" ? "Deactivate" : "Activate"}
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Survey basic info */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="survey-name">Survey Name</Label>
                          <Input
                            id="survey-name"
                            value={localSurveyName}
                            onChange={(e) => setLocalSurveyName(e.target.value)}
                            placeholder="Enter survey name..."
                          />
                        </div>
                        <div>
                          <Label htmlFor="survey-status">Status</Label>
                          <Select
                            value={selectedSurvey.status}
                            onValueChange={(value) => {
                              updateSurveyMutation.mutate({
                                id: selectedSurvey.id,
                                updates: { status: value },
                              });
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="draft">Draft</SelectItem>
                              <SelectItem value="active">Active</SelectItem>
                              <SelectItem value="archived">Archived</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="survey-description">Description</Label>
                        <Textarea
                          id="survey-description"
                          value={localSurveyDescription}
                          onChange={(e) => setLocalSurveyDescription(e.target.value)}
                          placeholder="Brief description of the survey..."
                        />
                      </div>

                      {/* Save survey details button */}
                      {hasUnsavedChanges && (
                        <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                          <div className="flex-1">
                            <p className="text-sm font-medium text-amber-800">Unsaved Changes</p>
                            <p className="text-xs text-amber-600">You have unsaved changes to the survey details.</p>
                          </div>
                          <Button
                            onClick={handleSaveSurveyDetails}
                            disabled={updateSurveyMutation.isPending}
                            size="sm"
                          >
                            <Save className="h-4 w-4 mr-2" />
                            Save Details
                          </Button>
                        </div>
                      )}

                      {/* Questions list */}
                      <div className="space-y-4">
                        <Label>Questions</Label>
                        {getSurveyConfig(selectedSurvey).questions.map((question: SurveyQuestion, index: number) => (
                          <Card key={question.id} className="p-4">
                            {editingQuestion === index ? (
                              // Editing mode
                              <div className="space-y-4">
                                <div className="flex items-center gap-2 mb-2">
                                  <Badge variant="outline">Q{index + 1}</Badge>
                                  <Badge variant="secondary">{question.type}</Badge>
                                  {question.required && <Badge variant="outline">Required</Badge>}
                                </div>

                                <div>
                                  <Label>Question Text</Label>
                                  <Input
                                    value={localQuestionText[index] !== undefined ? localQuestionText[index] : question.text}
                                    onChange={(e) => handleQuestionTextChange(index, e.target.value)}
                                    placeholder="Enter question text..."
                                  />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <Label>Question Type</Label>
                                    <Select
                                      value={getQuestionSetting(index, 'type', question.type)}
                                      onValueChange={(value) => {
                                        const updates: Partial<SurveyQuestion> = { type: value as any };
                                        if (value === "text" || value === "rating") {
                                          updates.options = undefined;
                                        } else if (!question.options && !getQuestionSetting(index, 'options', null)) {
                                          updates.options = [
                                            { id: "option1", text: "Option 1" },
                                            { id: "option2", text: "Option 2" },
                                          ];
                                        }
                                        handleQuestionSettingChange(index, updates);
                                      }}
                                    >
                                      <SelectTrigger>
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="single_choice">Single Choice</SelectItem>
                                        <SelectItem value="multiple_choice">Multiple Choice</SelectItem>
                                        <SelectItem value="text">Text Input</SelectItem>
                                        <SelectItem value="rating">Rating</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>

                                  <div>
                                    <Label>Required</Label>
                                    <Select
                                      value={getQuestionSetting(index, 'required', question.required) ? "true" : "false"}
                                      onValueChange={(value) => handleQuestionSettingChange(index, { required: value === "true" })}
                                    >
                                      <SelectTrigger>
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="true">Yes</SelectItem>
                                        <SelectItem value="false">No</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </div>

                                {(getQuestionSetting(index, 'type', question.type) === 'single_choice' || getQuestionSetting(index, 'type', question.type) === 'multiple_choice') && (
                                  <div>
                                    <Label>Allow Free Choice</Label>
                                    <Select
                                      value={getQuestionSetting(index, 'allowFreeChoice', question.allowFreeChoice) ? "true" : "false"}
                                      onValueChange={(value) => handleQuestionSettingChange(index, { allowFreeChoice: value === "true" })}
                                    >
                                      <SelectTrigger>
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="false">No</SelectItem>
                                        <SelectItem value="true">Yes - Include "Other" option</SelectItem>
                                      </SelectContent>
                                    </Select>
                                    <p className="text-xs text-muted-foreground mt-1">
                                      When enabled, an "Other" option with text input will be automatically added to this question.
                                    </p>
                                  </div>
                                )}

                                {question.options && (
                                  <div className="space-y-3">
                                    <Label>Answer Options</Label>
                                    {question.options.map((option: any, optionIndex: number) => {
                                      const optionKey = `${index}-${optionIndex}`;
                                      return (
                                        <div key={option.id} className="flex items-center gap-2">
                                          <Input
                                            value={localOptionTexts[optionKey] !== undefined ? localOptionTexts[optionKey] : option.text}
                                            onChange={(e) => handleOptionTextChange(index, optionIndex, e.target.value)}
                                            placeholder={`Option ${optionIndex + 1}`}
                                          />
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={async () => {
                                              if (question.options && question.options.length > 2) {
                                                const updatedOptions = question.options.filter((_: any, idx: number) => idx !== optionIndex);

                                                // Clear local state for deleted option and adjust indices
                                                setLocalOptionTexts(prev => {
                                                  const newState = { ...prev };
                                                  delete newState[optionKey];
                                                  // Adjust indices for remaining options
                                                  for (let i = optionIndex + 1; i < question.options!.length; i++) {
                                                    const oldKey = `${index}-${i}`;
                                                    const newKey = `${index}-${i-1}`;
                                                    if (newState[oldKey] !== undefined) {
                                                      newState[newKey] = newState[oldKey];
                                                      delete newState[oldKey];
                                                    }
                                                  }
                                                  return newState;
                                                });

                                                // Update the question immediately
                                                handleUpdateQuestion(selectedSurvey.id, index, { options: updatedOptions });
                                              }
                                            }}
                                            disabled={!question.options || question.options.length <= 2}
                                          >
                                            <Trash2 className="h-4 w-4" />
                                          </Button>
                                        </div>
                                      );
                                    })}
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        if (question.options) {
                                          const newOption = { id: `option${question.options.length + 1}`, text: `Option ${question.options.length + 1}` };
                                          handleUpdateQuestion(selectedSurvey.id, index, { options: [...question.options, newOption] });
                                        }
                                      }}
                                    >
                                      <Plus className="h-4 w-4 mr-2" />
                                      Add Option
                                    </Button>
                                  </div>
                                )}

                                {
                                  getQuestionSetting(index, 'type', question.type) === 'rating' && (
                                    <div className="space-y-3">
                                      <Label>Rating Configuration</Label>
                                      <div className="grid grid-cols-3 gap-4">
                                        <div>
                                          <Label>Min Value</Label>
                                          <Input
                                            type="number"
                                            value={getQuestionSetting(index, 'metadata', question.metadata)?.minValue || 1}
                                            onChange={(e) => {
                                              const currentMetadata = getQuestionSetting(index, 'metadata', question.metadata) || {};
                                              handleQuestionSettingChange(index, {
                                                metadata: {
                                                  ...currentMetadata,
                                                  minValue: parseInt(e.target.value) || 1
                                                }
                                              });
                                            }}
                                          />
                                        </div>
                                        <div>
                                          <Label>Max Value</Label>
                                          <Input
                                            type="number"
                                            value={getQuestionSetting(index, 'metadata', question.metadata)?.maxValue || 5}
                                            onChange={(e) => {
                                              const currentMetadata = getQuestionSetting(index, 'metadata', question.metadata) || {};
                                              handleQuestionSettingChange(index, {
                                                metadata: {
                                                  ...currentMetadata,
                                                  maxValue: parseInt(e.target.value) || 5
                                                }
                                              });
                                            }}
                                          />
                                        </div>
                                        <div>
                                          <Label>Rating Type</Label>
                                          <Select
                                            value={getQuestionSetting(index, 'metadata', question.metadata)?.ratingType || 'stars'}
                                            onValueChange={(value) => {
                                              const currentMetadata = getQuestionSetting(index, 'metadata', question.metadata) || {};
                                              handleQuestionSettingChange(index, {
                                                metadata: {
                                                  ...currentMetadata,
                                                  ratingType: value as 'stars' | 'numbers' | 'scale'
                                                }
                                              });
                                            }}
                                          >
                                            <SelectTrigger>
                                              <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                              <SelectItem value="stars">Stars</SelectItem>
                                              <SelectItem value="numbers">Numbers</SelectItem>
                                              <SelectItem value="scale">Scale</SelectItem>
                                            </SelectContent>
                                          </Select>
                                        </div>
                                      </div>
                                      <p className="text-sm text-muted-foreground">
                                        Stars display as clickable star icons, while numbers/scale show as numbered buttons. The rating value is stored as a number in the backend.
                                      </p>
                                    </div>
                                  )
                                }


                                <div className="flex items-center gap-2 pt-4 border-t">
                                  <Button
                                    onClick={() => {
                                      // Prepare all updates for this question
                                      const updates: Partial<SurveyQuestion> = {};

                                      // Save question text if changed
                                      if (localQuestionText[index] !== undefined) {
                                        updates.text = localQuestionText[index];
                                        setLocalQuestionText(prev => {
                                          const newState = { ...prev };
                                          delete newState[index];
                                          return newState;
                                        });
                                      }

                                      // Save all option texts if changed
                                      const hasOptionChanges = question.options?.some((_: any, optionIndex: number) => {
                                        const optionKey = `${index}-${optionIndex}`;
                                        return localOptionTexts[optionKey] !== undefined;
                                      });

                                      if (hasOptionChanges && question.options) {
                                        const updatedOptions = question.options.map((option: any, optionIndex: number) => {
                                          const optionKey = `${index}-${optionIndex}`;
                                          const newText = localOptionTexts[optionKey];
                                          return newText !== undefined ? { ...option, text: newText } : option;
                                        });
                                        updates.options = updatedOptions;

                                        // Clear all option text changes for this question
                                        question.options?.forEach((_: any, optionIndex: number) => {
                                          const optionKey = `${index}-${optionIndex}`;
                                          setLocalOptionTexts(prev => {
                                            const newState = { ...prev };
                                            delete newState[optionKey];
                                            return newState;
                                          });
                                        });
                                      }

                                      // Save local question settings if changed
                                      if (localQuestionSettings[index]) {
                                        Object.assign(updates, localQuestionSettings[index]);
                                        setLocalQuestionSettings(prev => {
                                          const newState = { ...prev };
                                          delete newState[index];
                                          return newState;
                                        });
                                      }

                                      // Apply all updates at once
                                      if (Object.keys(updates).length > 0) {
                                        handleUpdateQuestion(selectedSurvey.id, index, updates);
                                      }

                                      setEditingQuestion(null);
                                    }}
                                    variant="default"
                                    size="sm"
                                  >
                                    <Save className="h-4 w-4 mr-2" />
                                    Save Changes
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      // Clear local changes
                                      setLocalQuestionText(prev => {
                                        const newState = { ...prev };
                                        delete newState[index];
                                        return newState;
                                      });

                                      // Clear option text changes
                                      question.options?.forEach((_: any, optionIndex: number) => {
                                        const optionKey = `${index}-${optionIndex}`;
                                        setLocalOptionTexts(prev => {
                                          const newState = { ...prev };
                                          delete newState[optionKey];
                                          return newState;
                                        });
                                      });

                                      // Clear question settings changes
                                      setLocalQuestionSettings(prev => {
                                        const newState = { ...prev };
                                        delete newState[index];
                                        return newState;
                                      });

                                      setEditingQuestion(null);
                                    }}
                                  >
                                    Cancel
                                  </Button>
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => {
                                      handleDeleteQuestion(selectedSurvey.id, index);
                                      setEditingQuestion(null);
                                    }}
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete Question
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              // View mode
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <Badge variant="outline">Q{index + 1}</Badge>
                                    <Badge variant="secondary">{question.type}</Badge>
                                    {question.required && <Badge variant="outline">Required</Badge>}
                                  </div>
                                  <p className="font-medium">{question.text}</p>
                                  {question.options && (
                                    <div className="mt-2 space-y-1">
                                      {question.options.map((option: any) => (
                                        <div key={option.id} className="text-sm text-muted-foreground">
                                          • {option.text}
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                                <div className="flex items-center gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleMoveQuestionUp(selectedSurvey.id, index)}
                                    disabled={index === 0}
                                    data-testid={`button-move-up-question-${index}`}
                                    title="Move question up"
                                  >
                                    <ChevronUp className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleMoveQuestionDown(selectedSurvey.id, index)}
                                    disabled={index >= getSurveyConfig(selectedSurvey).questions.length - 1}
                                    data-testid={`button-move-down-question-${index}`}
                                    title="Move question down"
                                  >
                                    <ChevronDown className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      // Clear any pending local settings for this question when entering edit mode
                                      setLocalQuestionSettings(prev => {
                                        const newState = { ...prev };
                                        delete newState[index];
                                        return newState;
                                      });
                                      setEditingQuestion(index);
                                    }}
                                    data-testid={`button-edit-question-${index}`}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleDeleteQuestion(selectedSurvey.id, index)}
                                    data-testid={`button-delete-question-${index}`}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            )}
                          </Card>
                        ))}

                        {/* Add new question */}
                        <Card className="p-4 border-dashed">
                          <div className="space-y-4">
                            <div className="flex items-center gap-2">
                              <PlusCircle className="h-5 w-5 text-muted-foreground" />
                              <Label>Add New Question</Label>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <Label htmlFor="new-question-text">Question Text</Label>
                                <Input
                                  id="new-question-text"
                                  value={newQuestion.text}
                                  onChange={(e) => setNewQuestion({ ...newQuestion, text: e.target.value })}
                                  placeholder="Enter your question..."
                                />
                              </div>
                              <div>
                                <Label htmlFor="new-question-type">Question Type</Label>
                                <Select
                                  value={newQuestion.type}
                                  onValueChange={(value) => setNewQuestion({ ...newQuestion, type: value as any })}
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="single_choice">Single Choice</SelectItem>
                                    <SelectItem value="multiple_choice">Multiple Choice</SelectItem>
                                    <SelectItem value="text">Text Input</SelectItem>
                                    <SelectItem value="rating">Rating</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                            <Button
                              onClick={() => handleAddQuestion(selectedSurvey.id)}
                              disabled={!newQuestion.text || updateSurveyMutation.isPending}
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              Add Question
                            </Button>
                          </div>
                        </Card>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="settings" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Settings className="h-5 w-5" />
                        Survey Settings
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label htmlFor="completion-message">Completion Message</Label>
                        <Textarea
                          id="completion-message"
                          value={localCompletionMessage}
                          onChange={(e) => setLocalCompletionMessage(e.target.value)}
                          placeholder="Thank you for completing the survey!"
                        />
                      </div>

                      <div>
                        <Label htmlFor="ai-instructions">AI Instructions</Label>
                        <Textarea
                          id="ai-instructions"
                          value={localAiInstructions}
                          onChange={(e) => setLocalAiInstructions(e.target.value)}
                          placeholder="Instructions for how the AI should conduct this survey..."
                        />
                      </div>

                      {hasUnsavedSettings && (
                        <div className="flex items-center justify-between p-3 bg-amber-50 dark:bg-amber-950 rounded-md">
                          <div className="flex items-center gap-2">
                            <p className="text-xs text-amber-600">You have unsaved changes to the survey settings.</p>
                          </div>
                          <Button
                            onClick={() => {
                              if (!selectedSurvey) return;
                              const currentConfig = getSurveyConfig(selectedSurvey);
                              updateSurveyMutation.mutate({
                                id: selectedSurvey.id,
                                updates: { 
                                  surveyConfig: {
                                    ...currentConfig,
                                    completionMessage: localCompletionMessage,
                                    aiInstructions: localAiInstructions
                                  }
                                }
                              });
                            }}
                            disabled={updateSurveyMutation.isPending}
                            size="sm"
                          >
                            <Save className="h-4 w-4 mr-2" />
                            Save Settings
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="preview" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Eye className="h-5 w-5" />
                        Survey Preview
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="p-4 bg-accent rounded-lg">
                          <h3 className="font-semibold">{getSurveyConfig(selectedSurvey).title}</h3>
                          {getSurveyConfig(selectedSurvey).description && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {getSurveyConfig(selectedSurvey).description}
                            </p>
                          )}
                        </div>
                        {getSurveyConfig(selectedSurvey).questions.map((question: SurveyQuestion, index: number) => (
                          <div key={question.id} className="p-4 border rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="outline">Q{index + 1}</Badge>
                              {question.required && <Badge variant="outline">Required</Badge>}
                            </div>
                            <p className="font-medium mb-3">{question.text}</p>
                            {question.options ? (
                              <div className="space-y-2">
                                {question.options.map((option: any) => (
                                  <div key={option.id} className="flex items-center gap-2">
                                    <div className="w-4 h-4 border rounded-full"></div>
                                    <span className="text-sm">{option.text}</span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <Input placeholder="Text input field" disabled />
                            )}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="ai-assistant" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Wand2 className="h-5 w-5" />
                        Survey AI Assistant
                      </CardTitle>
                      <p className="text-muted-foreground text-sm">
                        Ask the AI to generate survey questions or modify your existing survey. 
                        The AI understands your current survey and can help create professional questionnaires.
                      </p>
                    </CardHeader>
                    <CardContent>
                      {chatbot && (
                        <SurveyAssistantChatbox
                          currentSurvey={selectedSurvey ? {
                            ...selectedSurvey,
                            description: selectedSurvey.description || undefined,
                            surveyConfig: getSurveyConfig(selectedSurvey)
                          } : null}
                          onSurveyGenerated={(newSurveyConfig) => {
                            if (selectedSurvey) {
                              updateSurveyMutation.mutate({
                                id: selectedSurvey.id,
                                updates: { surveyConfig: newSurveyConfig },
                              });
                            }
                          }}
                          chatbotConfig={{
                            name: chatbot.name,
                            description: chatbot.description || undefined,
                          }}
                          chatbotGuid={guid || ""}
                        />
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            ) : (
              <Card>
                <CardContent className="py-16">
                  <div className="text-center">
                    <MessageSquare className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">No Survey Selected</h3>
                    <p className="text-muted-foreground mb-4">
                      Select a survey from the list to edit, or create a new one
                    </p>
                    <Button onClick={handleCreateSurvey} disabled={createSurveyMutation.isPending}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create New Survey
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
