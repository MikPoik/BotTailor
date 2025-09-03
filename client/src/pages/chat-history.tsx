import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, MessageCircle, Clock, Calendar, Download } from "lucide-react";
import { Link } from "wouter";
import { useState } from "react";
import { format } from "date-fns";

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

interface Message {
  id: number;
  sessionId: string;
  content: string;
  sender: 'user' | 'bot';
  messageType: string;
  metadata?: any;
  createdAt: string;
}

interface SessionsResponse {
  sessions: ChatSession[];
  chatbotName: string;
}

interface MessagesResponse {
  messages: Message[];
  sessionId: string;
}

export default function ChatHistory() {
  const { guid } = useParams<{ guid: string }>();
  const [selectedSession, setSelectedSession] = useState<string | null>(null);

  // Fetch chat sessions for this chatbot
  const { data: sessionsData, isLoading: sessionsLoading, error: sessionsError } = useQuery<SessionsResponse>({
    queryKey: [`/api/chatbots/${guid}/sessions`],
    enabled: !!guid,
  });

  // Fetch messages for selected session
  const { data: messagesData, isLoading: messagesLoading } = useQuery<MessagesResponse>({
    queryKey: [`/api/chat/${selectedSession}/messages`],
    enabled: !!selectedSession,
  });

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
                  // Function to display rich message content appropriately
                  const getDisplayContent = (msg: Message) => {
                    switch (msg.messageType) {
                      case 'form':
                        return '[Form shown]';
                      case 'menu':
                        const menuOptions = msg.metadata?.options?.map((opt: any) => opt.text).join(', ') || '';
                        return menuOptions ? `Menu: ${menuOptions}` : msg.content;
                      case 'quickReplies':
                        const quickReplies = msg.metadata?.quickReplies?.join(', ') || '';
                        return quickReplies ? `Quick replies: ${quickReplies}` : msg.content;
                      case 'card':
                        const title = msg.metadata?.title;
                        const description = msg.metadata?.description;
                        return title ? `Card: ${title}${description ? ` - ${description}` : ''}` : msg.content;
                      default:
                        return msg.content;
                    }
                  };

                  return (
                    <div
                      key={message.id}
                      className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                          message.sender === 'user'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        <div className="text-sm">{getDisplayContent(message)}</div>
                        <div className="text-xs opacity-70 mt-1">
                          {format(new Date(message.createdAt), 'MMM d, HH:mm')}
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
                {sessionsData.sessions.length} conversation{sessionsData.sessions.length !== 1 ? 's' : ''}
              </CardDescription>
            </CardHeader>
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
                  <Button variant="ghost" size="sm">
                    View
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}