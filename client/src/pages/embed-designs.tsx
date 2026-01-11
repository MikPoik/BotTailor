import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useRoute, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Plus, Edit2, Trash2, Eye, Copy } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { EmbedDesignPreview } from "@/components/embed/EmbedDesignPreview";

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
  createdAt: Date;
}

export default function EmbedDesignsPage() {
  const { guid } = useParams() as { guid: string };
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [previewDesign, setPreviewDesign] = useState<EmbedDesign | null>(null);

  // Fetch embed designs for this chatbot
  const { data: designs = [], isLoading, error } = useQuery({
    queryKey: [`/api/chatbots/${guid}/embeds`],
    enabled: !!guid,
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (embedId: string) => {
      return await apiRequest("DELETE", `/api/chatbots/${guid}/embeds/${embedId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/chatbots/${guid}/embeds`] });
      toast({ title: "Design deleted", description: "Embed design removed" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete design", variant: "destructive" });
    },
  });

  const filteredDesigns = (designs as EmbedDesign[]).filter((design: EmbedDesign) =>
    design.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const designTypeStyles = {
    minimal: "bg-blue-100 text-blue-800",
    compact: "bg-green-100 text-green-800",
    full: "bg-purple-100 text-purple-800",
  };

  const designTypeLabels = {
    minimal: "Minimal",
    compact: "Compact",
    full: "Full",
  };

  return (
    <div className="container max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Embed Designs</h1>
          <p className="text-gray-600 mt-1">Create and manage custom embed designs for your chatbot</p>
        </div>
        <Button onClick={() => navigate(`/chatbot/${guid}/embed-design/new`)} className="gap-2">
          <Plus className="w-4 h-4" />
          New Design
        </Button>
      </div>

      {/* Search */}
      <div>
        <Input
          placeholder="Search designs..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-gray-500">Loading designs...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded p-4 text-red-900">
          <p>Failed to load designs. Please try again.</p>
        </div>
      ) : filteredDesigns.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">
            {searchTerm ? "No designs match your search" : "No embed designs yet"}
          </p>
          <Button onClick={() => navigate(`/chatbot/${guid}/embed-design/new`)}>
            Create your first design
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDesigns.map((design: EmbedDesign) => (
            <div
              key={design.id}
              className="border rounded-lg p-4 hover:shadow-lg transition-shadow"
            >
              {/* Preview Color */}
              <div
                className="h-24 rounded mb-3"
                style={{
                  backgroundColor: design.backgroundColor,
                  border: `2px solid ${design.primaryColor}`,
                }}
              />

              {/* Design Info */}
              <h3 className="font-semibold text-lg truncate">{design.name}</h3>
              {design.description && (
                <p className="text-sm text-gray-600 mb-2 line-clamp-2">{design.description}</p>
              )}

              {/* Design Type Badge */}
              <div className="flex items-center gap-2 mb-3">
                <Badge className={designTypeStyles[design.designType]}>
                  {designTypeLabels[design.designType]}
                </Badge>
                <span className="text-xs text-gray-500">
                  {new Date(design.createdAt).toLocaleDateString()}
                </span>
              </div>

              {/* Embed ID */}
              <div className="bg-gray-50 rounded p-2 mb-3">
                <p className="text-xs text-gray-500 mb-1">Embed ID</p>
                <div className="flex items-center justify-between gap-1">
                  <code className="text-xs font-mono truncate">{design.embedId}</code>
                  <div className="flex items-center gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        navigator.clipboard.writeText(design.embedId);
                        toast({ title: "Copied", description: "Embed ID copied to clipboard" });
                      }}
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        const origin = typeof window !== "undefined" ? window.location.origin : "";
                        const iframe = `<iframe\n  src="${origin}/embed/${design.embedId}"\n  width="400"\n  height="500"\n  frameborder="0"\n  style="border: none; border-radius: 8px;"\n></iframe>`;
                        navigator.clipboard.writeText(iframe);
                        toast({ title: "Embed code copied", description: "Iframe HTML copied to clipboard" });
                      }}
                    >
                      <Copy className="w-3 h-3 mr-1" /> Embed Code
                    </Button>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1"
                  onClick={() => navigate(`/chatbot/${guid}/embed-design/${design.embedId}/edit`)}
                >
                  <Edit2 className="w-3 h-3 mr-1" />
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setPreviewDesign(design)}
                >
                  <Eye className="w-3 h-3 mr-1" />
                  Preview
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-red-600 hover:text-red-700"
                  onClick={() => {
                    if (confirm("Delete this design?")) {
                      deleteMutation.mutate(design.embedId);
                    }
                  }}
                  disabled={deleteMutation.isPending}
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Preview Modal */}
      {previewDesign && (
        <EmbedDesignPreview
          config={{
            designType: previewDesign.designType,
            theme: {
              primaryColor: previewDesign.primaryColor,
              backgroundColor: previewDesign.backgroundColor,
              textColor: previewDesign.textColor,
            },
            ui: {
              headerText: previewDesign.headerText,
              footerText: previewDesign.footerText,
              inputPlaceholder: previewDesign.inputPlaceholder,
              welcomeMessage: previewDesign.welcomeMessage,
              showAvatar: previewDesign.showAvatar,
              showTimestamp: previewDesign.showTimestamp,
              hideBranding: previewDesign.hideBranding,
            },
            components: [],
          }}
          embedId={previewDesign.embedId}
          isOpen={!!previewDesign}
          onClose={() => setPreviewDesign(null)}
        />
      )}
    </div>
  );
}
