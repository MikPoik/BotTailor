import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useLocation } from "wouter";
import { useEffect } from "react";
import { insertChatbotConfigSchema } from "@shared/schema";
import { z } from "zod";
import { ArrowLeft, Bot, Save } from "lucide-react";
import { Link } from "wouter";

// Create a more explicit form schema to ensure proper typing
const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  systemPrompt: z.string().min(1, "System prompt is required"),
  model: z.string().min(1, "Model is required"),
  temperature: z.number().min(0).max(10).default(7),
  maxTokens: z.number().min(100).max(4000).default(1000),
  welcomeMessage: z.string().optional(),
  fallbackMessage: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

export default function ChatbotForm() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

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

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    mode: "onChange", // This will validate on every change
    defaultValues: {
      name: "",
      description: "",
      systemPrompt: "You are a helpful AI assistant. Provide clear, accurate, and friendly responses to user questions.",
      model: "gpt-4o-mini",
      temperature: 7,
      maxTokens: 1000,
      welcomeMessage: "Hello! How can I help you today?",
      fallbackMessage: "I'm sorry, I didn't understand that. Could you please rephrase your question?",
    },
  });

  // Force validation on mount to consider default values as valid
  useEffect(() => {
    form.trigger(); // This forces validation of all fields
  }, [form]);

  const createMutation = useMutation({
    mutationFn: async (data: FormData) => {
      console.log("Making API request to create chatbot with data:", data);
      try {
        const response = await apiRequest(`/api/chatbots`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        console.log("API response:", response);
        return response;
      } catch (error) {
        console.error("API request failed:", error);
        throw error;
      }
    },
    onSuccess: (data) => {
      console.log("Mutation successful:", data);
      toast({
        title: "Success",
        description: "Chatbot configuration created successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/chatbots"] });
      setLocation("/dashboard");
    },
    onError: (error) => {
      console.error("Mutation error:", error);
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
        description: "Failed to create chatbot configuration. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FormData) => {
    console.log("Form submitted with data:", data);
    console.log("Form errors:", form.formState.errors);
    console.log("About to call createMutation.mutate");
    console.log("Mutation status:", {
      isIdle: createMutation.isIdle,
      isPending: createMutation.isPending,
      isError: createMutation.isError,
      isSuccess: createMutation.isSuccess
    });
    createMutation.mutate(data);
  };

  if (isLoading || !isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
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
          <h1 className="text-3xl font-bold tracking-tight">Create New Chatbot</h1>
        </div>
        <p className="text-muted-foreground">
          Configure your AI chatbot's personality, behavior, and responses
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={async (e) => {
          e.preventDefault();
          
          console.log("=== FORM DEBUG INFO ===");
          console.log("Form submit event triggered");
          
          // Force validation before submit
          const isValid = await form.trigger();
          console.log("Form is valid after trigger:", isValid);
          console.log("Form is valid (original):", form.formState.isValid);
          
          // Try to validate the form data manually
          const formData = form.getValues();
          const validationResult = formSchema.safeParse(formData);
          console.log("Manual validation result:", JSON.stringify(validationResult, null, 2));
          
          if (!validationResult.success) {
            console.log("Validation errors:", validationResult.error.errors);
            return; // Don't submit if validation fails
          }
          
          // Since manual validation passes, submit the validated data directly
          console.log("Submitting form with validated data");
          onSubmit(validationResult.data);
        }} className="space-y-8">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>
                Set up the basic details for your chatbot
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
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
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
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                  Creating...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Create Chatbot
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}