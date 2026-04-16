/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { Message } from "@/src/types";
import { cn } from "@/lib/utils";
import { motion } from "motion/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface ChatMessageProps {
  message: Message;
  agentIcon?: string;
  agentColor?: string;
  agentAvatar?: string;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message, agentIcon, agentColor, agentAvatar }) => {
  const isUser = message.role === 'user';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "flex w-full gap-3 mb-6",
        isUser ? "flex-row-reverse" : "flex-row"
      )}
    >
      <Avatar className={cn("h-8 w-8 mt-1", !isUser && agentColor)}>
        {isUser ? (
          <AvatarFallback className="bg-primary text-primary-foreground">U</AvatarFallback>
        ) : (
          <>
            {agentAvatar ? (
              <AvatarImage src={agentAvatar} alt="Agent" referrerPolicy="no-referrer" className="object-cover" />
            ) : (
              <AvatarFallback className="text-white">AI</AvatarFallback>
            )}
          </>
        )}
      </Avatar>
      
      <div className={cn(
        "flex flex-col max-w-[80%]",
        isUser ? "items-end" : "items-start"
      )}>
        <div className={cn(
          "px-4 py-2 rounded-2xl text-sm leading-relaxed shadow-sm",
          isUser 
            ? "bg-primary text-primary-foreground rounded-tr-none" 
            : "bg-muted text-foreground rounded-tl-none"
        )}>
          {message.content}
        </div>
        <span className="text-[10px] text-muted-foreground mt-1 px-1">
          {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </motion.div>
  );
}
