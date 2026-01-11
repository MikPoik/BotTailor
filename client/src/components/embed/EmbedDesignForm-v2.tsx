import React, { useState, useCallback, useRef, useEffect } from "react";
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
import { CTAAssistant } from "./CTAAssistant";
import { CTAConfig } from "@shared/schema";
import { VisualCTAEditor } from "./cta-builder";

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
  const [ctaSubTab, setCtaSubTab] = useState<"visual" | "ai" | "json">("visual");
  const [ctaConfig, setCtaConfig] = useState<CTAConfig | undefined>(initialData?.ctaConfig as CTAConfig | undefined);
  const [showCtaPreview, setShowCtaPreview] = useState(false);

  const methods = useForm<EmbedDesignFormData>({
    resolver: zodResolver(embedDesignSchema),
    defaultValues: {
      designType: initialData?.designType || "compact",
      primaryColor: initialData?.primaryColor || "#2563eb",
      backgroundColor: initialData?.backgroundColor || "#ffffff",
      textColor: initialData?.textColor || "#1f2937",
      inputPlaceholder: initialData?.inputPlaceholder || "Type your message...",
      showAvatar: initialData?.showAvatar ?? true,
      showTimestamp: initialData?.showTimestamp ?? false,
      hideBranding: initialData?.hideBranding ?? false,
      name: initialData?.name || "",
      description: initialData?.description || "",
      headerText: initialData?.headerText || "",
      footerText: initialData?.footerText || "",
      welcomeMessage: initialData?.welcomeMessage || "",
      ctaConfig: initialData?.ctaConfig || undefined,
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
  const previousValuesRef = useRef<EmbedDesignFormData | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  useEffect(() => {
    // Clear previous timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Debounce form changes to avoid infinite loops
    timeoutRef.current = setTimeout(() => {
      const newValues = { ...allFormValues, ctaConfig } as EmbedDesignFormData;
      // Only call onChange if values actually changed
      if (onChange && JSON.stringify(previousValuesRef.current) !== JSON.stringify(newValues)) {
        previousValuesRef.current = newValues;
        onChange(newValues);
      }
    }, 300);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [allFormValues, ctaConfig, onChange]);

  const designType = watch("designType");

  const handleCtaConfigChange = (newConfig: CTAConfig) => {
    setCtaConfig(newConfig);
    setValue("ctaConfig", newConfig, { shouldDirty: true, shouldTouch: true });
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
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            {/* Enable CTA and Settings */}
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={ctaConfig?.enabled || false}
                    onChange={(e) => {
                      const newConfig = { ...ctaConfig, enabled: e.target.checked } as CTAConfig;
                      handleCtaConfigChange(newConfig);
                    }}
                    style={{ width: "18px", height: "18px", cursor: "pointer" }}
                  />
                  <span style={{ fontSize: "15px", fontWeight: 500 }}>Enable CTA View</span>
                </label>

                {ctaConfig?.enabled && (
                  <button
                    type="button"
                    onClick={() => setShowCtaPreview(true)}
                    style={{
                      padding: "6px 16px",
                      fontSize: "13px",
                      fontWeight: 500,
                      backgroundColor: "#2563eb",
                      color: "#fff",
                      border: "none",
                      borderRadius: "6px",
                      cursor: "pointer",
                      transition: "background-color 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = "#1d4ed8";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "#2563eb";
                    }}
                  >
                    👁️ Preview CTA
                  </button>
                )}
              </div>

              {ctaConfig?.enabled && (
                <div style={{ marginLeft: "26px", display: "flex", flexDirection: "column", gap: "12px" }}>
                  <h4 style={{ margin: 0, fontSize: "14px", fontWeight: 600 }}>Settings</h4>
                  <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={ctaConfig?.settings?.dismissible ?? true}
                      onChange={(e) => {
                        const newConfig = {
                          ...ctaConfig,
                          settings: { ...ctaConfig?.settings, dismissible: e.target.checked }
                        } as CTAConfig;
                        handleCtaConfigChange(newConfig);
                      }}
                      style={{ width: "16px", height: "16px", cursor: "pointer" }}
                    />
                    <span style={{ fontSize: "14px" }}>Allow users to dismiss CTA</span>
                  </label>
                  <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={ctaConfig?.settings?.showOncePerSession ?? false}
                      onChange={(e) => {
                        const newConfig = {
                          ...ctaConfig,
                          settings: { ...ctaConfig?.settings, showOncePerSession: e.target.checked }
                        } as CTAConfig;
                        handleCtaConfigChange(newConfig);
                      }}
                      style={{ width: "16px", height: "16px", cursor: "pointer" }}
                    />
                    <span style={{ fontSize: "14px" }}>Show only once per session</span>
                  </label>
                </div>
              )}
            </div>

            {/* CTA Sub-tabs */}
            {ctaConfig?.enabled && (
              <>
                <div style={{
                  display: "flex",
                  gap: "8px",
                  borderBottom: "1px solid #e5e7eb",
                  marginTop: "8px",
                }}>
                  <button
                    type="button"
                    onClick={() => setCtaSubTab("visual")}
                    style={{
                      padding: "10px 16px",
                      fontSize: "13px",
                      fontWeight: ctaSubTab === "visual" ? 600 : 500,
                      border: "none",
                      backgroundColor: "transparent",
                      cursor: "pointer",
                      borderBottom: ctaSubTab === "visual" ? "2px solid #2563eb" : "none",
                      color: ctaSubTab === "visual" ? "#2563eb" : "#6b7280",
                      transition: "all 0.2s",
                    }}
                  >
                    🎨 Component Layout
                  </button>
                  <button
                    type="button"
                    onClick={() => setCtaSubTab("ai")}
                    style={{
                      padding: "10px 16px",
                      fontSize: "13px",
                      fontWeight: ctaSubTab === "ai" ? 600 : 500,
                      border: "none",
                      backgroundColor: "transparent",
                      cursor: "pointer",
                      borderBottom: ctaSubTab === "ai" ? "2px solid #2563eb" : "none",
                      color: ctaSubTab === "ai" ? "#2563eb" : "#6b7280",
                      transition: "all 0.2s",
                    }}
                  >
                    ✨ AI Generator
                  </button>
                  <button
                    type="button"
                    onClick={() => setCtaSubTab("json")}
                    style={{
                      padding: "10px 16px",
                      fontSize: "13px",
                      fontWeight: ctaSubTab === "json" ? 600 : 500,
                      border: "none",
                      backgroundColor: "transparent",
                      cursor: "pointer",
                      borderBottom: ctaSubTab === "json" ? "2px solid #2563eb" : "none",
                      color: ctaSubTab === "json" ? "#2563eb" : "#6b7280",
                      transition: "all 0.2s",
                    }}
                  >
                    📝 JSON Editor
                  </button>
                </div>

                {/* Visual Editor Sub-tab */}
                {ctaSubTab === "visual" && (
                  <div>
                    <VisualCTAEditor
                      config={ctaConfig}
                      onChange={handleCtaConfigChange}
                    />
                  </div>
                )}

                {/* AI Assistant Sub-tab */}
                {ctaSubTab === "ai" && (
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <CTAAssistant
                      chatbotName={chatbotName}
                      currentConfig={ctaConfig}
                      theme={{
                        primaryColor: watch("primaryColor"),
                        backgroundColor: watch("backgroundColor"),
                        textColor: watch("textColor"),
                      }}
                      onConfigGenerated={(generatedConfig) => {
                        handleCtaConfigChange(generatedConfig);
                        setCtaSubTab("visual"); // Switch to visual editor after generation
                      }}
                    />
                  </div>
                )}

                {/* JSON Editor Sub-tab */}
                {ctaSubTab === "json" && (
                  <div>
                    <CTABuilder
                      initialConfig={ctaConfig}
                      chatbotName={chatbotName}
                      themeColors={{
                        primaryColor: watch("primaryColor"),
                        backgroundColor: watch("backgroundColor"),
                        textColor: watch("textColor"),
                      }}
                      onConfigChange={handleCtaConfigChange}
                      onPreviewToggle={(show) => {
                        if (show) {
                          setShowCtaPreview(true);
                        }
                      }}
                    />
                  </div>
                )}
              </>
            )}
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
