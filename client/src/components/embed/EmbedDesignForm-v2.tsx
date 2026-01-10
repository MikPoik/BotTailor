import React, { useState, useEffect } from "react";
import { useForm, FormProvider, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { EmbedThemeCustomizer } from "./EmbedThemeCustomizer";
import { CTABuilder } from "./embed-cta/CTABuilder";
import { CTAPreview } from "./embed-cta/CTAPreview";
import { CTAConfig } from "@shared/schema";

// Validation schema for embed design
const embedDesignSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  designType: z.enum(["minimal", "compact", "full"]),
  primaryColor: z.string().regex(/^#[0-9A-F]{6}$/i, "Must be valid hex color"),
  backgroundColor: z.string().regex(/^#[0-9A-F]{6}$/i, "Must be valid hex color"),
  textColor: z.string().regex(/^#[0-9A-F]{6}$/i, "Must be valid hex color"),
  headerText: z.string().optional(),
  footerText: z.string().optional(),
  welcomeMessage: z.string().optional(),
  inputPlaceholder: z.string().default("Type your message..."),
  showAvatar: z.boolean().default(true),
  showTimestamp: z.boolean().default(true),
  hideBranding: z.boolean().default(false),
  ctaConfig: z.any().optional(), // CTAConfig type
});

export type EmbedDesignFormData = z.infer<typeof embedDesignSchema>;

interface EmbedDesignFormProps {
  onSubmit: (data: EmbedDesignFormData) => Promise<void>;
  initialData?: Partial<EmbedDesignFormData>;
  isLoading?: boolean;
  submitButtonText?: string;
  onChange?: (data: EmbedDesignFormData) => void;
  chatbotName?: string;
}

export function EmbedDesignForm({
  onSubmit,
  initialData,
  isLoading = false,
  submitButtonText = "Create Design",
  onChange,
  chatbotName = "Support",
}: EmbedDesignFormProps) {
  const [activeTab, setActiveTab] = useState<"design" | "cta">("design");
  const [ctaConfig, setCtaConfig] = useState<CTAConfig | undefined>(
    initialData?.ctaConfig as CTAConfig
  );
  const [showCtaPreview, setShowCtaPreview] = useState(false);

  const methods = useForm<EmbedDesignFormData>({
    resolver: zodResolver(embedDesignSchema),
    defaultValues: initialData || {
      designType: "compact",
      primaryColor: "#2563eb",
      backgroundColor: "#ffffff",
      textColor: "#1f2937",
      inputPlaceholder: "Type your message...",
      showAvatar: true,
      showTimestamp: true,
      hideBranding: false,
      ctaConfig: undefined,
    },
  });

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    setValue,
    reset,
  } = methods;

  // Watch all form values and notify parent on change
  const allFormValues = useWatch({ control: methods.control });
  
  useEffect(() => {
    if (onChange && allFormValues) {
      onChange({ ...allFormValues, ctaConfig } as EmbedDesignFormData);
    }
  }, [allFormValues, onChange, ctaConfig]);

  const designType = watch("designType");

  const handleCtaConfigChange = (newConfig: CTAConfig) => {
    setCtaConfig(newConfig);
    setValue("ctaConfig", newConfig);
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-4xl">
        
        {/* Tab Navigation */}
        <div style={{
          display: "flex",
          gap: "8px",
          borderBottom: "1px solid #e5e7eb",
          marginBottom: "24px",
        }}>
          <button
            type="button"
            onClick={() => setActiveTab("design")}
            style={{
              padding: "12px 16px",
              fontSize: "14px",
              fontWeight: activeTab === "design" ? 600 : 500,
              border: "none",
              backgroundColor: "transparent",
              cursor: "pointer",
              borderBottom: activeTab === "design" ? "2px solid #2563eb" : "none",
              color: activeTab === "design" ? "#2563eb" : "#6b7280",
              transition: "all 0.2s",
            }}
          >
            Design Settings
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("cta")}
            style={{
              padding: "12px 16px",
              fontSize: "14px",
              fontWeight: activeTab === "cta" ? 600 : 500,
              border: "none",
              backgroundColor: "transparent",
              cursor: "pointer",
              borderBottom: activeTab === "cta" ? "2px solid #2563eb" : "none",
              color: activeTab === "cta" ? "#2563eb" : "#6b7280",
              transition: "all 0.2s",
            }}
          >
            CTA Setup (Optional)
          </button>
        </div>

        {/* Design Tab */}
        {activeTab === "design" && (
          <div className="space-y-6">
            {/* Basic Info */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Design Info</h3>

              <div>
                <Label htmlFor="name">Design Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g., Support Widget, Product Demo"
                  {...register("name")}
                  className={errors.name ? "border-red-500" : ""}
                />
                {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Brief description of this design..."
                  {...register("description")}
                  className="resize-none"
                  rows={2}
                />
              </div>
            </div>

            {/* Design Type */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Design Type</h3>

              <div>
                <Label htmlFor="designType">Choose Layout *</Label>
                <Select
                  value={designType}
                  onValueChange={(value) => setValue("designType", value as "minimal" | "compact" | "full")}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="minimal">
                      <div className="flex flex-col">
                        <span>Minimal</span>
                        <span className="text-xs text-gray-500">Just chat (no header/footer)</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="compact">
                      <div className="flex flex-col">
                        <span>Compact</span>
                        <span className="text-xs text-gray-500">Small header + chat</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="full">
                      <div className="flex flex-col">
                        <span>Full</span>
                        <span className="text-xs text-gray-500">Header + chat + footer</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Design preview */}
              <div className="p-3 bg-gray-100 rounded border border-gray-200 text-sm text-gray-600">
                {designType === "minimal" && "Best for: sidebars, widgets, minimal spaces"}
                {designType === "compact" && "Best for: support widgets, fixed containers"}
                {designType === "full" && "Best for: full-featured embeds, landing pages"}
              </div>
            </div>

            {/* Theme Colors */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Design Theme</h3>
              <EmbedThemeCustomizer />
            </div>

            {/* UI Text & Messages */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">UI Customization</h3>

              {(designType === "compact" || designType === "full") && (
                <div>
                  <Label htmlFor="headerText">Header Title</Label>
                  <Input
                    id="headerText"
                    placeholder="e.g., Chat with us"
                    {...register("headerText")}
                  />
                </div>
              )}

              <div>
                <Label htmlFor="welcomeMessage">Welcome Message</Label>
                <Textarea
                  id="welcomeMessage"
                  placeholder="Message shown when no messages exist..."
                  {...register("welcomeMessage")}
                  className="resize-none"
                  rows={2}
                />
              </div>

              <div>
                <Label htmlFor="inputPlaceholder">Input Placeholder</Label>
                <Input
                  id="inputPlaceholder"
                  placeholder="Type a placeholder message..."
                  {...register("inputPlaceholder")}
                />
              </div>

              {designType === "full" && (
                <div>
                  <Label htmlFor="footerText">Footer Text</Label>
                  <Textarea
                    id="footerText"
                    placeholder="Optional footer text..."
                    {...register("footerText")}
                    className="resize-none"
                    rows={2}
                  />
                </div>
              )}
            </div>

            {/* Features */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Features</h3>

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="showAvatar"
                    {...register("showAvatar")}
                    defaultChecked
                  />
                  <Label htmlFor="showAvatar" className="font-normal cursor-pointer">
                    Show avatars on messages
                  </Label>
                </div>

                <div className="flex items-center gap-2">
                  <Checkbox
                    id="showTimestamp"
                    {...register("showTimestamp")}
                    defaultChecked
                  />
                  <Label htmlFor="showTimestamp" className="font-normal cursor-pointer">
                    Show timestamps on messages
                  </Label>
                </div>

                <div className="flex items-center gap-2">
                  <Checkbox
                    id="hideBranding"
                    {...register("hideBranding")}
                  />
                  <Label htmlFor="hideBranding" className="font-normal cursor-pointer">
                    Hide "Powered by BotTailor" branding
                  </Label>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* CTA Tab */}
        {activeTab === "cta" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", minHeight: "500px" }}>
            {/* Builder */}
            <div style={{ overflowY: "auto", paddingRight: "12px" }}>
              <CTABuilder
                initialConfig={ctaConfig}
                chatbotName={chatbotName}
                onConfigChange={handleCtaConfigChange}
                onPreviewToggle={(show) => {
                  if (show) {
                    setShowCtaPreview(true);
                  }
                }}
              />
            </div>

            {/* Preview Panel */}
            <div style={{
              border: "1px solid #e5e7eb",
              borderRadius: "8px",
              backgroundColor: "#f9fafb",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}>
              <div style={{
                padding: "12px 16px",
                borderBottom: "1px solid #e5e7eb",
                backgroundColor: "white",
              }}>
                <h3 style={{ margin: 0, fontSize: "14px", fontWeight: 600 }}>Live Preview</h3>
              </div>
              <div style={{ flex: 1, overflow: "auto", padding: "12px" }}>
                {ctaConfig && ctaConfig.enabled ? (
                  <div style={{
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: "white",
                    borderRadius: "6px",
                    padding: "12px",
                  }}>
                    <p style={{ margin: "0 0 12px 0", fontSize: "13px", fontWeight: 600 }}>Preview Update</p>
                    <p style={{ margin: 0, fontSize: "12px", color: "#6b7280", textAlign: "center" }}>
                      Full preview available when you click "Preview CTA" button
                    </p>
                  </div>
                ) : (
                  <div style={{
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#999",
                    textAlign: "center",
                    fontSize: "13px",
                  }}>
                    Enable CTA to see preview
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <div className="flex gap-2 pt-4 border-t border-gray-200">
          <Button
            type="submit"
            disabled={isLoading}
            className="px-6"
          >
            {isLoading ? "Saving..." : submitButtonText}
          </Button>
        </div>
      </form>

      {/* CTA Preview Modal */}
      {ctaConfig && (
        <CTAPreview
          config={ctaConfig}
          isOpen={showCtaPreview}
          onClose={() => setShowCtaPreview(false)}
          chatbotName={chatbotName}
        />
      )}
    </FormProvider>
  );
}
