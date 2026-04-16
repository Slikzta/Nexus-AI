/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SendHorizontal, Mic, MicOff, Radio, RadioTower } from "lucide-react";
import { useSpeechRecognition, VoiceMode } from "@/src/hooks/useSpeechRecognition";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface ChatInputProps {
  onSend: (content: string) => void;
  disabled?: boolean;
}

export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [content, setContent] = useState("");
  const [voiceMode, setVoiceMode] = useState<VoiceMode>('push-to-talk');
  const inputRef = useRef<HTMLInputElement>(null);

  const { isListening, startListening, stopListening, error } = useSpeechRecognition({
    mode: voiceMode,
    onResult: (text) => {
      if (voiceMode === 'continuous') {
        onSend(text);
      } else {
        setContent(prev => prev + (prev ? " " : "") + text);
      }
    }
  });

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (content.trim() && !disabled) {
      onSend(content.trim());
      setContent("");
    }
  };

  useEffect(() => {
    if (!disabled) {
      inputRef.current?.focus();
      // Auto-reactivate microphone in continuous mode after AI finishes speaking
      if (voiceMode === 'continuous' && !isListening) {
        startListening();
      }
    } else {
      // Stop listening if the component becomes disabled (e.g., AI starts speaking)
      if (isListening) {
        stopListening();
      }
    }
  }, [disabled, voiceMode, isListening, startListening, stopListening]);

  const toggleVoiceMode = () => {
    setVoiceMode(prev => prev === 'push-to-talk' ? 'continuous' : 'push-to-talk');
    if (isListening) stopListening();
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between px-4">
        {error ? (
          <p className="text-[10px] text-destructive">{error}</p>
        ) : (
          <div className="flex items-center gap-2">
            {voiceMode === 'continuous' && (
              <Badge variant="outline" className="h-4 px-1.5 text-[8px] uppercase tracking-widest border-primary/30 text-primary animate-pulse bg-primary/5">
                Live Connection
              </Badge>
            )}
          </div>
        )}
      </div>
      <form 
        onSubmit={handleSubmit}
        className="flex items-center gap-2 p-2 glass rounded-2xl border shadow-lg"
      >
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={toggleVoiceMode}
                className={cn(
                  "rounded-xl shrink-0",
                  voiceMode === 'continuous' ? "text-primary bg-primary/10" : "text-muted-foreground"
                )}
              >
                {voiceMode === 'continuous' ? <RadioTower size={18} /> : <Radio size={18} />}
              </Button>
            }
          />
          <TooltipContent className="flex flex-col gap-1 items-start">
            <span className="font-bold">{voiceMode === 'continuous' ? "Continuous Talk Active" : "Push to Talk Mode"}</span>
            <p className="text-[10px] text-muted-foreground">
              {voiceMode === 'continuous' 
                ? "AI listens and sends automatically when you pause." 
                : "Hold mic to speak, release to stop."}
            </p>
          </TooltipContent>
        </Tooltip>

        <Input
          ref={inputRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={isListening ? "Listening..." : "Type your message..."}
          className="flex-1 bg-transparent border-none focus-visible:ring-0 focus-visible:ring-offset-0 px-2"
          disabled={disabled}
        />

        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onMouseDown={voiceMode === 'push-to-talk' ? startListening : undefined}
            onMouseUp={voiceMode === 'push-to-talk' ? stopListening : undefined}
            onClick={voiceMode === 'continuous' ? (isListening ? stopListening : startListening) : undefined}
            className={cn(
              "rounded-xl transition-all shrink-0",
              isListening ? "text-red-500 bg-red-500/10 animate-pulse" : "text-muted-foreground"
            )}
          >
            {isListening ? <MicOff size={18} /> : <Mic size={18} />}
          </Button>

          <Button 
            type="submit" 
            size="icon" 
            disabled={!content.trim() || disabled}
            className="rounded-xl transition-all active:scale-95 shrink-0"
          >
            <SendHorizontal size={18} />
          </Button>
        </div>
      </form>
    </div>
  );
}
