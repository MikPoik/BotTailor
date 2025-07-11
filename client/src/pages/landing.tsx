import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Bot, MessageSquare, Settings, Zap } from "lucide-react";

export default function Landing() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="flex-1 flex items-center justify-center px-4 py-12 md:py-24">
        <div className="container max-w-4xl text-center">
          <div className="mb-6">
            <Bot className="h-16 w-16 mx-auto mb-4 text-primary" />
            <h1 className="text-4xl font-bold tracking-tight md:text-6xl">
              Build Your AI Chatbot
            </h1>
          </div>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Create intelligent, customizable chatbots that can be embedded anywhere. 
            Start building your AI-powered customer support today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild>
              <a href="/api/login">Get Started</a>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <a href="#features">Learn More</a>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-12 md:py-24 bg-muted/50">
        <div className="container max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
              Everything you need to build amazing chatbots
            </h2>
            <p className="text-lg text-muted-foreground mt-4">
              Powerful tools and features to create intelligent conversational experiences
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <MessageSquare className="h-8 w-8 text-primary mb-2" />
                <CardTitle>Rich Conversations</CardTitle>
                <CardDescription>
                  Support for text, cards, menus, and interactive elements
                </CardDescription>
              </CardHeader>
              <CardContent>
                Create engaging conversations with multimedia support, quick replies, 
                and structured content that guides users effectively.
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Settings className="h-8 w-8 text-primary mb-2" />
                <CardTitle>Easy Configuration</CardTitle>
                <CardDescription>
                  Customize behavior, personality, and responses
                </CardDescription>
              </CardHeader>
              <CardContent>
                Configure your chatbot's personality, system prompts, and behavior 
                with an intuitive interface. No coding required.
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Zap className="h-8 w-8 text-primary mb-2" />
                <CardTitle>Easy Integration</CardTitle>
                <CardDescription>
                  Embed anywhere with a simple JavaScript snippet
                </CardDescription>
              </CardHeader>
              <CardContent>
                Add your chatbot to any website with just a few lines of code. 
                Responsive design works on desktop and mobile.
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 md:py-24">
        <div className="container max-w-4xl text-center">
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl mb-4">
            Ready to get started?
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            Create your first AI chatbot in minutes
          </p>
          <Button size="lg" asChild>
            <a href="/api/login">Sign Up Now</a>
          </Button>
        </div>
      </section>
    </div>
  );
}