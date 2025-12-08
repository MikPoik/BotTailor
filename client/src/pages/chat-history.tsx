import { useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
// ...existing code...
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, MessageCircle, Clock, Calendar, Download, Trash2, AlertTriangle } from "lucide-react";
import { Link } from "wouter";
import { useState, useEffect } from "react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
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
import { apiRequest, queryClient } from "@/lib/queryClient";
import RichMessage from "@/components/chat/rich-message";
import { Message as SharedMessage } from "@shared/schema";
import React from "react";
import type { RouteDefinition } from "@shared/route-metadata";

export const route: RouteDefinition = {
  path: "/chat-history/:id",
  ssr: false,
  metadata: {
    title: "Chat History - BotTailor",
    description: "View conversation history and analytics for your chatbot.",
    ogTitle: "Chat History - BotTailor",
    ogDescription: "View chatbot conversation history.",
  },
};

interface ChatSession {
  id: number;
  sessionId: string;
  userId: string | null;
  chatbotConfigId: number;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
  lastMessageAt: string;
}

// Using shared Message interface instead of local duplicate

interface SessionsResponse {
  sessions: ChatSession[];
  chatbotName: string;
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    limit: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
  statistics?: {
    totalMessages: number;
    avgMessagesPerChat: number;
    longestChat: number;
    latestActivity: string;
  };
}

interface MessagesResponse {
  messages: SharedMessage[];
  sessionId: string;
}

export default function ChatHistory() {
  const { guid } = useParams<{ guid: string }>();
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const { toast } = useToast();

  // Update metadata on client side for CSR page
  useEffect(() => {
    if (typeof window !== "undefined") {
      import("@/lib/client-metadata").then(({ updateClientMetadata }) => {
        updateClientMetadata(window.location.pathname);
      });
    }
  }, [window.location.pathname]);


  // Fetch chat sessions for this chatbot
  const { data: sessionsData, isLoading: sessionsLoading, error: sessionsError } = useQuery<SessionsResponse>({
    queryKey: [`/api/chatbots/${guid}/sessions`, currentPage, pageSize],
    queryFn: async () => {
      const response = await apiRequest(
        "GET",
        `/api/chatbots/${guid}/sessions?page=${currentPage}&limit=${pageSize}`,
      );
      if (!response.ok) throw new Error('Failed to fetch sessions');
      return response.json();
    },
    enabled: !!guid,
  });

  // Fetch messages for selected session
  const { data: messagesData, isLoading: messagesLoading } = useQuery<MessagesResponse>({
    queryKey: [`/api/chat/${selectedSession}/messages`],
    enabled: !!selectedSession,
  });

  // Delete individual chat session mutation
  const deleteSessionMutation = useMutation({
    mutationFn: async (sessionId: string) => {
      const response = await apiRequest(`/api/chat/${sessionId}`, 'DELETE');
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/chatbots/${guid}/sessions`] });
      toast({
        title: "Success",
        description: "Chat session deleted successfully",
      });
      setSelectedSession(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete chat session",
        variant: "destructive",
      });
    },
  });

  // Delete all chat sessions mutation
  const deleteAllSessionsMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest(`/api/chatbots/${guid}/sessions`, 'DELETE');
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/chatbots/${guid}/sessions`] });
      toast({
        title: "Success",
        description: "All chat sessions deleted successfully",
      });
      setSelectedSession(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete all chat sessions",
        variant: "destructive",
      });
    },
  });

  const handleDeleteSession = (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteSessionMutation.mutate(sessionId);
  };

  const handleDeleteAllSessions = () => {
    deleteAllSessionsMutation.mutate();
  };

  if (sessionsLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Link>
          </Button>
        </div>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (sessionsError) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Link>
          </Button>
        </div>
        <Card>
          <CardContent className="py-8">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-red-600 mb-2">Error Loading Chat History</h3>
              <p className="text-muted-foreground">Failed to load chat sessions. Please try again later.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (selectedSession) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="sm" onClick={() => setSelectedSession(null)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Sessions
          </Button>
          <h1 className="text-2xl font-bold">Conversation Details</h1>
          <Button 
            variant="destructive" 
            size="sm"
            onClick={() => handleDeleteSession(selectedSession, {} as React.MouseEvent)}
            disabled={deleteSessionMutation.isPending}
            data-testid="button-delete-session"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            {deleteSessionMutation.isPending ? "Deleting..." : "Delete Session"}
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Session: {selectedSession}</CardTitle>
                <CardDescription>
                  {messagesData?.messages.length || 0} messages
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" disabled>
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {messagesLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              </div>
            ) : (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {messagesData?.messages.map((message) => {
                  // No-op handlers for analytics view (messages are read-only)
                  const handleOptionSelect = () => {};
                  const handleQuickReply = () => {};

                  return (
                    <div
                      key={message.id}
                      className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-xs lg:max-w-md space-y-2`}>
                        {/* Message content with proper rich message rendering */}
                        <div
                          className={`px-4 py-2 rounded-lg ${
                            message.sender === 'user'
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          {message.sender === 'bot' && message.messageType !== 'text' ? (
                            <div className="analytics-rich-message">
                              <RichMessage 
                                message={message}
                                onOptionSelect={handleOptionSelect}
                                onQuickReply={handleQuickReply}
                                sessionId={selectedSession}
                              />
                            </div>
                          ) : (
                            <div className="text-sm">{message.content}</div>
                          )}
                        </div>
                        <div className="text-xs opacity-70 px-1">
                          {format(new Date(message.createdAt), 'MMM d, HH:mm')}
                          {message.messageType !== 'text' && (
                            <span className="ml-2 text-xs bg-black/10 px-1 rounded">
                              {message.messageType}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
                {messagesData?.messages.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No messages in this conversation
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">Chat History</h1>
        {sessionsData && sessionsData.sessions.length > 0 && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button 
                variant="destructive" 
                size="sm"
                disabled={deleteAllSessionsMutation.isPending}
                data-testid="button-delete-all-sessions"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                {deleteAllSessionsMutation.isPending ? "Deleting..." : "Delete All Chats"}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent data-testid="dialog-delete-all-confirmation">
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                  Delete All Chat Sessions
                </AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete all {sessionsData.sessions.length} chat session{sessionsData.sessions.length !== 1 ? 's' : ''}? 
                  This action cannot be undone and will permanently remove all conversations and messages.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel data-testid="button-cancel-delete-all">Cancel</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={handleDeleteAllSessions}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  data-testid="button-confirm-delete-all"
                >
                  Delete All Sessions
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>

      {sessionsData && (
        <div className="mb-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5" />
                {sessionsData.chatbotName}
              </CardTitle>
              <CardDescription>
                {sessionsData.pagination ? 
                  `${sessionsData.pagination.totalCount} conversation${sessionsData.pagination.totalCount !== 1 ? 's' : ''} (Page ${sessionsData.pagination.currentPage} of ${sessionsData.pagination.totalPages})` :
                  `${sessionsData.sessions.length} conversation${sessionsData.sessions.length !== 1 ? 's' : ''}`
                }
              </CardDescription>
            </CardHeader>
            {sessionsData.sessions.length > 0 && (
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">
                      {sessionsData.statistics?.totalMessages || sessionsData.sessions.reduce((total, session) => total + session.messageCount, 0)}
                    </div>
                    <div className="text-sm text-muted-foreground">Total Messages</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">
                      {sessionsData.statistics?.avgMessagesPerChat || Math.round(sessionsData.sessions.reduce((total, session) => total + session.messageCount, 0) / sessionsData.sessions.length)}
                    </div>
                    <div className="text-sm text-muted-foreground">Avg Messages/Chat</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">
                      {sessionsData.statistics?.longestChat || Math.max(...sessionsData.sessions.map(s => s.messageCount))}
                    </div>
                    <div className="text-sm text-muted-foreground">Longest Chat</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">
                      {sessionsData.statistics?.latestActivity ? 
                        format(new Date(sessionsData.statistics.latestActivity), 'MMM d') :
                        format(new Date(Math.max(...sessionsData.sessions.map(s => new Date(s.lastMessageAt).getTime()))), 'MMM d')
                      }
                    </div>
                    <div className="text-sm text-muted-foreground">Latest Activity</div>
                  </div>
                </div>
              </CardContent>
            )}
          </Card>
        </div>
      )}

      {sessionsData?.sessions.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <MessageCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No conversations yet</h3>
              <p className="text-muted-foreground">
                When users start chatting with your bot, their conversations will appear here.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {sessionsData?.sessions.map((session) => (
            <Card 
              key={session.id} 
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => setSelectedSession(session.sessionId)}
            >
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold">Session {session.sessionId.slice(-8)}</h3>
                      <Badge variant="outline">
                        {session.messageCount} message{session.messageCount !== 1 ? 's' : ''}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Started: {format(new Date(session.createdAt), 'MMM d, yyyy')}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Last activity: {format(new Date(session.lastMessageAt), 'MMM d, HH:mm')}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" data-testid="button-view-session">
                      View
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={(e) => handleDeleteSession(session.sessionId, e)}
                      disabled={deleteSessionMutation.isPending}
                      className="text-destructive hover:text-destructive"
                      data-testid={`button-delete-session-${session.sessionId.slice(-8)}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      {sessionsData?.pagination && sessionsData.pagination.totalPages > 1 && (
        <div className="mt-6">
          <Pagination>
            <PaginationContent>
              {sessionsData.pagination.hasPreviousPage && (
                <PaginationItem>
                  <PaginationPrevious 
                    onClick={() => setCurrentPage(currentPage - 1)}
                    className="cursor-pointer"
                  />
                </PaginationItem>
              )}

              {Array.from({ length: Math.min(5, sessionsData.pagination.totalPages) }, (_, i) => {
                const page = i + 1;
                return (
                  <PaginationItem key={page}>
                    <PaginationLink
                      onClick={() => setCurrentPage(page)}
                      isActive={page === currentPage}
                      className="cursor-pointer"
                    >
                      {page}
                    </PaginationLink>
                  </PaginationItem>
                );
              })}

              {sessionsData.pagination.hasNextPage && (
                <PaginationItem>
                  <PaginationNext 
                    onClick={() => setCurrentPage(currentPage + 1)}
                    className="cursor-pointer"
                  />
                </PaginationItem>
              )}
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
}