
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useLocation, useRoute } from "wouter";
import { useEffect } from "react";
import { z } from "zod";
import { ArrowLeft, Bot, Save, User, X } from "lucide-react";
import { Link } from "wouter";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useState } from "react";
import type { ChatbotConfig } from "@shared/schema";

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
});

type FormData = z.infer<typeof formSchema>;

export default function ChatbotEdit() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/chatbots/:guid");
  const [avatarPreview, setAvatarPreview] = useState<string>("");

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
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  // Fetch chatbot configuration
  const { data: chatbot, isLoading: chatbotLoading } = useQuery<ChatbotConfig>({
    queryKey: [`/api/chatbots/guid/${chatbotGuid}`],
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
      systemPrompt: "You are a helpful AI assistant. Provide clear, accurate, and friendly responses to user questions.",
      model: "gpt-4o-mini",
      temperature: 7,
      maxTokens: 1000,
      welcomeMessage: "Hello! How can I help you today?",
      fallbackMessage: "I'm sorry, I didn't understand that. Could you please rephrase your question?",
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
      });
      setAvatarPreview(chatbot.avatarUrl || "");
    }
  }, [chatbot, form]);

  const updateMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const response = await fetch(`/api/chatbots/guid/${chatbotGuid}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Chatbot configuration updated successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/chatbots"] });
      queryClient.invalidateQueries({ queryKey: [`/api/chatbots/guid/${chatbotGuid}`] });
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
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to update chatbot configuration. Please try again.",
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
      <div className="container max-w-4xl py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Chatbot Not Found</h1>
          <p className="text-muted-foreground mb-4">The chatbot you're looking for doesn't exist or you don't have permission to edit it.</p>
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
    <div className="container max-w-4xl py-8">
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
          <h1 className="text-3xl font-bold tracking-tight">Edit Chatbot: {chatbot.name}</h1>
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
                      <div className="space-y-4">
                        {/* Avatar Preview */}
                        <div className="flex items-center gap-4">
                          <Avatar className="h-16 w-16">
                            <AvatarImage src={field.value || avatarPreview} />
                            <AvatarFallback>
                              <User className="h-8 w-8" />
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <p className="text-sm font-medium">Chatbot Avatar</p>
                            <p className="text-xs text-muted-foreground">
                              Optional image for your chatbot
                            </p>
                          </div>
                        </div>

                        {/* Avatar URL Input */}
                        <div className="flex gap-2">
                          <Input
                            placeholder="https://example.com/avatar.jpg"
                            value={field.value}
                            onChange={(e) => {
                              field.onChange(e.target.value);
                              setAvatarPreview(e.target.value);
                            }}
                          />
                          {field.value && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                field.onChange("");
                                setAvatarPreview("");
                              }}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </FormControl>
                    <FormDescription>
                      Choose an avatar image for your chatbot by entering an image URL.
                    </FormDescription>
                    <FormMessage />
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
                        <SelectItem value="gpt-4o-mini">GPT-4o Mini (Fast & Cost-effective)</SelectItem>
                        <SelectItem value="gpt-4o">GPT-4o (Advanced Performance)</SelectItem>
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
                        className="min-h-[120px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      Define your chatbot's personality and role. This instruction guides how it responds.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

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
                          onChange={(e) => field.onChange(parseInt(e.target.value))}
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
                      Message shown when the AI cannot understand or respond appropriately
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="flex justify-end space-x-4">
            <Button 
              type="button" 
              variant="outline" 
              asChild
            >
              <Link href="/dashboard">Cancel</Link>
            </Button>
            <Button 
              type="submit" 
              disabled={updateMutation.isPending}
            >
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
        </form>
      </Form>
    </div>
  );
}
