import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useFormContext } from "react-hook-form";
import { Palette, Copy, Check } from "lucide-react";

// Predefined color presets
const COLOR_PRESETS = [
  {
    name: "Blue Professional",
    primary: "#2563eb",
    background: "#ffffff",
    text: "#1f2937",
  },
  {
    name: "Dark Modern",
    primary: "#3b82f6",
    background: "#1f2937",
    text: "#f3f4f6",
  },
  {
    name: "Green Tech",
    primary: "#10b981",
    background: "#f0fdf4",
    text: "#065f46",
  },
  {
    name: "Purple Elegant",
    primary: "#a855f7",
    background: "#faf5ff",
    text: "#4c1d95",
  },
  {
    name: "Red Energetic",
    primary: "#ef4444",
    background: "#fef2f2",
    text: "#7f1d1d",
  },
  {
    name: "Orange Warm",
    primary: "#f97316",
    background: "#fffbeb",
    text: "#7c2d12",
  },
];

interface EmbedThemeCustomizerProps {
  onPresetSelect?: (preset: typeof COLOR_PRESETS[0]) => void;
}

export function EmbedThemeCustomizer({ onPresetSelect }: EmbedThemeCustomizerProps) {
  const { watch, setValue } = useFormContext();
  const primaryColor = watch("primaryColor");
  const backgroundColor = watch("backgroundColor");
  const textColor = watch("textColor");
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handlePresetSelect = (preset: typeof COLOR_PRESETS[0]) => {
    setValue("primaryColor", preset.primary);
    setValue("backgroundColor", preset.background);
    setValue("textColor", preset.text);
    onPresetSelect?.(preset);
  };

  const copyToClipboard = (value: string, field: string) => {
    navigator.clipboard.writeText(value);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Color Presets */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Palette className="w-4 h-4" />
          <Label className="text-base font-semibold">Color Presets</Label>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {COLOR_PRESETS.map((preset) => (
            <button
              key={preset.name}
              type="button"
              onClick={() => handlePresetSelect(preset)}
              className="p-3 rounded-lg border-2 transition-all hover:border-blue-500"
              style={{ borderColor: preset.primary }}
            >
              <div className="flex gap-2 mb-2">
                <div
                  className="w-6 h-6 rounded"
                  style={{ backgroundColor: preset.primary }}
                  title="Primary"
                />
                <div
                  className="w-6 h-6 rounded border"
                  style={{ backgroundColor: preset.background }}
                  title="Background"
                />
              </div>
              <p className="text-xs font-medium">{preset.name}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Custom Color Customization */}
      <div className="space-y-4 pt-4 border-t">
        <Label className="text-base font-semibold">Custom Colors</Label>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Primary Color */}
          <div className="space-y-2">
            <Label htmlFor="primaryColor" className="text-sm">
              Primary Color (Buttons, Links)
            </Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  id="primaryColor"
                  type="color"
                  defaultValue={primaryColor}
                  onChange={(e) => setValue("primaryColor", e.target.value)}
                  className="w-full h-10 rounded border cursor-pointer"
                />
              </div>
              <div
                className="w-10 h-10 rounded border flex items-center justify-center cursor-pointer hover:bg-gray-100"
                style={{ backgroundColor: primaryColor }}
                onClick={() => copyToClipboard(primaryColor, "primary")}
                title="Copy color code"
              >
                {copiedField === "primary" ? (
                  <Check className="w-4 h-4 text-green-600" />
                ) : (
                  <Copy className="w-4 h-4 text-gray-500" />
                )}
              </div>
            </div>
            <Input
              type="text"
              placeholder="#2563eb"
              defaultValue={primaryColor}
              onChange={(e) => setValue("primaryColor", e.target.value)}
              className="text-xs font-mono"
            />
          </div>

          {/* Background Color */}
          <div className="space-y-2">
            <Label htmlFor="backgroundColor" className="text-sm">
              Background Color
            </Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  id="backgroundColor"
                  type="color"
                  defaultValue={backgroundColor}
                  onChange={(e) => setValue("backgroundColor", e.target.value)}
                  className="w-full h-10 rounded border cursor-pointer"
                />
              </div>
              <div
                className="w-10 h-10 rounded border flex items-center justify-center cursor-pointer hover:bg-gray-100"
                style={{ backgroundColor }}
                onClick={() => copyToClipboard(backgroundColor, "background")}
                title="Copy color code"
              >
                {copiedField === "background" ? (
                  <Check className="w-4 h-4 text-green-600" />
                ) : (
                  <Copy className="w-4 h-4 text-gray-500" />
                )}
              </div>
            </div>
            <Input
              type="text"
              placeholder="#ffffff"
              defaultValue={backgroundColor}
              onChange={(e) => setValue("backgroundColor", e.target.value)}
              className="text-xs font-mono"
            />
          </div>

          {/* Text Color */}
          <div className="space-y-2">
            <Label htmlFor="textColor" className="text-sm">
              Text Color
            </Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  id="textColor"
                  type="color"
                  defaultValue={textColor}
                  onChange={(e) => setValue("textColor", e.target.value)}
                  className="w-full h-10 rounded border cursor-pointer"
                />
              </div>
              <div
                className="w-10 h-10 rounded border flex items-center justify-center cursor-pointer hover:bg-gray-100"
                style={{ backgroundColor: textColor }}
                onClick={() => copyToClipboard(textColor, "text")}
                title="Copy color code"
              >
                {copiedField === "text" ? (
                  <Check className="w-4 h-4 text-white" />
                ) : (
                  <Copy className="w-4 h-4 text-gray-500" />
                )}
              </div>
            </div>
            <Input
              type="text"
              placeholder="#1f2937"
              defaultValue={textColor}
              onChange={(e) => setValue("textColor", e.target.value)}
              className="text-xs font-mono"
            />
          </div>
        </div>
      </div>

      {/* Live Preview */}
      <div className="space-y-3 pt-4 border-t">
        <Label className="text-base font-semibold">Live Preview</Label>
        <div
          className="rounded-lg p-4 space-y-3"
          style={{
            backgroundColor,
            color: textColor,
          }}
        >
          <p className="text-sm font-medium">Preview Text</p>
          <button
            type="button"
            className="px-3 py-2 text-sm rounded font-medium text-white transition-all hover:opacity-90"
            style={{ backgroundColor: primaryColor }}
          >
            Send Button
          </button>
          <div
            className="text-xs p-2 rounded"
            style={{
              backgroundColor: primaryColor,
              color: "white",
            }}
          >
            Sample message with primary color
          </div>
        </div>
      </div>
    </div>
  );
}
