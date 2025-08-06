import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Upload, X, ExternalLink, Image as ImageIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface BackgroundImageUploadProps {
  value?: string;
  onValueChange: (url: string) => void;
  disabled?: boolean;
}

export function BackgroundImageUpload({ value, onValueChange, disabled }: BackgroundImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [urlInput, setUrlInput] = useState(value || "");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Sync urlInput with value prop changes (when form is updated externally)
  useEffect(() => {
    setUrlInput(value || "");
  }, [value]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file (JPG, PNG, GIF, WebP).",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image smaller than 10MB.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('background', file);

      const response = await fetch("/api/upload/background", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "Upload failed" }));
        throw new Error(errorData.message || "Upload failed");
      }

      const data = await response.json();
      onValueChange(data.url);
      setUrlInput(data.url);
      
      toast({
        title: "Background image uploaded",
        description: "Your background image has been uploaded successfully.",
      });
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: "Upload failed",
        description: "Failed to upload background image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleUrlChange = (url: string) => {
    setUrlInput(url);
    onValueChange(url);
  };

  const handleRemove = () => {
    setUrlInput("");
    onValueChange("");
  };

  return (
    <div className="space-y-4">
      <Tabs defaultValue="upload" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="upload">Upload Image</TabsTrigger>
          <TabsTrigger value="url">Image URL</TabsTrigger>
        </TabsList>
        
        <TabsContent value="upload" className="space-y-4">
          <div className="space-y-2">
            <Label>Upload Background Image</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={disabled || isUploading}
                className="flex-1"
              >
                <Upload className="h-4 w-4 mr-2" />
                {isUploading ? "Uploading..." : "Choose Image"}
              </Button>
              {value && (
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={handleRemove}
                  disabled={disabled || isUploading}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
              disabled={disabled || isUploading}
            />
          </div>
        </TabsContent>
        
        <TabsContent value="url" className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="background-url">Background Image URL</Label>
            <div className="flex gap-2">
              <Input
                id="background-url"
                type="url"
                placeholder="https://example.com/image.jpg"
                value={urlInput}
                onChange={(e) => handleUrlChange(e.target.value)}
                disabled={disabled}
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => urlInput && window.open(urlInput, '_blank')}
                disabled={!urlInput}
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
              {value && (
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={handleRemove}
                  disabled={disabled}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Preview */}
      {value && (
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            <div className="relative aspect-video bg-muted flex items-center justify-center">
              {value ? (
                <img
                  src={value}
                  alt="Background preview"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    const parent = e.currentTarget.parentElement;
                    if (parent) {
                      const fallback = parent.querySelector('.fallback-icon');
                      if (fallback) fallback.classList.remove('hidden');
                    }
                  }}
                />
              ) : null}
              <div className="fallback-icon hidden absolute inset-0 flex items-center justify-center text-muted-foreground">
                <ImageIcon className="h-12 w-12" />
              </div>
              <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                <div className="bg-white/90 px-3 py-2 rounded text-sm font-medium text-gray-700">
                  Background Preview
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}