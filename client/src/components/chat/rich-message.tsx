import { memo, useState } from "react";
import { Message } from "@shared/schema";
import { parseMarkdown } from "@/lib/markdown-utils";
import { CardMessage } from "./message-types/card-message";
import { RatingMessage } from "./message-types/rating-message";
import { FormMessage } from "./message-types/form-message";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, Check } from "lucide-react";
import {
  isCardMetadata,
  isMenuMetadata,
  isFormMetadata,
  MessageMetadata,
  CardMetadata,
  MenuMetadata,
  MultiselectMenuMetadata,
  RatingMetadata,
  FormMetadata,
  ImageMetadata,
  QuickRepliesMetadata,
} from "@/types/message-metadata";

interface RichMessageProps {
  message: Message;
  onOptionSelect: (
    optionId: string,
    payload?: any,
    optionText?: string,
  ) => void;
  onQuickReply: (reply: string) => void;
  chatbotConfig?: any;
  sessionId?: string;
  themeColors?: {
    primaryColor: string;
    backgroundColor: string;
    textColor: string;
    messageBubbleBg: string;
  };
}

// Helper to detect "Other" option
const isOtherOption = (option: any): boolean => {
  if (!option) return false;
  return option.id === "q_other" || option.id === "other";
};

const RichMessage = memo(function RichMessage({
  message,
  onOptionSelect,
  onQuickReply,
  chatbotConfig,
  sessionId,
  themeColors,
}: RichMessageProps) {
  const { messageType, content, metadata } = message;
  const typedMetadata = metadata as MessageMetadata;

  if (messageType === "card" && isCardMetadata(typedMetadata)) {
    return (
      <CardMessage
        content={content}
        metadata={typedMetadata as CardMetadata}
        onOptionSelect={onOptionSelect}
      />
    );
  }

  if (messageType === "menu" && isMenuMetadata(typedMetadata)) {
    const menuMeta = typedMetadata as MenuMetadata;
    const defaultColors = {
      primaryColor: "hsl(213, 93%, 54%)",
      backgroundColor: "hsl(0, 0%, 100%)",
      textColor: "hsl(20, 14.3%, 4.1%)",
      messageBubbleBg: "hsl(0, 0%, 95%)",
    };
    const colors = themeColors || defaultColors;

    // Normalize options defensively
    const rawOptions: any = (menuMeta && (menuMeta as any).options) || [];
    const options = Array.isArray(rawOptions)
      ? rawOptions
      : rawOptions && typeof rawOptions === "object"
        ? Object.values(rawOptions)
        : [];

    // Inline state for "Other" option - isolated to this render block
    const [selectedOtherId, setSelectedOtherId] = useState<string | null>(null);
    const [otherText, setOtherText] = useState("");

    return (
      <div className="space-y-2">
        {options.map((option: any, index: number) => {
          const label = option.text || option.label || option.id;
          const isOther = isOtherOption(option);
          const isThisOtherSelected = selectedOtherId === option.id;

          return (
            <div key={`menu-option-${option.id}-${index}`}>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (isOther) {
                    // Show input field for "Other" option
                    setSelectedOtherId(option.id);
                  } else {
                    // Normal option - fire immediately
                    onOptionSelect(option.id, option.payload, label);
                  }
                }}
                className="w-full text-left py-1 px-4 border rounded-lg transition-colors flex items-center space-x-2"
                style={{
                  backgroundColor: isThisOtherSelected
                    ? colors.primaryColor + "10"
                    : colors.messageBubbleBg,
                  color: colors.textColor,
                  borderColor: isThisOtherSelected
                    ? colors.primaryColor
                    : colors.textColor + "40",
                  fontSize: "0.9rem",
                }}
                onMouseEnter={(e) => {
                  if (!isThisOtherSelected) {
                    e.currentTarget.style.backgroundColor = colors.primaryColor;
                    e.currentTarget.style.color = "white";
                    e.currentTarget.style.borderColor = colors.primaryColor;
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isThisOtherSelected) {
                    e.currentTarget.style.backgroundColor =
                      colors.messageBubbleBg;
                    e.currentTarget.style.color = colors.textColor;
                    e.currentTarget.style.borderColor = colors.textColor + "40";
                  }
                }}
                disabled={isThisOtherSelected}
              >
                {option.icon && (
                  <i
                    className={`${option.icon}`}
                    style={{ color: "inherit" }}
                  ></i>
                )}
                <span>{label}</span>
              </button>

              {isOther && isThisOtherSelected && (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (otherText.trim()) {
                      onOptionSelect(
                        option.id,
                        { freeText: otherText.trim() },
                        otherText.trim(),
                      );
                    }
                  }}
                  className="mt-2 flex gap-2"
                >
                  <Input
                    value={otherText}
                    onChange={(e) => setOtherText(e.target.value)}
                    placeholder=""
                    className="flex-1"
                    autoFocus
                  />
                  <Button type="submit" size="sm" disabled={!otherText.trim()}>
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  if (messageType === "multiselect_menu" && isMenuMetadata(typedMetadata)) {
    const multiMeta = typedMetadata as MultiselectMenuMetadata;
    const defaultColors = {
      primaryColor: "hsl(213, 93%, 54%)",
      backgroundColor: "hsl(0, 0%, 100%)",
      textColor: "hsl(20, 14.3%, 4.1%)",
      messageBubbleBg: "hsl(0, 0%, 95%)",
    };
    const colors = themeColors || defaultColors;

    // Normalize options defensively
    const rawOptions: any = (multiMeta && (multiMeta as any).options) || [];
    const options = Array.isArray(rawOptions)
      ? rawOptions
      : rawOptions && typeof rawOptions === "object"
        ? Object.values(rawOptions)
        : [];

    const minSelections = multiMeta.minSelections || 1;
    const maxSelections = multiMeta.maxSelections || options.length || 999;

    // Inline state for multi-select - isolated to this render block
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [otherText, setOtherText] = useState("");

    const toggleSelection = (optionId: string) => {
      setSelectedIds((prev) => {
        if (prev.includes(optionId)) {
          return prev.filter((id) => id !== optionId);
        } else if (prev.length < maxSelections) {
          return [...prev, optionId];
        }
        return prev;
      });
    };

    const hasOtherSelected = selectedIds.some((id) => {
      const opt = options.find((o: any) => o.id === id);
      return isOtherOption(opt);
    });

    const canSubmit =
      selectedIds.length >= minSelections &&
      selectedIds.length <= maxSelections &&
      (!hasOtherSelected || otherText.trim());

    return (
      <div className="space-y-3">
        <div className="space-y-2">
          {options.map((option: any, index: number) => {
            const label = option.text || option.label || option.id;
            const isSelected = selectedIds.includes(option.id);
            const isOther = isOtherOption(option);

            return (
              <div key={`multiselect-option-${option.id}-${index}`}>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    toggleSelection(option.id);
                  }}
                  className="w-full text-left py-3 px-4 border rounded-lg transition-colors flex items-center space-x-3"
                  style={{
                    backgroundColor: isSelected
                      ? colors.primaryColor + "10"
                      : colors.messageBubbleBg,
                    color: isSelected ? colors.primaryColor : colors.textColor,
                    borderColor: isSelected
                      ? colors.primaryColor
                      : colors.textColor + "40",
                    fontSize: "0.9rem",
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.backgroundColor =
                        colors.primaryColor + "20";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.backgroundColor =
                        colors.messageBubbleBg;
                    }
                  }}
                >
                  <div
                    className="w-5 h-5 border-2 rounded flex items-center justify-center flex-shrink-0"
                    style={{
                      backgroundColor: isSelected
                        ? colors.primaryColor
                        : "transparent",
                      borderColor: isSelected
                        ? colors.primaryColor
                        : colors.textColor + "40",
                    }}
                  >
                    {isSelected && <Check className="w-3 h-3 text-white" />}
                  </div>
                  {option.icon && (
                    <i
                      className={`${option.icon}`}
                      style={{ color: "inherit" }}
                    ></i>
                  )}
                  <span>{label}</span>
                </button>

                {isOther && isSelected && (
                  <div className="mt-2 ml-8">
                    <Input
                      value={otherText}
                      onChange={(e) => setOtherText(e.target.value)}
                      placeholder="Please specify..."
                      className="w-full"
                      autoFocus
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div
          className="flex items-center justify-between pt-2 border-t"
          style={{ borderColor: colors.textColor + "20" }}
        >
          <span
            className="text-sm"
            style={{ color: colors.textColor, opacity: 0.7 }}
          >
            {selectedIds.length} / {maxSelections} selected
          </span>
          <Button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              if (canSubmit) {
                const selectedOptions = selectedIds.map((id) => {
                  const opt = options.find((o: any) => o.id === id);
                  if (isOtherOption(opt) && otherText.trim()) {
                    return { id, text: otherText.trim() };
                  }
                  return { id, text: opt?.text || opt?.label || id };
                });

                const payload = {
                  selected_options: selectedIds,
                  selected_options_with_text: selectedOptions,
                  selection_count: selectedIds.length,
                  other_text: hasOtherSelected ? otherText.trim() : undefined,
                };

                const displayText = selectedOptions
                  .map((o) => o.text)
                  .join(", ");
                onOptionSelect("multiselect_submit", payload, displayText);
              }
            }}
            disabled={!canSubmit}
            size="sm"
          >
            <Send className="h-4 w-4 mr-1" />
          </Button>
        </div>
      </div>
    );
  }

  if (messageType === "rating" && typedMetadata) {
    return (
      <RatingMessage
        metadata={typedMetadata as RatingMetadata}
        onOptionSelect={onOptionSelect}
      />
    );
  }

  if (messageType === "image" && (typedMetadata as ImageMetadata)?.imageUrl) {
    const imageMeta = typedMetadata as ImageMetadata;
    return (
      <div className="bg-white rounded-lg rounded-tl-none shadow-sm overflow-hidden border dark:bg-slate-800 dark:border-slate-700">
        <img
          src={imageMeta.imageUrl}
          alt={imageMeta.title || "Message image"}
          className="w-full max-h-64 object-cover"
        />
        {content && (
          <div className="p-2">
            <p className="text-foreground">{content}</p>
          </div>
        )}
      </div>
    );
  }

  if (
    messageType === "quickReplies" &&
    (typedMetadata as QuickRepliesMetadata)?.quickReplies
  ) {
    const quickMeta = typedMetadata as QuickRepliesMetadata;
    const defaultColors = {
      primaryColor: "hsl(213, 93%, 54%)",
      backgroundColor: "hsl(0, 0%, 100%)",
      textColor: "hsl(20, 14.3%, 4.1%)",
      messageBubbleBg: "hsl(0, 0%, 95%)",
    };
    const colors = themeColors || defaultColors;
    return (
      <div className="flex flex-wrap gap-2">
        {quickMeta.quickReplies.map((replyOption, index: number) => {
          const label =
            typeof replyOption === "string" ? replyOption : replyOption.text;
          const value =
            typeof replyOption === "string"
              ? replyOption
              : replyOption.action || replyOption.text;
          const isSkipOption = label.toLowerCase().includes("skip");
          return (
            <button
              type="button"
              key={`quickreply-${label}-${index}`}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onQuickReply(value);
              }}
              className="px-3 py-1 text-sm rounded-full transition-colors"
              style={{
                backgroundColor: colors.messageBubbleBg,
                color: colors.textColor,
                border: `1px solid ${colors.textColor}40`,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = colors.primaryColor;
                e.currentTarget.style.color = "white";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = colors.messageBubbleBg;
                e.currentTarget.style.color = colors.textColor;
              }}
            >
              {label}
            </button>
          );
        })}
      </div>
    );
  }

  if (messageType === "form" && isFormMetadata(typedMetadata)) {
    return (
      <FormMessage
        content={content}
        metadata={typedMetadata as FormMetadata}
        sessionId={sessionId || message.sessionId}
        messageId={message.id}
        chatbotConfig={chatbotConfig}
      />
    );
  }

  // Fallback to regular message
  return (
    <div
      className={`chat-message-bot ${message.messageType === "menu" || message.messageType === "multiselect_menu" || message.messageType === "rating" || message.messageType === "quickReplies" || message.messageType === "form" || message.messageType === "table" ? "no-background" : ""}`}
    >
      <p className="text-neutral-800">{content}</p>
    </div>
  );
});

export default RichMessage;
