import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AboutViewProps {
  onClose: () => void;
  primaryColor?: string;
  backgroundColor?: string;
  textColor?: string;
}

export default function AboutView({ 
  onClose, 
  primaryColor = '#2563eb',
  backgroundColor = '#ffffff',
  textColor = '#1f2937'
}: AboutViewProps) {
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div 
        className="text-white p-4 flex items-center justify-between flex-shrink-0 border-b"
        style={{ 
          backgroundColor: primaryColor,
          borderColor: `${primaryColor}40`
        }}
      >
        <h2 className="font-semibold text-lg">About</h2>
        <button
          onClick={onClose}
          className="text-white p-1 rounded hover:opacity-80 transition-opacity"
          title="Close about view"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Content */}
      <div 
        className="flex-1 overflow-y-auto p-6 flex flex-col items-center justify-center text-center"
        style={{ backgroundColor, color: textColor }}
      >
        {/* BotTailor Logo/Branding */}
        <div className="mb-6">

          <h3 className="text-2xl font-bold mb-2" style={{ color: primaryColor }}>
            BotTailor
          </h3>
          <p className="text-sm font-medium" style={{ color: textColor }}>
            Smart Chat Widget Platform
          </p>
        </div>

        {/* Description */}
        <div className="max-w-sm mb-6">
          <p className="text-sm leading-relaxed mb-4" style={{ color: textColor }}>
            This chat widget is powered by <span className="font-semibold">BotTailor</span>, a modern platform for building and deploying intelligent chat widgets.
          </p>
          <p className="text-sm leading-relaxed mb-4" style={{ color: textColor }}>
            BotTailor enables businesses to provide exceptional customer support and engagement through customizable AI-powered chat interfaces.
          </p>
        </div>

        {/* Features */}
        <div className="max-w-sm mb-6">
          <h4 className="font-semibold mb-3" style={{ color: primaryColor }}>
            Features
          </h4>
          <ul className="text-sm space-y-2 text-left">
            <li className="flex items-start gap-2">
              <span style={{ color: primaryColor }}>✓</span>
              <span>AI-powered conversations</span>
            </li>
            <li className="flex items-start gap-2">
              <span style={{ color: primaryColor }}>✓</span>
              <span>Rich message support</span>
            </li>
            <li className="flex items-start gap-2">
              <span style={{ color: primaryColor }}>✓</span>
              <span>Fully customizable theme</span>
            </li>
            <li className="flex items-start gap-2">
              <span style={{ color: primaryColor }}>✓</span>
              <span>Easy integration</span>
            </li>
          </ul>
        </div>

        {/* CTA */}
        <div className="max-w-sm">
          <p className="text-xs mb-4" style={{ color: textColor, opacity: 0.7 }}>
            Want to add a chat widget to your website?
          </p>
          <button
            type="button"
            onClick={() => window.open('https://bottailor.com', '_blank')}
            style={{ 
              backgroundColor: primaryColor,
              color: 'white'
            }}
            className="w-full hover:opacity-90 transition-opacity"
          >
            Learn More on BotTailor
          </button>
        </div>

        {/* Footer */}
        <div className="mt-8 pt-6 border-t max-w-sm text-xs" style={{ 
          borderColor: `${textColor}20`,
          color: textColor,
          opacity: 0.6
        }}>
          <p>© 2024 BotTailor. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}
