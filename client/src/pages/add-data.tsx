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
  ExternalLink,
  FileText,
  Upload,
  Type
} from "lucide-react";

interface WebsiteSource {
  id: number;
  chatbotConfigId: number;
  sourceType: 'website' | 'text' | 'file';
  url?: string;
  title: string | null;
  description: string | null;
  textContent?: string;
  fileName?: string;
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

const addTextSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  textContent: z.string().min(10, "Text content must be at least 10 characters"),
});

type WebsiteFormData = z.infer<typeof addWebsiteSchema>;
type TextFormData = z.infer<typeof addTextSchema>;

export default function AddData() {
  const { guid } = useParams();
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<'website' | 'text' | 'file'>('website');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  const websiteForm = useForm<WebsiteFormData>({
    resolver: zodResolver(addWebsiteSchema),
    defaultValues: {
      url: "",
      title: "",
      description: "",
      maxPages: 50,
    },
  });

  const textForm = useForm<TextFormData>({
    resolver: zodResolver(addTextSchema),
    defaultValues: {
      title: "",
      description: "",
      textContent: "",
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
    refetchInterval: (query) => {
      // Poll every 3 seconds if there are any sources still scanning
      const data = query.state.data;
      if (!data || !Array.isArray(data)) return false;
      const hasScanning = data.some((source: WebsiteSource) => 
        source.status === 'scanning' || source.status === 'pending'
      );
      
      // If there was an error (like 401), stop polling to prevent spam
      if (query.state.error) {
        return false;
      }
      
      return hasScanning ? 3000 : false;
    },
    refetchOnWindowFocus: true,
    staleTime: 0, // Always consider data stale for fresh updates
  });

  // Add content source mutation
  const addContentMutation = useMutation({
    mutationFn: async (data: any) => {
      if (!chatbot?.id) throw new Error("Chatbot not found");
      const response = await apiRequest("POST", `/api/chatbots/${chatbot.id}/website-sources`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/chatbots/${chatbot?.id}/website-sources`] });
      websiteForm.reset();
      textForm.reset();
      setUploadedFile(null);
      toast({
        title: "Content Added",
        description: "Content source has been added and processing started.",
      });
    },
    onError: (error: Error) => {
      console.error("Add content error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to add content source",
        variant: "destructive",
      });
    },
  });

  // Upload file mutation
  const uploadFileMutation = useMutation({
    mutationFn: async (data: { file: File; title?: string; description?: string }) => {
      if (!chatbot?.id) throw new Error("Chatbot not found");
      const formData = new FormData();
      formData.append('file', data.file);
      if (data.title) formData.append('title', data.title);
      if (data.description) formData.append('description', data.description);
      
      const response = await fetch(`/api/chatbots/${chatbot.id}/upload-text-file`, {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Upload failed');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/chatbots/${chatbot?.id}/website-sources`] });
      setUploadedFile(null);
      toast({
        title: "File Uploaded",
        description: "File has been uploaded and processing started.",
      });
    },
    onError: (error: Error) => {
      console.error("Upload file error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to upload file",
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

  const onWebsiteSubmit = (data: WebsiteFormData) => {
    console.log("Website submission data:", data);
    addContentMutation.mutate({ ...data, sourceType: 'website' });
  };

  const onTextSubmit = (data: TextFormData) => {
    console.log("Text submission data:", data);
    addContentMutation.mutate({ ...data, sourceType: 'text' });
  };

  const onFileUpload = () => {
    if (!uploadedFile) {
      toast({
        title: "Error",
        description: "Please select a file to upload",
        variant: "destructive",
      });
      return;
    }
    
    uploadFileMutation.mutate({ 
      file: uploadedFile,
      title: uploadedFile.name,
      description: `Uploaded file: ${uploadedFile.name}`
    });
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check file type
      const allowedTypes = ['text/plain', 'text/csv', 'text/markdown', 'application/json'];
      if (!allowedTypes.includes(file.type) && !file.type.startsWith('text/')) {
        toast({
          title: "Error",
          description: "Please select a text file (.txt, .csv, .md, .json, etc.)",
          variant: "destructive",
        });
        return;
      }
      
      // Check file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Error",
          description: "File size must be less than 5MB",
          variant: "destructive",
        });
        return;
      }
      
      setUploadedFile(file);
    }
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
            Add content sources to provide context for your chatbot. You can add websites to scan, paste text content directly, or upload text files.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Add Content Forms */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  Add Content
                </CardTitle>
                <CardDescription>
                  Choose how you want to add content to your chatbot.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Tab Navigation */}
                <div className="flex space-x-1 mb-4 bg-muted p-1 rounded-lg">
                  <button
                    type="button"
                    onClick={() => setActiveTab('website')}
                    className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                      activeTab === 'website'
                        ? 'bg-background shadow-sm text-foreground'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <Globe className="h-4 w-4" />
                    Website
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('text')}
                    className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                      activeTab === 'text'
                        ? 'bg-background shadow-sm text-foreground'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <Type className="h-4 w-4" />
                    Text
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('file')}
                    className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                      activeTab === 'file'
                        ? 'bg-background shadow-sm text-foreground'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <Upload className="h-4 w-4" />
                    File
                  </button>
                </div>

                {/* Website Form */}
                {activeTab === 'website' && (
                  <form onSubmit={websiteForm.handleSubmit(onWebsiteSubmit)} className="space-y-4">
                    <div>
                      <Label htmlFor="url">Website URL *</Label>
                      <Input
                        id="url"
                        type="url"
                        placeholder="https://example.com"
                        {...websiteForm.register("url")}
                      />
                      {websiteForm.formState.errors.url && (
                        <p className="text-sm text-red-500 mt-1">
                          {websiteForm.formState.errors.url.message}
                        </p>
                      )}
                    </div>
                    
                    <div>
                      <Label htmlFor="website-title">Title (Optional)</Label>
                      <Input
                        id="website-title"
                        placeholder="Website name"
                        {...websiteForm.register("title")}
                      />
                    </div>

                    <div>
                      <Label htmlFor="website-description">Description (Optional)</Label>
                      <Input
                        id="website-description"
                        placeholder="Brief description"
                        {...websiteForm.register("description")}
                      />
                    </div>

                    <div>
                      <Label htmlFor="maxPages">Max Pages to Scan</Label>
                      <Input
                        id="maxPages"
                        type="number"
                        min="1"
                        max="200"
                        {...websiteForm.register("maxPages", { valueAsNumber: true })}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Limit: 1-200 pages
                      </p>
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full"
                      disabled={addContentMutation.isPending}
                    >
                      {addContentMutation.isPending ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Adding...
                        </>
                      ) : (
                        <>
                          <Globe className="h-4 w-4 mr-2" />
                          Add Website
                        </>
                      )}
                    </Button>
                  </form>
                )}

                {/* Text Form */}
                {activeTab === 'text' && (
                  <form onSubmit={textForm.handleSubmit(onTextSubmit)} className="space-y-4">
                    <div>
                      <Label htmlFor="text-title">Title *</Label>
                      <Input
                        id="text-title"
                        placeholder="Content title"
                        {...textForm.register("title")}
                      />
                      {textForm.formState.errors.title && (
                        <p className="text-sm text-red-500 mt-1">
                          {textForm.formState.errors.title.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="text-description">Description (Optional)</Label>
                      <Input
                        id="text-description"
                        placeholder="Brief description"
                        {...textForm.register("description")}
                      />
                    </div>

                    <div>
                      <Label htmlFor="textContent">Text Content *</Label>
                      <textarea
                        id="textContent"
                        className="w-full min-h-[120px] px-3 py-2 border border-input bg-background text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 rounded-md"
                        placeholder="Paste your text content here..."
                        {...textForm.register("textContent")}
                      />
                      {textForm.formState.errors.textContent && (
                        <p className="text-sm text-red-500 mt-1">
                          {textForm.formState.errors.textContent.message}
                        </p>
                      )}
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full"
                      disabled={addContentMutation.isPending}
                    >
                      {addContentMutation.isPending ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Adding...
                        </>
                      ) : (
                        <>
                          <Type className="h-4 w-4 mr-2" />
                          Add Text Content
                        </>
                      )}
                    </Button>
                  </form>
                )}

                {/* File Upload Form */}
                {activeTab === 'file' && (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="file-upload">Select Text File</Label>
                      <Input
                        id="file-upload"
                        type="file"
                        accept=".txt,.csv,.md,.json,.xml"
                        onChange={handleFileChange}
                        className="cursor-pointer"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Supported: .txt, .csv, .md, .json, .xml (max 5MB)
                      </p>
                    </div>

                    {uploadedFile && (
                      <div className="p-3 bg-muted rounded-md">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          <span className="text-sm font-medium">{uploadedFile.name}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Size: {(uploadedFile.size / 1024).toFixed(1)}KB
                        </p>
                      </div>
                    )}

                    <Button 
                      type="button"
                      onClick={onFileUpload}
                      className="w-full"
                      disabled={!uploadedFile || uploadFileMutation.isPending}
                    >
                      {uploadFileMutation.isPending ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4 mr-2" />
                          Upload File
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Website Sources List */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Content Sources</CardTitle>
                    <CardDescription>
                      Manage the content sources that provide context for your chatbot.
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
                    <h3 className="text-lg font-medium mb-2">No content sources added yet</h3>
                    <p className="text-muted-foreground">
                      Add your first content source to start providing context for your chatbot.
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
                              <div className="flex items-center gap-2">
                                {source.sourceType === 'website' && <Globe className="h-3 w-3" />}
                                {source.sourceType === 'text' && <Type className="h-3 w-3" />}
                                {source.sourceType === 'file' && <FileText className="h-3 w-3" />}
                                <h3 className="font-medium truncate">
                                  {source.title || source.url || source.fileName || 'Untitled'}
                                </h3>
                              </div>
                              {getStatusBadge(source.status)}
                            </div>
                            
                            {source.sourceType === 'website' && source.url && (
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
                            )}
                            
                            {source.sourceType === 'file' && source.fileName && (
                              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                                <FileText className="h-3 w-3" />
                                <span className="truncate">File: {source.fileName}</span>
                              </div>
                            )}
                            
                            {source.sourceType === 'text' && (
                              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                                <Type className="h-3 w-3" />
                                <span className="truncate">Text content</span>
                              </div>
                            )}

                            {source.description && (
                              <p className="text-sm text-muted-foreground mb-2">
                                {source.description}
                              </p>
                            )}

                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <span>
                                {source.sourceType === 'website' ? 'Pages' : 'Chunks'}: {source.totalPages}
                              </span>
                              {source.lastScanned && (
                                <span>
                                  Last {source.sourceType === 'website' ? 'scanned' : 'processed'}: {new Date(source.lastScanned).toLocaleDateString()}
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