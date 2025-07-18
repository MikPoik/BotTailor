import { Message } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption } from "@/components/ui/table";

// Function to parse Markdown to HTML
function parseMarkdown(text: string): string {
  let html = text;

  // Bold text
  html = html.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');

  // Italic text
  html = html.replace(/\*(.*?)\*/g, '<i>$1</i>');

  // Links
  html = html.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2">$1</a>');

  // Line breaks
  html = html.replace(/\n/g, '<br />');

  return html;
}

interface RichMessageProps {
  message: Message;
  onOptionSelect: (optionId: string, payload?: any, optionText?: string) => void;
  onQuickReply: (reply: string) => void;
  chatbotConfig?: any;
}

export default function RichMessage({ message, onOptionSelect, onQuickReply, chatbotConfig }: RichMessageProps) {
  const { messageType, content, metadata } = message;

  if (messageType === 'card' && metadata) {
    return (
      <div className="bg-white rounded-lg rounded-tl-none shadow-sm overflow-hidden border">
        {metadata.imageUrl && (
          <img 
            src={metadata.imageUrl} 
            alt={metadata.title || "Card image"} 
            className="w-full h-32 object-cover"
          />
        )}

        <div className="p-3">
          {metadata.title && (
            <h4 className="font-semibold text-neutral-800 mb-2">{metadata.title}</h4>
          )}

          {metadata.description && (
            <p className="text-sm text-neutral-600 mb-3">{metadata.description}</p>
          )}

          {content && content !== metadata.title && (
            <p className="text-neutral-800 mb-3">{content}</p>
          )}

          {metadata.buttons && (
            <div className="space-y-2">
              {metadata.buttons.map((button, index) => (
                <Button
                  key={`${button.id}-${index}`}
                  variant="outline"
                  size="sm"
                  onClick={() => onOptionSelect(button.id, button.payload, button.text)}
                  className="w-full justify-start text-left"
                >
                  {button.text}
                </Button>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (messageType === 'menu' && metadata?.options) {
    return (
      <div className="space-y-2">
        <div className="space-y-2">
          {metadata.options.map((option, index) => (
            <button
              key={`${option.id}-${index}`}
              onClick={() => onOptionSelect(option.id, option.payload, option.text)}
              className="w-full text-left p-3 border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors flex items-center space-x-2"
            >
              {option.icon && (
                <i className={`${option.icon} text-primary`}></i>
              )}
              <span>{option.text}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (messageType === 'image' && metadata?.imageUrl) {
    return (
      <div className="bg-white rounded-lg rounded-tl-none shadow-sm overflow-hidden border">
        <img 
          src={metadata.imageUrl} 
          alt={metadata.title || "Message image"} 
          className="w-full max-h-64 object-cover"
        />
        {content && (
          <div className="p-3">
            <p className="text-neutral-800">{content}</p>
          </div>
        )}
      </div>
    );
  }

  if (messageType === 'quickReplies' && metadata?.quickReplies) {
    return (
      <div className="flex flex-wrap gap-2">
        {metadata.quickReplies.map((reply: string, index: number) => (
          <button
            key={index}
            onClick={() => onQuickReply(reply)}
            className="px-3 py-1 text-sm bg-neutral-100 text-neutral-700 rounded-full hover:bg-neutral-200 transition-colors"
          >
            {reply}
          </button>
        ))}
      </div>
    );
  }

  if (messageType === 'table' && metadata?.table) {
    return (
      <div className="bg-white rounded-lg rounded-tl-none shadow-sm border overflow-hidden">
        <div className="p-4">
          {metadata.title && (
            <h4 className="font-semibold text-neutral-800 mb-3">{metadata.title}</h4>
          )}

          {content && (
            <p 
              className="text-neutral-600 mb-4" 
              dangerouslySetInnerHTML={{ __html: parseMarkdown(content) }}
            />
          )}

          <div className="overflow-x-auto">
            <Table>
              {metadata.table.caption && (
                <TableCaption>{metadata.table.caption}</TableCaption>
              )}
              <TableHeader>
                <TableRow>
                  {metadata.table.headers.map((header, index) => (
                    <TableHead key={index} className="font-semibold">
                      {header}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {metadata.table.rows.map((row, rowIndex) => (
                  <TableRow key={rowIndex}>
                    {row.map((cell, cellIndex) => (
                      <TableCell key={cellIndex} className="text-neutral-800">
                        {cell}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    );
  }

  if (messageType === 'form' && metadata?.formFields) {
    return (
      <div className="bg-white rounded-lg rounded-tl-none shadow-sm border overflow-hidden">
        <div className="p-4">
          {metadata.title && (
            <h4 className="font-semibold text-neutral-800 mb-3">{metadata.title}</h4>
          )}

          {content && (
            <p 
              className="text-neutral-600 mb-4" 
              dangerouslySetInnerHTML={{ __html: parseMarkdown(content) }}
            />
          )}

          <form className="space-y-4">
            {metadata.formFields.map((field, index) => (
              <div key={`${field.id}-${index}`} className="space-y-2">
                <label 
                  htmlFor={field.id} 
                  className="block text-sm font-medium text-neutral-700"
                >
                  {field.label}
                  {field.required && <span className="text-red-500 ml-1">*</span>}
                </label>

                {field.type === 'textarea' ? (
                  <textarea
                    id={field.id}
                    name={field.id}
                    placeholder={field.placeholder}
                    required={field.required}
                    rows={3}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  />
                ) : (
                  <input
                    id={field.id}
                    name={field.id}
                    type={field.type}
                    placeholder={field.placeholder}
                    required={field.required}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                )}
              </div>
            ))}

            {metadata.submitButton && (
              <Button
                type="submit"
                className="w-full mt-4"
                onClick={(e) => {
                  e.preventDefault();
                  // TODO: Implement form submission logic
                  console.log('Form submitted - logic to be implemented');
                }}
              >
                {metadata.submitButton.text}
              </Button>
            )}
          </form>
        </div>
      </div>
    );
  }

  // Fallback to regular message
  return (
    <div className={`chat-message-bot ${(message.messageType === 'menu' || message.messageType === 'quickReplies' || message.messageType === 'form' || message.messageType === 'table') ? 'no-background' : ''}`}>
      <p className="text-neutral-800">{content}</p>
    </div>
  );
}