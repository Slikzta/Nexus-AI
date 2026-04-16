/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { Agent } from "@/src/types";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import * as Icons from "lucide-react";
import { Edit2, Trash2 } from "lucide-react";
import { motion } from "motion/react";

interface AgentCardProps {
  agent: Agent;
  isSelected: boolean;
  isTyping?: boolean;
  isSpeaking?: boolean;
  onClick: () => void;
  onEdit?: (agent: Agent) => void;
  onRemove?: (agent: Agent) => void;
}

export const AgentCard: React.FC<AgentCardProps> = ({ 
  agent, 
  isSelected, 
  isTyping, 
  isSpeaking, 
  onClick,
  onEdit,
  onRemove
}) => {
  const IconComponent = (Icons as any)[agent.icon] || Icons.User;
  const isCustom = agent.id.startsWith('custom-');

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="cursor-pointer"
    >
      <Card
        className={cn(
          "p-4 transition-all duration-300 border-2",
          isSelected
            ? "border-primary bg-primary/5 shadow-lg"
            : "border-transparent hover:border-muted-foreground/20 bg-card"
        )}
      >
        <div className="flex items-center gap-4 relative group/card">
          <div className={cn("p-2 rounded-xl text-white shrink-0 overflow-hidden relative", agent.color)}>
            {agent.avatarUrl ? (
              <img 
                src={agent.avatarUrl} 
                alt={agent.name} 
                className="w-8 h-8 object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <IconComponent size={24} />
            )}
            {(isTyping || isSpeaking) && (
              <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                <div className="flex gap-0.5">
                  <span className="w-1 h-1 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1 h-1 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1 h-1 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold truncate">{agent.name}</h3>
            <p className="text-xs text-muted-foreground truncate">
              {agent.description}
            </p>
            {agent.capabilities && agent.capabilities.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {agent.capabilities.slice(0, 3).map((cap) => (
                  <Badge key={cap} variant="secondary" className="text-[8px] px-1 py-0 h-3 uppercase font-bold tracking-wider">
                    {cap}
                  </Badge>
                ))}
                {agent.capabilities.length > 3 && (
                  <span className="text-[8px] text-muted-foreground">+{agent.capabilities.length - 3}</span>
                )}
              </div>
            )}
          </div>

          {isCustom && (onEdit || onRemove) && (
            <div className="absolute right-0 top-0 flex gap-0.5 opacity-0 group-hover/card:opacity-100 transition-opacity">
              {onEdit && (
                <button 
                  onClick={(e) => { e.stopPropagation(); onEdit(agent); }}
                  className="p-1 px-1.5 rounded-md hover:bg-primary/10 text-muted-foreground hover:text-primary active:scale-90 transition-all border border-transparent hover:border-primary/20 bg-background/50 backdrop-blur-sm"
                  title="Edit Agent"
                >
                  <Edit2 size={10} />
                </button>
              )}
              {onRemove && (
                <button 
                  onClick={(e) => { e.stopPropagation(); onRemove(agent); }}
                  className="p-1 px-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive active:scale-90 transition-all border border-transparent hover:border-destructive/20 bg-background/50 backdrop-blur-sm"
                  title="Remove Agent"
                >
                  <Trash2 size={10} />
                </button>
              )}
            </div>
          )}
        </div>
      </Card>
    </motion.div>
  );
}
