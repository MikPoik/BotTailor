import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useLocation, useRoute } from "wouter";
import { useEffect } from "react";
import { z } from "zod";
import {
  ArrowLeft,
  Bot,
  Save,
  User,
  X,
  Plus,
  Trash2,
  Sparkles,
  ChevronUp,
  ChevronDown,
  AlertTriangle,
} from "lucide-react";
import { Link } from "wouter";
import { AvatarUpload } from "@/components/ui/avatar-upload";
import { useState } from "react";
import type { ChatbotConfig } from "@shared/schema";
import PromptAssistantChatbox from "@/components/chat/prompt-assistant-chatbox";
import React from "react";
import type { RouteDefinition } from "@shared/route-metadata";

export const route: RouteDefinition = {
  path: "/chatbots/:guid",
  ssr: false,
  metadata: {
    title: "Edit Chatbot - BotTailor",
    description: "Configure and customize your AI chatbot settings.",
    ogTitle: "Edit Chatbot - BotTailor",
    ogDescription: "Configure your AI chatbot.",
  },
};

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  avatarUrl: z.string().optional(),
  systemPrompt: z.string().min(1, "System prompt is required"),
  model: z.string().min(1, "Model is required"),
  temperature: z.number().min(0).max(10).default(7),
  maxTokens: z.number().min(100).max(4000).default(1000),
  welcomeMessage: z.string().optional(),
  fallbackMessage: z.string().optional(),
  initialMessages: z.array(z.string()).optional(),
  isActive: z.boolean().default(true),
  // Email configuration
  formRecipientEmail: z
    .string()
    .email("Valid email required")
    .or(z.literal(""))
    .optional(),
  formRecipientName: z.string().optional(),
  formConfirmationMessage: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

export default function ChatbotEdit() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/chatbots/:guid");
  const [promptAssistantOpen, setPromptAssistantOpen] = useState(false);

  const chatbotGuid = params?.guid || null;

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/handler/sign-in";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  // Fetch chatbot configuration
  const { data: chatbot, isLoading: chatbotLoading } = useQuery<ChatbotConfig>({
    queryKey: [`/api/chatbots/${chatbotGuid}`],
    enabled: isAuthenticated && !!chatbotGuid,
    retry: false,
  });

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    mode: "onChange",
    defaultValues: {
      name: "",
      description: "",
      avatarUrl: "",
      systemPrompt:
        "You are a helpful AI assistant. Provide clear, accurate, and friendly responses to user questions.",
      model: "gpt-4.1",
      temperature: 7,
      maxTokens: 1000,
      welcomeMessage: "Hello! How can I help you today?",
      fallbackMessage:
        "I'm sorry, I didn't understand that. Could you please rephrase your question?",
      initialMessages: [],
      isActive: true,
      formRecipientEmail: "",
      formRecipientName: "",
      formConfirmationMessage: "",
    },
  });

  // Update form when chatbot data loads
  useEffect(() => {
    if (chatbot) {
      form.reset({
        name: chatbot.name,
        description: chatbot.description || "",
        avatarUrl: chatbot.avatarUrl || "",
        systemPrompt: chatbot.systemPrompt,
        model: chatbot.model,
        temperature: chatbot.temperature || 7,
        maxTokens: chatbot.maxTokens || 1000,
        welcomeMessage: chatbot.welcomeMessage || "",
        fallbackMessage: chatbot.fallbackMessage || "",
        initialMessages: (chatbot.initialMessages as string[]) || [],
        isActive: chatbot.isActive ?? true,
        formRecipientEmail: chatbot.formRecipientEmail || "",
        formRecipientName: chatbot.formRecipientName || "",
        formConfirmationMessage: chatbot.formConfirmationMessage || "",
      });
    }
  }, [chatbot, form]);

  // Update metadata on client side for CSR page
  useEffect(() => {
    if (typeof window !== "undefined") {
      import("@/lib/client-metadata").then(({ updateClientMetadata }) => {
        updateClientMetadata(window.location.pathname);
      });
    }
  }, []);

  const updateMutation = useMutation({
    mutationFn: async (data: FormData) => {
      //console.log("Updating chatbot with values:", data); // Debug log
      const response = await apiRequest(
        "PUT",
        `/api/chatbots/${chatbotGuid}`,
        data,
      );

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Chatbot configuration updated successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/chatbots"] }); // Refresh dashboard list
      queryClient.invalidateQueries({
        queryKey: [`/api/chatbots/${chatbotGuid}`],
      });
      setLocation("/dashboard");
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/handler/sign-in";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description:
          "Failed to update chatbot configuration. Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("DELETE", `/api/chatbots/${chatbotGuid}`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Chatbot deleted successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/chatbots"] });
      setLocation("/dashboard");
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/handler/sign-in";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to delete chatbot. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FormData) => {
    updateMutation.mutate(data);
  };

  if (isLoading || !isAuthenticated || chatbotLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!chatbot) {
    return (
      <div className="container max-w-4xl mx-auto py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Chatbot Not Found</h1>
          <p className="text-muted-foreground mb-4">
            The chatbot you're looking for doesn't exist or you don't have
            permission to edit it.
          </p>
          <Button asChild>
            <Link href="/dashboard">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
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
          <Bot className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight">
            Edit Chatbot: {chatbot.name}
          </h1>
        </div>
        <p className="text-muted-foreground">
          Update your chatbot's personality, behavior, and responses
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>
                Update the basic details for your chatbot
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Chatbot Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Customer Support Bot" {...field} />
                    </FormControl>
                    <FormDescription>
                      A memorable name for your chatbot
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="A helpful customer support assistant that can answer questions about our products and services."
                        className="min-h-[80px]"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Describe what this chatbot is designed to do
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="avatarUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Avatar</FormLabel>
                    <FormControl>
                      <AvatarUpload
                        value={field.value}
                        onValueChange={field.onChange}
                        disabled={updateMutation.isPending}
                      />
                    </FormControl>
                    <FormDescription>
                      Upload a custom avatar or provide an image URL for your
                      chatbot.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Active Status</FormLabel>
                      <FormDescription>
                        Enable or disable this chatbot. When disabled, the
                        chatbot won't respond to messages.
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={updateMutation.isPending}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* AI Configuration */}
          <Card>
            <CardHeader>
              <CardTitle>AI Configuration</CardTitle>
              <CardDescription>
                Configure the AI model and behavior settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="model"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>AI Model</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select an AI model" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="gpt-4o-mini">
                          GPT-4o Mini (Fast & Cost-effective)
                        </SelectItem>
                        <SelectItem value="gpt-4o">
                          GPT-4o (Advanced Performance)
                        </SelectItem>
                        <SelectItem value="gpt-4.1">
                          GPT-4.1 (Most Accurate Performance)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Choose the AI model that best fits your needs
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="systemPrompt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>System Prompt</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="You are a helpful AI assistant..."
                        className="min-h-[420px]"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Define your chatbot's personality and role. This
                      instruction guides how it responds.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* AI Prompt Assistant */}
              <div className="border rounded-lg p-4 bg-muted/30">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-medium flex items-center gap-2">
                    <Sparkles className="h-4 w-4" />
                    AI Prompt Assistant
                  </h4>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setPromptAssistantOpen(!promptAssistantOpen)}
                    type="button"
                  >
                    {promptAssistantOpen ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                </div>

                {promptAssistantOpen && (
                  <PromptAssistantChatbox
                    currentPrompt={form.watch("systemPrompt") || ""}
                    onPromptGenerated={(newPrompt) =>
                      form.setValue("systemPrompt", newPrompt)
                    }
                    chatbotConfig={{
                      name: form.watch("name"),
                      description: form.watch("description"),
                    }}
                    chatbotGuid={chatbotGuid || ""}
                  />
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="temperature"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Creativity Level: {field.value / 10}
                      </FormLabel>
                      <FormControl>
                        <Slider
                          min={0}
                          max={10}
                          step={1}
                          value={[field.value]}
                          onValueChange={(value) => field.onChange(value[0])}
                          className="w-full"
                        />
                      </FormControl>
                      <FormDescription>
                        Lower = more focused, Higher = more creative
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="maxTokens"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Maximum Response Length</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={100}
                          max={4000}
                          {...field}
                          onChange={(e) =>
                            field.onChange(parseInt(e.target.value))
                          }
                        />
                      </FormControl>
                      <FormDescription>
                        Maximum tokens for responses (100-4000)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Messages Configuration */}
          <Card>
            <CardHeader>
              <CardTitle>Message Configuration</CardTitle>
              <CardDescription>
                Customize the default messages your chatbot will use
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="welcomeMessage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Welcome Message</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Hello! How can I help you today?"
                        className="min-h-[80px]"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      The first message users see when starting a conversation
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="fallbackMessage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fallback Message</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="I'm sorry, I didn't understand that. Could you please rephrase your question?"
                        className="min-h-[80px]"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Message shown when the AI cannot understand or respond
                      appropriately
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="initialMessages"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Initial Messages</FormLabel>
                    <FormDescription>
                      Messages that appear as bubbles above the chat widget to
                      engage visitors
                    </FormDescription>
                    <FormControl>
                      <div className="space-y-3">
                        {(field.value || []).map((message, index) => (
                          <div
                            key={index}
                            className="flex items-center space-x-2"
                          >
                            <Input
                              value={message}
                              onChange={(e) => {
                                const newMessages = [...(field.value || [])];
                                newMessages[index] = e.target.value;
                                field.onChange(newMessages);
                              }}
                              placeholder="Enter an initial message..."
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const newMessages = (field.value || []).filter(
                                  (_, i) => i !== index,
                                );
                                field.onChange(newMessages);
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            field.onChange([...(field.value || []), ""]);
                          }}
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Add Message
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Email Configuration */}
          <Card>
            <CardHeader>
              <CardTitle>Email Configuration</CardTitle>
              <CardDescription>
                Configure email settings for form submissions and notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="formRecipientEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Form Recipient Email</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="recipient@example.com"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Email address where form submissions will be sent
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="formRecipientName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Recipient Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Support Team" {...field} />
                      </FormControl>
                      <FormDescription>
                        Name of the person/team receiving forms
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="formConfirmationMessage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Form Confirmation Message</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Thank you! Your message has been sent successfully. We will contact you soon."
                          className="min-h-[80px]"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Message displayed in chat after successful form
                        submission
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="flex justify-between items-center">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  type="button"
                  variant="destructive"
                  disabled={deleteMutation.isPending}
                >
                  {deleteMutation.isPending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Chatbot
                    </>
                  )}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-destructive" />
                    Delete Chatbot
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete "{chatbot?.name}"? This
                    action cannot be undone. All chat history and configuration
                    will be permanently removed.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => deleteMutation.mutate()}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Delete Chatbot
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <div className="flex space-x-4">
              <Button type="button" variant="outline" asChild>
                <Link href="/dashboard">Cancel</Link>
              </Button>
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                    Updating...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Update Chatbot
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
}