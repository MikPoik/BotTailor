import { useState, useEffect } from "react";
import { Link, useParams, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  ArrowLeft, 
  Plus, 
  Globe, 
  RefreshCw, 
  Trash2, 
  CheckCircle, 
  AlertCircle, 
  Clock,
  ExternalLink
} from "lucide-react";

interface WebsiteSource {
  id: number;
  chatbotConfigId: number;
  url: string;
  title: string | null;
  description: string | null;
  sitemapUrl: string | null;
  lastScanned: string | null;
  totalPages: number;
  status: 'pending' | 'scanning' | 'completed' | 'error';
  errorMessage: string | null;
  maxPages: number;
  createdAt: string;
  updatedAt: string;
}

interface ChatbotConfig {
  id: number;
  name: string;
  description: string;
}

const addWebsiteSchema = z.object({
  url: z.string().url("Please enter a valid URL"),
  title: z.string().optional(),
  description: z.string().optional(),
  maxPages: z.number().min(1).max(200).default(50),
});

type FormData = z.infer<typeof addWebsiteSchema>;

export default function AddData() {
  const { guid } = useParams();
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const form = useForm<FormData>({
    resolver: zodResolver(addWebsiteSchema),
    defaultValues: {
      url: "",
      title: "",
      description: "",
      maxPages: 50,
    },
  });

  // Redirect to dashboard if not authenticated
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

  // Get chatbot details
  const { data: chatbot, isLoading: chatbotLoading } = useQuery<ChatbotConfig>({
    queryKey: [`/api/chatbots/${guid}`],
    enabled: isAuthenticated && !!guid,
    retry: false,
  });

  // Get website sources for this chatbot with polling for active scans
  const { data: websiteSources, isLoading: sourcesLoading } = useQuery<WebsiteSource[]>({
    queryKey: [`/api/chatbots/${chatbot?.id}/website-sources`],
    enabled: isAuthenticated && !!chatbot?.id,
    retry: false,
    refetchInterval: (data, query) => {
      // Poll every 3 seconds if there are any sources still scanning
      if (!data || !Array.isArray(data)) return false;
      const hasScanning = data.some((source: WebsiteSource) => 
        source.status === 'scanning' || source.status === 'pending'
      );
      console.log('Polling check:', data.map(s => ({id: s.id, status: s.status})), 'hasScanning:', hasScanning);
      
      // If there was an error (like 401), stop polling to prevent spam
      if (query.state.error) {
        console.log('Stopping polling due to error:', query.state.error);
        return false;
      }
      
      return hasScanning ? 3000 : false;
    },
    refetchOnWindowFocus: true,
    staleTime: 0, // Always consider data stale for fresh updates
    onError: (error) => {
      console.error('Error fetching website sources:', error);
    }
  });

  // Add website source mutation
  const addWebsiteMutation = useMutation({
    mutationFn: async (data: FormData) => {
      if (!chatbot?.id) throw new Error("Chatbot not found");
      const response = await apiRequest("POST", `/api/chatbots/${chatbot.id}/website-sources`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/chatbots/${chatbot?.id}/website-sources`] });
      form.reset();
      toast({
        title: "Website Added",
        description: "Website source has been added and scanning started.",
      });
    },
    onError: (error: Error) => {
      console.error("Add website error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to add website source",
        variant: "destructive",
      });
    },
  });

  // Delete website source mutation
  const deleteWebsiteMutation = useMutation({
    mutationFn: async (sourceId: number) => {
      if (!chatbot?.id) throw new Error("Chatbot not found");
      await apiRequest("DELETE", `/api/chatbots/${chatbot.id}/website-sources/${sourceId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/chatbots/${chatbot?.id}/website-sources`] });
      toast({
        title: "Website Deleted",
        description: "Website source has been removed.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete website source",
        variant: "destructive",
      });
    },
  });

  // Rescan website mutation
  const rescanMutation = useMutation({
    mutationFn: async (sourceId: number) => {
      if (!chatbot?.id) throw new Error("Chatbot not found");
      const response = await apiRequest("POST", `/api/chatbots/${chatbot.id}/website-sources/${sourceId}/rescan`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/chatbots/${chatbot?.id}/website-sources`] });
      toast({
        title: "Rescan Started",
        description: "Website scanning has been restarted.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to rescan website",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FormData) => {
    console.log("Form submission data:", data);
    addWebsiteMutation.mutate(data);
  };

  const handleDelete = (sourceId: number) => {
    if (window.confirm("Are you sure you want to delete this website source? This will remove all associated content.")) {
      deleteWebsiteMutation.mutate(sourceId);
    }
  };

  const handleRescan = (sourceId: number) => {
    rescanMutation.mutate(sourceId);
  };

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: [`/api/chatbots/${chatbot?.id}/website-sources`] });
    toast({
      title: "Refreshed",
      description: "Website sources list has been refreshed.",
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'scanning':
        return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      completed: "default" as const,
      error: "destructive" as const,
      scanning: "secondary" as const,
      pending: "outline" as const,
    };
    return <Badge variant={variants[status as keyof typeof variants] || "outline"}>{status}</Badge>;
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
          <p className="text-muted-foreground mb-4">The chatbot you're looking for doesn't exist or you don't have permission to access it.</p>
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
    <div className="min-h-screen bg-background">
      <div className="container max-w-6xl py-8 px-4 sm:px-6 lg:px-8">
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
            <Globe className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold tracking-tight">
              Add Data: {chatbot.name}
            </h1>
          </div>
          <p className="text-muted-foreground">
            Add website sources to provide context for your chatbot. The system will scan your websites and use the content to make responses more relevant.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Add Website Form */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  Add Website
                </CardTitle>
                <CardDescription>
                  Enter a website URL to scan for content. The system will automatically discover pages and extract relevant information.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div>
                    <Label htmlFor="url">Website URL *</Label>
                    <Input
                      id="url"
                      type="url"
                      placeholder="https://example.com"
                      {...form.register("url")}
                    />
                    {form.formState.errors.url && (
                      <p className="text-sm text-red-500 mt-1">
                        {form.formState.errors.url.message}
                      </p>
                    )}
                  </div>
                  
                  <div>
                    <Label htmlFor="title">Title (Optional)</Label>
                    <Input
                      id="title"
                      placeholder="Website name"
                      {...form.register("title")}
                    />
                  </div>

                  <div>
                    <Label htmlFor="description">Description (Optional)</Label>
                    <Input
                      id="description"
                      placeholder="Brief description"
                      {...form.register("description")}
                    />
                  </div>

                  <div>
                    <Label htmlFor="maxPages">Max Pages to Scan</Label>
                    <Input
                      id="maxPages"
                      type="number"
                      min="1"
                      max="200"
                      {...form.register("maxPages", { valueAsNumber: true })}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Limit: 1-200 pages
                    </p>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full"
                    disabled={addWebsiteMutation.isPending}
                  >
                    {addWebsiteMutation.isPending ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Adding...
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Website
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Website Sources List */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Website Sources</CardTitle>
                    <CardDescription>
                      Manage the websites that provide context for your chatbot.
                    </CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRefresh}
                    disabled={sourcesLoading}
                  >
                    <RefreshCw className={`h-4 w-4 ${sourcesLoading ? 'animate-spin' : ''}`} />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {sourcesLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                  </div>
                ) : !websiteSources || websiteSources.length === 0 ? (
                  <div className="text-center py-8">
                    <Globe className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No websites added yet</h3>
                    <p className="text-muted-foreground">
                      Add your first website to start providing context for your chatbot.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {websiteSources.map((source) => (
                      <div key={source.id} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              {getStatusIcon(source.status)}
                              <h3 className="font-medium truncate">
                                {source.title || source.url}
                              </h3>
                              {getStatusBadge(source.status)}
                            </div>
                            
                            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                              <ExternalLink className="h-3 w-3" />
                              <a 
                                href={source.url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="hover:underline truncate"
                              >
                                {source.url}
                              </a>
                            </div>

                            {source.description && (
                              <p className="text-sm text-muted-foreground mb-2">
                                {source.description}
                              </p>
                            )}

                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <span>Pages: {source.totalPages}/{source.maxPages}</span>
                              {source.lastScanned && (
                                <span>
                                  Last scanned: {new Date(source.lastScanned).toLocaleDateString()}
                                </span>
                              )}
                            </div>

                            {source.status === 'error' && source.errorMessage && (
                              <div className="mt-2 p-2 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded text-sm text-red-700 dark:text-red-400">
                                Error: {source.errorMessage}
                              </div>
                            )}
                          </div>

                          <div className="flex items-center gap-2 ml-4">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleRescan(source.id)}
                              disabled={rescanMutation.isPending || source.status === 'scanning'}
                            >
                              <RefreshCw className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDelete(source.id)}
                              disabled={deleteWebsiteMutation.isPending}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}