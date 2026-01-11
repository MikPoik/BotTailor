import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmbedChatInterface } from "./EmbedChatInterface";
import { Button } from "@/components/ui/button";
import { Copy } from "lucide-react";

interface EmbedDesignPreviewProps {
  config: {
    embedId?: string;
    designType: "minimal" | "compact" | "full";
    theme: {
      primaryColor: string;
      backgroundColor: string;
      textColor: string;
    };
    ui: {
      headerText?: string;
      footerText?: string;
      inputPlaceholder: string;
      welcomeMessage?: string;
      showAvatar?: boolean;
      showTimestamp?: boolean;
      hideBranding?: boolean;
    };
    components: Array<{
      name: string;
      visible: boolean;
    }>;
    chatbotConfigId?: number;
  };
  embedId?: string;
  isOpen: boolean;
  onClose: () => void;
}

const PREVIEW_SIZES = {
  mobile: { width: 375, height: 667, label: "Mobile (iPhone)" },
  tablet: { width: 768, height: 1024, label: "Tablet" },
  desktop: { width: 1024, height: 600, label: "Desktop" },
  widget: { width: 400, height: 500, label: "Widget (Small)" },
};

export function EmbedDesignPreview({
  config,
  embedId,
  isOpen,
  onClose,
}: EmbedDesignPreviewProps) {
  const [selectedSize, setSelectedSize] = useState<keyof typeof PREVIEW_SIZES>("widget");
  const [copied, setCopied] = useState(false);

  const size = PREVIEW_SIZES[selectedSize];

  const embedCode = `<iframe
  src="${typeof window !== "undefined" ? window.location.origin : ""}/embed/${embedId || "{EMBED_ID}"}"
  width="${size.width}"
  height="${size.height}"
  frameborder="0"
  style="border: none; border-radius: 8px;"
></iframe>`;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(embedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>Preview Embed Design</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="preview" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="preview">Preview</TabsTrigger>
            <TabsTrigger value="code">Embed Code</TabsTrigger>
          </TabsList>

          {/* Preview Tab */}
          <TabsContent value="preview" className="space-y-4">
            <div className="space-y-3">
              <label className="text-sm font-medium">Size</label>
              <div className="flex gap-2 flex-wrap">
                {(Object.keys(PREVIEW_SIZES) as Array<keyof typeof PREVIEW_SIZES>).map((key) => (
                  <Button
                    key={key}
                    variant={selectedSize === key ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedSize(key)}
                  >
                    {PREVIEW_SIZES[key].label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Preview Container */}
            <div className="bg-gray-100 p-4 rounded border border-gray-300 flex justify-center min-h-96">
              <div
                style={{
                  width: `${size.width}px`,
                  height: `${size.height}px`,
                  border: "1px solid #d1d5db",
                  borderRadius: "8px",
                  overflow: "hidden",
                  backgroundColor: config.theme.backgroundColor,
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <EmbedChatInterface
                  config={config}
                  apiUrl={typeof window !== "undefined" ? window.location.origin : ""}
                />
              </div>
            </div>

            <p className="text-xs text-gray-500 text-center">
              This preview shows how the embed will appear in an iframe on your website.
            </p>
          </TabsContent>

          {/* Code Tab */}
          <TabsContent value="code" className="space-y-4">
            <div>
              <label className="text-sm font-medium block mb-2">HTML Embed Code</label>
              <div className="relative">
                <pre className="bg-gray-900 text-gray-100 p-4 rounded overflow-x-auto text-sm">
                  <code>{embedCode}</code>
                </pre>
                <Button
                  size="sm"
                  variant="outline"
                  className="absolute top-2 right-2"
                  onClick={handleCopyCode}
                >
                  <Copy className="w-4 h-4 mr-2" />
                  {copied ? "Copied!" : "Copy"}
                </Button>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded p-3 text-sm text-blue-900">
              <p className="font-semibold mb-1">How to use:</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>Copy the embed code above</li>
                <li>Paste it into your website's HTML where you want the chat to appear</li>
                <li>Customize the width and height as needed</li>
                <li>The chat will use your configured theme and design</li>
              </ol>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
