import { HelpCircle, Minimize2, RefreshCw, X } from "lucide-react";
import { isLightColor } from "./useWidgetTheme";

interface WidgetHeaderProps {
  primaryColor: string;
  title: string;
  avatarUrl?: string;
  onAbout?: () => void;
  onRefresh?: () => void;
  onClose?: () => void;
  variant: 'mobile' | 'embedded' | 'floating';
}

export default function WidgetHeader({
  primaryColor,
  title,
  avatarUrl,
  onAbout,
  onRefresh,
  onClose,
  variant
}: WidgetHeaderProps) {
  const fg = isLightColor(primaryColor) ? '#1f2937' : '#ffffff';
  const CloseIcon = variant === 'mobile' ? X : Minimize2;

  return (
    <div 
      className="chat-header p-2 flex items-center justify-between flex-shrink-0"
      style={{ backgroundColor: primaryColor }}
    >
      <div className="flex items-center space-x-2">
        <img 
          src={avatarUrl || "https://images.unsplash.com/photo-1560250097-0b93528c311a?ixlib=rb-4.0.3&auto=format&fit=crop&w=256&h=256"} 
          alt={`${title} avatar`} 
          className="w-10 h-10 rounded-full border-2 border-white"
        />
        <div>
          <h3 className="font-medium text-sm" style={{ color: fg }}>{title}</h3>
        </div>
      </div>
      <div className="flex items-center space-x-3">
        {onAbout && (
          <button 
            type="button"
            onClick={onAbout}
            className="p-1.5 rounded transition-colors"
            style={{ color: fg }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = `${primaryColor}cc`}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            title="About BotTailor"
            data-testid="button-about"
          >
            <HelpCircle className="h-4 w-4" />
          </button>
        )}
        {onRefresh && (
          <button 
            type="button"
            onClick={onRefresh}
            className="p-1.5 rounded transition-colors"
            style={{ color: fg }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = `${primaryColor}cc`}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            title="Start new conversation"
            data-testid="button-refresh-session"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        )}
        {onClose && (
          <button 
            type="button"
            onClick={onClose}
            className="p-1.5 rounded transition-colors"
            style={{ color: fg }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = `${primaryColor}cc`}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            data-testid={variant === 'mobile' ? 'button-close-chat' : 'button-minimize-chat'}
          >
            <CloseIcon className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
