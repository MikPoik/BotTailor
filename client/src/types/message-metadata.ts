// Typed interfaces for message metadata to replace 'as any' casting

export interface StreamingMetadata {
  isStreaming?: boolean;
  streamingComplete?: boolean;
  chunks?: MessageChunk[];
}

export interface MessageChunk {
  content: string;
  messageType: string;
  metadata?: any;
  delay?: number;
}

export interface FollowUpMetadata {
  isFollowUp?: boolean;
}

export interface CardMetadata {
  title?: string;
  description?: string;
  imageUrl?: string;
  buttons?: Array<{
    id: string;
    text: string;
    action?: string;
    payload?: any;
  }>;
}

export interface MenuMetadata {
  options: Array<{
    id: string;
    text: string;
    icon?: string;
    action?: string;
    payload?: any;
  }>;
}

export interface MultiselectMenuMetadata extends MenuMetadata {
  minSelections?: number;
  maxSelections?: number;
  selectedOptions?: string[];
}

export interface RatingMetadata {
  minValue?: number;
  maxValue?: number;
  ratingType?: 'stars' | 'numbers' | 'scale';
}

export interface QuickRepliesMetadata {
  quickReplies: (string | {text: string, action?: string})[];
}

export interface FormMetadata {
  title?: string;
  formFields: Array<{
    id: string;
    label: string;
    type: 'text' | 'email' | 'textarea';
    placeholder?: string;
    required?: boolean;
    value?: string;
  }>;
  submitButton?: {
    id: string;
    text: string;
    action?: string;
    payload?: any;
  };
}

export interface ImageMetadata {
  imageUrl: string;
  title?: string;
}

// Union type for all metadata variants
export type MessageMetadata = StreamingMetadata & 
  FollowUpMetadata & 
  Partial<CardMetadata> & 
  Partial<MenuMetadata> & 
  Partial<MultiselectMenuMetadata> & 
  Partial<RatingMetadata> & 
  Partial<QuickRepliesMetadata> & 
  Partial<FormMetadata> & 
  Partial<ImageMetadata>;

// Type guards for runtime checking
export const isStreamingMetadata = (metadata: any): metadata is StreamingMetadata => {
  return metadata && (metadata.isStreaming || metadata.streamingComplete || metadata.chunks);
};

export const isCardMetadata = (metadata: any): metadata is CardMetadata => {
  return metadata && (metadata.title || metadata.description || metadata.imageUrl || metadata.buttons);
};

export const isMenuMetadata = (metadata: any): metadata is MenuMetadata => {
  // Accept both arrays and object-like option collections
  if (!metadata) return false;
  const opts = (metadata as any).options;
  return Array.isArray(opts) || (opts && typeof opts === 'object' && Object.keys(opts).length > 0);
};

export const isFormMetadata = (metadata: any): metadata is FormMetadata => {
  return metadata && Array.isArray(metadata.formFields);
};
