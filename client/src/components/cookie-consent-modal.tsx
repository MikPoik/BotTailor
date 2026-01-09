import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const LOCAL_STORAGE_KEY = 'cookie_consent';

export type CookieConsentStatus = 'accepted' | 'declined' | null;

interface CookieConsentModalProps {
  onConsent: (status: CookieConsentStatus) => void;
}

export const CookieConsentModal: React.FC<CookieConsentModalProps> = ({ onConsent }) => {
  const [visible, setVisible] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!consent) {
      setVisible(true);
    }
    setHasInitialized(true);
  }, []);

  const handleConsent = (status: CookieConsentStatus) => {
    localStorage.setItem(LOCAL_STORAGE_KEY, status || 'declined');
    setVisible(false);
    // Call the parent callback immediately after setting localStorage
    onConsent(status);
  };

  if (!hasInitialized || !visible) return null;

  return (
    <div className="fixed bottom-0 left-0 w-full z-50 flex justify-center pointer-events-auto">
      <Card className="m-4 p-4 max-w-md w-full shadow-lg bg-background border border-border">
        <div className="mb-2 text-sm text-foreground">
          This site uses cookies to improve your experience. By accepting, you allow us to use Google Analytics for tracking page visits.
        </div>
        <div className="flex gap-2 justify-end">
          <Button variant="outline" size="sm" onClick={() => handleConsent('declined')}>Decline</Button>
          <Button size="sm" onClick={() => handleConsent('accepted')}>Accept</Button>
        </div>
      </Card>
    </div>
  );
};
