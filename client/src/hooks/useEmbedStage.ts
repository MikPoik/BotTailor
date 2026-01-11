import { useState, useEffect, useCallback } from 'react';
import { CTAConfig } from '@shared/schema';

export type EmbedStage = 'cta' | 'chat';

interface UseEmbedStageOptions {
  embedId: string;
  ctaConfig?: CTAConfig;
}

interface UseEmbedStageReturn {
  stage: EmbedStage;
  transitionToChat: (predefinedMessage?: string) => void;
  pendingMessage: string | null;
  clearPendingMessage: () => void;
}

const getSessionStorageKey = (embedId: string) => `cta_dismissed_${embedId}`;

export function useEmbedStage({ embedId, ctaConfig }: UseEmbedStageOptions): UseEmbedStageReturn {
  const [stage, setStage] = useState<EmbedStage>(() => {
    if (!ctaConfig?.enabled) {
      return 'chat';
    }

    if (ctaConfig.settings?.showOncePerSession) {
      const dismissed = sessionStorage.getItem(getSessionStorageKey(embedId));
      if (dismissed === 'true') {
        return 'chat';
      }
    }

    return 'cta';
  });

  const [pendingMessage, setPendingMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!ctaConfig?.enabled) {
      setStage('chat');
      return;
    }

    if (ctaConfig.settings?.showOncePerSession) {
      const dismissed = sessionStorage.getItem(getSessionStorageKey(embedId));
      if (dismissed === 'true') {
        setStage('chat');
        return;
      }
    }
  }, [ctaConfig, embedId]);

  const transitionToChat = useCallback((predefinedMessage?: string) => {
    if (ctaConfig?.settings?.showOncePerSession) {
      sessionStorage.setItem(getSessionStorageKey(embedId), 'true');
    }

    if (predefinedMessage) {
      setPendingMessage(predefinedMessage);
    }

    setStage('chat');
  }, [ctaConfig, embedId]);

  const clearPendingMessage = useCallback(() => {
    setPendingMessage(null);
  }, []);

  return {
    stage,
    transitionToChat,
    pendingMessage,
    clearPendingMessage,
  };
}
