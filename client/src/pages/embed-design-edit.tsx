import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { EmbedDesignForm, type EmbedDesignFormData } from "@/components/embed/EmbedDesignForm-v2";
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
  ctaConfig?: any; // CTA configuration
}

export default function EmbedDesignEditPage() {
  const { guid, embedId } = useParams() as { guid: string; embedId?: string };
  const [location] = useLocation();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [previewOpen, setPreviewOpen] = useState(false);
  const [formValues, setFormValues] = useState<EmbedDesignFormData | null>(null);

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
        // Include CTA configuration when present
        ctaConfig: data.ctaConfig,
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
    // Update preview in real-time
    setFormValues(data);

    // Ensure CTA config is included — prefer the form value, then local preview state, then existing design
    const finalData: EmbedDesignFormData = {
      ...data,
      ctaConfig: (data as any).ctaConfig || (formValues as any)?.ctaConfig || (design as any)?.ctaConfig,
    } as EmbedDesignFormData;

    return new Promise<void>((resolve, reject) => {
      saveMutation.mutate(finalData, {
        onSuccess: () => resolve(),
        onError: (error) => reject(error),
      });
    });
  };

  const isPending = saveMutation.isPending;

  // Use form values for preview if available, otherwise use database design
  const previewConfig = formValues
    ? {
        designType: (formValues.designType || "compact") as "minimal" | "compact" | "full",
        theme: {
          primaryColor: formValues.primaryColor || "#2563eb",
          backgroundColor: formValues.backgroundColor || "#ffffff",
          textColor: formValues.textColor || "#1f2937",
        },
        ui: {
          headerText: formValues.headerText || "Chat with us",
          footerText: formValues.footerText,
          inputPlaceholder: formValues.inputPlaceholder || "Type your message...",
          welcomeMessage: formValues.welcomeMessage || "Welcome! How can we help?",
          showAvatar: formValues.showAvatar !== false,
          showTimestamp: formValues.showTimestamp !== false,
          hideBranding: formValues.hideBranding === true,
        },
        components: [],
        chatbotConfigId: design?.chatbotConfigId,
      }
    : design 
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

      {/* Form */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                ctaConfig: design.ctaConfig, // Load saved CTA config
              } : undefined}
              onSubmit={handleSave}
              onChange={setFormValues}
              isLoading={isPending}
              submitButtonText={isNew ? "Create Design" : "Save Changes"}
            />
          </div>
        </div>

        {/* Right preview removed for CTA tab; use modal Preview button instead */}
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
