import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Mail, MessageSquare, Phone, CheckCircle } from "lucide-react";
import ChatWidget from "@/components/chat/chat-widget";
import { useGlobalChatSession } from "@/hooks/use-global-chat-session";
import type { RouteDefinition } from "@shared/route-metadata";

const contactFormSchema = z.object({
  contactType: z.enum(["sales", "support"], {
    required_error: "Please select how we can help you",
  }),
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  company: z.string().optional(),
  message: z.string().min(10, "Message must be at least 10 characters"),
});

type ContactFormData = z.infer<typeof contactFormSchema>;

export default function Contact() {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { toast } = useToast();
  // Use unified global chat session
  const { sessionId } = useGlobalChatSession();

  // Fetch the site default chatbot for chat widget
  const { data: defaultChatbot } = useQuery<{
    id: number;
    isActive: boolean;
    homeScreenConfig?: {
      theme?: {
        primaryColor?: string;
        backgroundColor?: string;
        textColor?: string;
      };
    };
    [key: string]: any;
  }>({
    queryKey: ['/api/public/default-chatbot'],
    enabled: true,
    retry: false,
  });

  const form = useForm<ContactFormData>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      contactType: "sales",
      name: "",
      email: "",
      company: "",
      message: "",
    },
  });

  const contactMutation = useMutation({
    mutationFn: async (data: ContactFormData) => {
      return apiRequest("POST", "/api/contact", data);
    },
    onSuccess: () => {
      setIsSubmitted(true);
      toast({
        title: "Message sent successfully!",
        description: "Thank you for contacting us. We'll get back to you within 24 hours.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to send message",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ContactFormData) => {
    contactMutation.mutate(data);
  };

  // Set page title and meta description
  if (typeof document !== 'undefined') {
    document.title = "Contact Us - BotTailor | Get in Touch with Our Team";
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 'Contact BotTailor for sales inquiries, technical support, or general questions. Our team is here to help you create the perfect AI chatbot for your business.');
    }
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full text-center">
          <div className="flex justify-center mb-6">
            <CheckCircle className="h-16 w-16 text-green-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Thank you for reaching out!
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mb-8">
            We've received your message and will get back to you within 24 hours.
          </p>
          <div className="space-y-4">
            <Button asChild className="w-full">
              <a href="/">Return to Homepage</a>
            </Button>
            <Button variant="outline" asChild className="w-full">
              <a href="/contact" onClick={() => setIsSubmitted(false)}>
                Send Another Message
              </a>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <Badge variant="outline" className="mb-4">
            Contact Us
          </Badge>
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl mb-4">
            Get in Touch
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Have questions about BotTailor? Need help getting started? Our team is here to help you create the perfect AI chatbot for your business.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Contact Information */}
          <div className="lg:col-span-1">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-primary" />
                    <CardTitle className="text-lg">Sales Inquiries</CardTitle>
                  </div>
                  <CardDescription>
                    Questions about plans, pricing, or custom solutions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Our sales team can help you choose the right plan and discuss enterprise features.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Phone className="h-5 w-5 text-primary" />
                    <CardTitle className="text-lg">Technical Support</CardTitle>
                  </div>
                  <CardDescription>
                    Help with setup, integration, or troubleshooting
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Get assistance with chatbot configuration, API integration, or any technical issues.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Mail className="h-5 w-5 text-primary" />
                    <CardTitle className="text-lg">Response Time</CardTitle>
                  </div>
                  <CardDescription>
                    We typically respond within 24 hours
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    For urgent technical issues, please mention "urgent" in your message subject.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Send us a message</CardTitle>
                <CardDescription>
                  Fill out the form below and we'll get back to you as soon as possible.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    {/* Contact Type */}
                    <FormField
                      control={form.control}
                      name="contactType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>How can we help you?</FormLabel>
                          <FormControl>
                            <RadioGroup
                              onValueChange={field.onChange}
                              value={field.value}
                              className="flex flex-col sm:flex-row gap-4"
                              data-testid="radio-contact-type"
                            >
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="sales" id="sales" data-testid="radio-sales" />
                                <label htmlFor="sales" className="cursor-pointer">
                                  Sales & Pricing
                                </label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="support" id="support" data-testid="radio-support" />
                                <label htmlFor="support" className="cursor-pointer">
                                  Technical Support
                                </label>
                              </div>
                            </RadioGroup>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Name and Email Row */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Full Name</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Your full name"
                                {...field}
                                data-testid="input-name"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email Address</FormLabel>
                            <FormControl>
                              <Input
                                type="email"
                                placeholder="your.email@company.com"
                                {...field}
                                data-testid="input-email"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Company */}
                    <FormField
                      control={form.control}
                      name="company"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Company (Optional)</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Your company name"
                              {...field}
                              data-testid="input-company"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Message */}
                    <FormField
                      control={form.control}
                      name="message"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Message</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Tell us about your project, questions, or how we can help..."
                              className="min-h-[120px]"
                              {...field}
                              data-testid="textarea-message"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Submit Button */}
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={contactMutation.isPending}
                      data-testid="button-submit"
                    >
                      {contactMutation.isPending ? (
                        <div className="flex items-center">
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                          Sending Message...
                        </div>
                      ) : (
                        "Send Message"
                      )}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      
      {/* Chat Widget */}
      {sessionId && defaultChatbot && defaultChatbot.isActive && (
        <ChatWidget 
          sessionId={sessionId}
          position="bottom-right"
          primaryColor={defaultChatbot.homeScreenConfig?.theme?.primaryColor || "#3b82f6"}
          backgroundColor={defaultChatbot.homeScreenConfig?.theme?.backgroundColor || "#ffffff"}
          textColor={defaultChatbot.homeScreenConfig?.theme?.textColor || "#1f2937"}
          chatbotConfig={defaultChatbot}
        />
      )}
    </div>
  );
}

export const route: RouteDefinition = {
  path: "/contact",
  ssr: true,
  metadata: {
    title: "Contact Us - BotTailor | Get Help with AI Chatbots",
    description:
      "Get in touch with our team for support, questions, or custom chatbot solutions. We're here to help you succeed.",
    keywords: "contact BotTailor, chatbot support, AI chatbot help, customer service",
    ogTitle: "Contact Us - BotTailor",
    ogDescription:
      "Get in touch with our team for support, questions, or custom chatbot solutions.",
    ogImage: "https://bottailor.com/og-contact.jpg",
    canonical: "https://bottailor.com/contact",
  },
};
