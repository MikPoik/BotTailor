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

// Properly typed Survey interface
interface Survey extends Omit<BaseSurvey, 'surveyConfig'> {
  surveyConfig: SurveyConfig;
}
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
} from "lucide-react";

export default function SurveyBuilderPage() {
  const { chatbotId } = useParams();
  const { user, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [selectedSurvey, setSelectedSurvey] = useState<Survey | null>(null);
  const [editingQuestion, setEditingQuestion] = useState<number | null>(null);
  const [newQuestion, setNewQuestion] = useState<Partial<SurveyQuestion>>({
    text: "",
    type: "single_choice",
    options: [],
    required: true,
  });

  // Local state for editing fields to prevent constant updates
  const [localSurveyName, setLocalSurveyName] = useState<string>("");
  const [localSurveyDescription, setLocalSurveyDescription] = useState<string>("");

  // Update local state when selectedSurvey changes
  useEffect(() => {
    if (selectedSurvey) {
      setLocalSurveyName(selectedSurvey.name);
      setLocalSurveyDescription(selectedSurvey.description || "");
    }
  }, [selectedSurvey]);

  // Fetch chatbot details
  const { data: chatbot } = useQuery<{ name: string; id: number }>({
    queryKey: [`/api/chatbots/${chatbotId}`],
    enabled: !!chatbotId && isAuthenticated,
  });

  // Fetch surveys for this chatbot
  const { data: surveys = [], isLoading } = useQuery<Survey[]>({
    queryKey: [`/api/chatbots/${chatbotId}/surveys`],
    enabled: !!chatbotId && isAuthenticated,
  });

  // Create survey mutation
  const createSurveyMutation = useMutation({
    mutationFn: async (data: { name: string; description: string; surveyConfig: SurveyConfig }) => {
      return await apiRequest("POST", `/api/chatbots/${chatbotId}/surveys`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/chatbots/${chatbotId}/surveys`] });
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/chatbots/${chatbotId}/surveys`] });
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
      queryClient.invalidateQueries({ queryKey: [`/api/chatbots/${chatbotId}/surveys`] });
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
    };

    const updatedConfig = {
      ...selectedSurvey.surveyConfig,
      questions: [...selectedSurvey.surveyConfig.questions, newQuestionData],
    };

    updateSurveyMutation.mutate({
      id: surveyId,
      updates: { surveyConfig: updatedConfig },
    });

    setNewQuestion({ text: "", type: "single_choice", options: [], required: true });
  };

  const handleDeleteQuestion = (surveyId: number, questionIndex: number) => {
    if (!selectedSurvey) return;

    const updatedConfig = {
      ...selectedSurvey.surveyConfig,
      questions: selectedSurvey.surveyConfig.questions.filter((_: SurveyQuestion, index: number) => index !== questionIndex),
    };

    updateSurveyMutation.mutate({
      id: surveyId,
      updates: { surveyConfig: updatedConfig },
    });
  };

  // Local state for editing questions to prevent constant updates
  const [localQuestionText, setLocalQuestionText] = useState<{ [key: number]: string }>({});
  const [localOptionTexts, setLocalOptionTexts] = useState<{ [key: string]: string }>({});

  const handleUpdateQuestion = (surveyId: number, questionIndex: number, updates: Partial<SurveyQuestion>) => {
    if (!selectedSurvey) return;

    const updatedQuestions = selectedSurvey.surveyConfig.questions.map((q: SurveyQuestion, index: number) =>
      index === questionIndex ? { ...q, ...updates } : q
    );

    const updatedConfig = {
      ...selectedSurvey.surveyConfig,
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

  const handleOptionTextSave = (questionIndex: number, optionIndex: number) => {
    const key = `${questionIndex}-${optionIndex}`;
    const text = localOptionTexts[key];
    if (text !== undefined && selectedSurvey) {
      const question = selectedSurvey.surveyConfig.questions[questionIndex];
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
      <div className="container max-w-4xl py-8">
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
      <div className="container max-w-7xl py-8 px-4 sm:px-6 lg:px-8">
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
                                {survey.surveyConfig.questions.length} questions
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
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="questions">Questions</TabsTrigger>
                  <TabsTrigger value="settings">Settings</TabsTrigger>
                  <TabsTrigger value="preview">Preview</TabsTrigger>
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
                            onBlur={() => {
                              if (localSurveyName !== selectedSurvey.name) {
                                updateSurveyMutation.mutate({
                                  id: selectedSurvey.id,
                                  updates: { name: localSurveyName },
                                });
                              }
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.currentTarget.blur();
                              }
                            }}
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
                          onBlur={() => {
                            if (localSurveyDescription !== (selectedSurvey.description || "")) {
                              updateSurveyMutation.mutate({
                                id: selectedSurvey.id,
                                updates: { description: localSurveyDescription },
                              });
                            }
                          }}
                          placeholder="Brief description of the survey..."
                        />
                      </div>

                      {/* Questions list */}
                      <div className="space-y-4">
                        <Label>Questions</Label>
                        {selectedSurvey.surveyConfig.questions.map((question: SurveyQuestion, index: number) => (
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
                                    onBlur={() => handleQuestionTextSave(index)}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        e.currentTarget.blur();
                                      }
                                    }}
                                    placeholder="Enter question text..."
                                  />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <Label>Question Type</Label>
                                    <Select
                                      value={question.type}
                                      onValueChange={(value) => {
                                        const updates: Partial<SurveyQuestion> = { type: value as any };
                                        if (value === "text" || value === "rating") {
                                          updates.options = undefined;
                                        } else if (!question.options) {
                                          updates.options = [
                                            { id: "option1", text: "Option 1" },
                                            { id: "option2", text: "Option 2" },
                                          ];
                                        }
                                        handleUpdateQuestion(selectedSurvey.id, index, updates);
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
                                      value={question.required ? "true" : "false"}
                                      onValueChange={(value) => handleUpdateQuestion(selectedSurvey.id, index, { required: value === "true" })}
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
                                            onBlur={() => handleOptionTextSave(index, optionIndex)}
                                            onKeyDown={(e) => {
                                              if (e.key === 'Enter') {
                                                e.currentTarget.blur();
                                              }
                                            }}
                                            placeholder={`Option ${optionIndex + 1}`}
                                          />
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => {
                                              const updatedOptions = question.options.filter((_: any, idx: number) => idx !== optionIndex);
                                              handleUpdateQuestion(selectedSurvey.id, index, { options: updatedOptions });
                                            }}
                                            disabled={question.options.length <= 2}
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
                                        const newOption = { id: `option${question.options.length + 1}`, text: `Option ${question.options.length + 1}` };
                                        handleUpdateQuestion(selectedSurvey.id, index, { options: [...question.options, newOption] });
                                      }}
                                    >
                                      <Plus className="h-4 w-4 mr-2" />
                                      Add Option
                                    </Button>
                                  </div>
                                )}

                                <div className="flex items-center gap-2 pt-4 border-t">
                                  <Button
                                    onClick={() => setEditingQuestion(null)}
                                    variant="default"
                                    size="sm"
                                  >
                                    <Save className="h-4 w-4 mr-2" />
                                    Save Changes
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setEditingQuestion(null)}
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
                                    onClick={() => setEditingQuestion(index)}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleDeleteQuestion(selectedSurvey.id, index)}
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
                          value={selectedSurvey.surveyConfig.completionMessage || ""}
                          onChange={(e) => {
                            const updatedConfig = {
                              ...selectedSurvey.surveyConfig,
                              completionMessage: e.target.value,
                            };
                            updateSurveyMutation.mutate({
                              id: selectedSurvey.id,
                              updates: { surveyConfig: updatedConfig },
                            });
                          }}
                          placeholder="Thank you for completing the survey!"
                        />
                      </div>

                      <div>
                        <Label htmlFor="ai-instructions">AI Instructions</Label>
                        <Textarea
                          id="ai-instructions"
                          value={selectedSurvey.surveyConfig.aiInstructions || ""}
                          onChange={(e) => {
                            const updatedConfig = {
                              ...selectedSurvey.surveyConfig,
                              aiInstructions: e.target.value,
                            };
                            updateSurveyMutation.mutate({
                              id: selectedSurvey.id,
                              updates: { surveyConfig: updatedConfig },
                            });
                          }}
                          placeholder="Instructions for how the AI should conduct this survey..."
                        />
                      </div>
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
                          <h3 className="font-semibold">{selectedSurvey.surveyConfig.title}</h3>
                          {selectedSurvey.surveyConfig.description && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {selectedSurvey.surveyConfig.description}
                            </p>
                          )}
                        </div>
                        {selectedSurvey.surveyConfig.questions.map((question: SurveyQuestion, index: number) => (
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