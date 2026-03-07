import { useState, useEffect, useRef, useCallback } from "react";

interface UseSpeechRecognitionOptions {
  keyword?: string;
  enabled: boolean;
  onKeyword: () => void;
}

export function useSpeechRecognition({ keyword = "drop", enabled, onKeyword }: UseSpeechRecognitionOptions) {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const permissionDeniedRef = useRef(false);
  const recognitionRef = useRef<any>(null);
  const onKeywordRef = useRef(onKeyword);
  const enabledRef = useRef(enabled);
  const lastTriggerRef = useRef(0);

  onKeywordRef.current = onKeyword;
  enabledRef.current = enabled;

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
      recognitionRef.current = null;
    }
    setIsListening(false);
  }, []);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setIsSupported(false);
      return;
    }

    if (!enabled) {
      stopListening();
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event: any) => {
      const now = Date.now();
      if (now - lastTriggerRef.current < 1500) return;
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript.toLowerCase().trim();
        if (transcript.includes(keyword.toLowerCase())) {
          lastTriggerRef.current = now;
          onKeywordRef.current();
          break;
        }
      }
    };

    recognition.onstart = () => setIsListening(true);

    recognition.onerror = (event: any) => {
      if (event.error === "not-allowed") {
        permissionDeniedRef.current = true;
        setPermissionDenied(true);
        setIsListening(false);
      } else if (event.error === "no-speech" || event.error === "aborted" || event.error === "network") {
        // ignore
      }
    };

    recognition.onend = () => {
      setIsListening(false);
      if (enabledRef.current && !permissionDeniedRef.current) {
        try {
          setTimeout(() => {
            if (enabledRef.current && recognitionRef.current === recognition) {
              recognition.start();
            }
          }, 200);
        } catch {}
      }
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
    } catch {}

    return () => {
      try { recognition.stop(); } catch {}
      if (recognitionRef.current === recognition) {
        recognitionRef.current = null;
      }
      setIsListening(false);
    };
  }, [enabled, keyword, stopListening]);

  return { isListening, isSupported, permissionDenied, stopListening };
}
