/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback, useRef } from 'react';

export type VoiceMode = 'push-to-talk' | 'continuous';

interface UseSpeechRecognitionProps {
  onResult: (text: string) => void;
  mode: VoiceMode;
}

export function useSpeechRecognition({ onResult, mode }: UseSpeechRecognitionProps) {
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);
  const isListeningRef = useRef(false);

  useEffect(() => {
    isListeningRef.current = isListening;
  }, [isListening]);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError('Speech recognition not supported in this browser.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = mode === 'continuous';
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onresult = (event: any) => {
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        }
      }
      if (finalTranscript.trim()) {
        onResult(finalTranscript.trim());
      }
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      if (event.error === 'no-speech') return;
      
      let message = event.error;
      if (event.error === 'not-allowed') {
        message = 'Microphone access denied. Please click on the "New Tab" icon in the top right to open the app and grant microphone permissions.';
      } else if (event.error === 'network') {
        message = 'Network error during speech recognition.';
      }
      
      setError(message);
      setIsListening(false);
    };

    recognition.onend = () => {
      if (mode === 'continuous' && isListeningRef.current) {
        try {
          recognition.start();
        } catch (e) {
          console.error('Auto-restart failed:', e);
        }
      } else {
        setIsListening(false);
      }
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [mode, onResult]); // Removed isListening from dependencies to avoid re-creation

  const startListening = useCallback(() => {
    if (recognitionRef.current && !isListening) {
      try {
        setError(null);
        setIsListening(true);
        recognitionRef.current.start();
      } catch (e) {
        console.error('Failed to start recognition:', e);
        setIsListening(false);
      }
    }
  }, [isListening]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  }, [isListening]);

  return {
    isListening,
    startListening,
    stopListening,
    error
  };
}
