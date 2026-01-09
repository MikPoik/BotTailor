import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { EmbedDesignForm, type EmbedDesignFormData } from "@/components/embed/EmbedDesignForm";
import { EmbedDesignPreview } from "@/components/embed/EmbedDesignPreview";
import { Button } from "@/components/ui/button";
import { Loader, Eye } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface EmbedDesign {
  id: number;
  embedId: string;
  name: string;
  description?: string;
  designType: "minimal" | "compact" | "full";
  primaryColor: string;
  backgroundColor: string;
  textColor: string;
  headerText?: string;
  footerText?: string;
  welcomeMessage?: string;
  inputPlaceholder: string;
  showAvatar: boolean;
  showTimestamp: boolean;
  hideBranding: boolean;
  chatbotConfigId: number;
}

export default function EmbedDesignEditPage() {
  const { guid, embedId } = useParams() as { guid: string; embedId?: string };
  const [location] = useLocation();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [previewOpen, setPreviewOpen] = useState(false);

  // Check if creating new by looking at the URL path
  const isNew = location.includes("/embed-design/new");

  // Fetch existing design
  const { data: design, isLoading: designLoading } = useQuery<EmbedDesign | undefined>({
    queryKey: [`/api/chatbots/${guid}/embeds/${embedId}`],
    enabled: !!guid && !isNew && !!embedId,
  });

  // Create/Update mutation
  const saveMutation = useMutation({
    mutationFn: async (data: EmbedDesignFormData): Promise<any> => {
      // Structure data for backend API
      const payload = {
        name: data.name,
        description: data.description,
        designType: data.designType,
        theme: {
          primaryColor: data.primaryColor,
          backgroundColor: data.backgroundColor,
          textColor: data.textColor,
        },
        ui: {
          headerText: data.headerText,
          footerText: data.footerText,
          welcomeMessage: data.welcomeMessage,
          inputPlaceholder: data.inputPlaceholder,
          showAvatar: data.showAvatar,
          showTimestamp: data.showTimestamp,
          hideBranding: data.hideBranding,
        },
      };

      const url = isNew 
        ? `/api/chatbots/${guid}/embeds`
        : `/api/chatbots/${guid}/embeds/${embedId}`;
      
      const method = isNew ? "POST" : "PUT";
      const response = await apiRequest(method, url, payload);
      const result = await response.json();
      return result;
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: [`/api/chatbots/${guid}/embeds`] });
      toast({
        title: "Success",
        description: isNew ? "Design created successfully" : "Design updated successfully",
      });
      // Use the embedId from the response to ensure correct navigation
      const targetEmbedId = response.embedId || embedId;
      navigate(`/chatbot/${guid}/embed-designs`);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to save design",
        variant: "destructive",
      });
    },
  });

  const handleSave = (data: EmbedDesignFormData) => {
    return new Promise<void>((resolve, reject) => {
      saveMutation.mutate(data, {
        onSuccess: () => resolve(),
        onError: (error) => reject(error),
      });
    });
  };

  const isPending = saveMutation.isPending;

  const previewConfig = design 
    ? {
        designType: design.designType as "minimal" | "compact" | "full",
        theme: {
          primaryColor: design.primaryColor,
          backgroundColor: design.backgroundColor,
          textColor: design.textColor,
        },
        ui: {
          headerText: design.headerText,
          footerText: design.footerText,
          inputPlaceholder: design.inputPlaceholder,
          welcomeMessage: design.welcomeMessage,
          showAvatar: design.showAvatar,
          showTimestamp: design.showTimestamp,
          hideBranding: design.hideBranding,
        },
        components: [],
        chatbotConfigId: design.chatbotConfigId,
      }
    : {
        designType: "compact" as const,
        theme: {
          primaryColor: "#2563eb",
          backgroundColor: "#ffffff",
          textColor: "#1f2937",
        },
        ui: {
          headerText: "Chat with us",
          inputPlaceholder: "Type your message...",
          welcomeMessage: "Welcome! How can we help?",
          showAvatar: true,
          showTimestamp: true,
          hideBranding: false,
        },
        components: [],
        chatbotConfigId: undefined,
      };

  if (designLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            {isNew ? "Create New Design" : "Edit Design"}
          </h1>
          <p className="text-gray-600 mt-1">
            {isNew
              ? "Create a custom embed design for your chatbot"
              : `Editing: ${design?.name || ""}`}
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => setPreviewOpen(true)}
          className="gap-2"
        >
          <Eye className="w-4 h-4" />
          Preview
        </Button>
      </div>

      {/* Form and Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg border p-6">
            <EmbedDesignForm
              initialData={design ? {
                name: design.name,
                description: design.description,
                designType: design.designType,
                primaryColor: design.primaryColor,
                backgroundColor: design.backgroundColor,
                textColor: design.textColor,
                headerText: design.headerText,
                footerText: design.footerText,
                welcomeMessage: design.welcomeMessage,
                inputPlaceholder: design.inputPlaceholder,
                showAvatar: design.showAvatar,
                showTimestamp: design.showTimestamp,
                hideBranding: design.hideBranding,
              } : undefined}
              onSubmit={handleSave}
              isLoading={isPending}
              submitButtonText={isNew ? "Create Design" : "Save Changes"}
            />
          </div>
        </div>

        {/* Live Preview (Desktop only) */}
        <div className="hidden lg:block">
          <div className="sticky top-6 bg-white rounded-lg border p-4">
            <h3 className="font-semibold mb-3">Quick Preview</h3>
            <div
              className="border rounded-lg h-96 overflow-hidden flex flex-col"
              style={{
                backgroundColor: previewConfig.theme.backgroundColor,
                color: previewConfig.theme.textColor,
              }}
            >
              <div
                className="px-3 py-2 border-b flex items-center justify-between text-sm font-medium"
                style={{ borderBottomColor: previewConfig.theme.primaryColor }}
              >
                <span>{previewConfig.ui.headerText || "Chat"}</span>
                <span className="text-xs opacity-75">Preview</span>
              </div>
              <div className="flex-1 overflow-auto p-3 flex items-center justify-center">
                <p className="text-xs text-center opacity-75">
                  Full preview available below
                </p>
              </div>
              <div className="p-2 border-t" style={{ borderTopColor: previewConfig.theme.primaryColor }}>
                <div className="text-xs text-center opacity-75">Input area</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      <EmbedDesignPreview
        config={previewConfig}
        embedId={design?.embedId}
        isOpen={previewOpen}
        onClose={() => setPreviewOpen(false)}
      />
    </div>
  );
}
