import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";

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
});

export type EmbedDesignFormData = z.infer<typeof embedDesignSchema>;

interface EmbedDesignFormProps {
  onSubmit: (data: EmbedDesignFormData) => Promise<void>;
  initialData?: Partial<EmbedDesignFormData>;
  isLoading?: boolean;
  submitButtonText?: string;
}

export function EmbedDesignForm({
  onSubmit,
  initialData,
  isLoading = false,
  submitButtonText = "Create Design",
}: EmbedDesignFormProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    setValue,
    reset,
  } = useForm<EmbedDesignFormData>({
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
    },
  });

  // Update form when initialData changes (e.g., when loading existing design)
  useEffect(() => {
    if (initialData) {
      reset(initialData);
    }
  }, [initialData, reset]);

  const designType = watch("designType");
  const primaryColor = watch("primaryColor");

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-2xl">
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
        <h3 className="text-lg font-semibold">Theme Colors</h3>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <Label htmlFor="primaryColor">Primary Color *</Label>
            <div className="flex gap-2 items-center">
              <input
                id="primaryColor"
                type="color"
                {...register("primaryColor")}
                className="h-10 w-20 rounded border cursor-pointer"
              />
              <Input
                type="text"
                {...register("primaryColor")}
                className="flex-1"
                placeholder="#2563eb"
              />
            </div>
            {errors.primaryColor && <p className="text-sm text-red-500">{errors.primaryColor.message}</p>}
          </div>

          <div>
            <Label htmlFor="backgroundColor">Background Color *</Label>
            <div className="flex gap-2 items-center">
              <input
                id="backgroundColor"
                type="color"
                {...register("backgroundColor")}
                className="h-10 w-20 rounded border cursor-pointer"
              />
              <Input
                type="text"
                {...register("backgroundColor")}
                className="flex-1"
                placeholder="#ffffff"
              />
            </div>
            {errors.backgroundColor && <p className="text-sm text-red-500">{errors.backgroundColor.message}</p>}
          </div>

          <div>
            <Label htmlFor="textColor">Text Color *</Label>
            <div className="flex gap-2 items-center">
              <input
                id="textColor"
                type="color"
                {...register("textColor")}
                className="h-10 w-20 rounded border cursor-pointer"
              />
              <Input
                type="text"
                {...register("textColor")}
                className="flex-1"
                placeholder="#1f2937"
              />
            </div>
            {errors.textColor && <p className="text-sm text-red-500">{errors.textColor.message}</p>}
          </div>
        </div>
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

      {/* Submit Button */}
      <div className="flex gap-2 pt-4">
        <Button
          type="submit"
          disabled={isLoading}
          className="px-6"
        >
          {isLoading ? "Saving..." : submitButtonText}
        </Button>
      </div>
    </form>
  );
}
