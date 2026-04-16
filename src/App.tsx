/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useRef, useEffect } from "react";
import { Agent, Message, DEFAULT_AGENTS } from "@/src/types";
import { streamChatResponse } from "./lib/gemini";
import { useTextToSpeech } from "./hooks/useTextToSpeech";
import { AgentCard } from "./components/AgentCard";
import { ChatMessage } from "./components/ChatMessage";
import { ChatInput } from "./components/ChatInput";
import { PersonaDialog } from "./components/PersonaDialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Bot, PanelLeft, Trash2, Settings2, PlusCircle, MessageSquarePlus, Volume2, VolumeX, Search, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export default function App() {
  const [agents, setAgents] = useState<Agent[]>(() => {
    const saved = localStorage.getItem('nexus-agents');
    return saved ? JSON.parse(saved) : DEFAULT_AGENTS;
  });
  const [selectedAgent, setSelectedAgent] = useState<Agent>(() => agents[0] || DEFAULT_AGENTS[0]);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
  const [isPersonaDialogOpen, setIsPersonaDialogOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isVoiceOutputEnabled, setIsVoiceOutputEnabled] = useState(false);
  const [agentSearchQuery, setAgentSearchQuery] = useState("");
  const [ttsVolume, setTtsVolume] = useState(1);
  const { speak, stop, isSpeaking } = useTextToSpeech(ttsVolume);
  const scrollRef = useRef<HTMLDivElement>(null);

  const filteredAgents = agents.filter(agent => 
    agent.name.toLowerCase().includes(agentSearchQuery.toLowerCase()) ||
    agent.description.toLowerCase().includes(agentSearchQuery.toLowerCase()) ||
    agent.capabilities?.some(cap => cap.toLowerCase().includes(agentSearchQuery.toLowerCase()))
  );

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isTyping]);

  // Persist agents
  useEffect(() => {
    localStorage.setItem('nexus-agents', JSON.stringify(agents));
  }, [agents]);

  const handleSendMessage = async (content: string) => {
    // Interruption: Stop current speech if user sends a new message
    stop();

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsTyping(true);

    try {
      const assistantMessageId = (Date.now() + 1).toString();
      let assistantContent = "";

      setMessages(prev => [...prev, {
        id: assistantMessageId,
        role: 'model',
        content: "",
        timestamp: Date.now(),
      }]);

      const stream = streamChatResponse(
        "gemini-3-flash-preview",
        selectedAgent.systemInstruction,
        [...messages, userMessage]
      );

      for await (const chunk of stream) {
        assistantContent += chunk;
        setMessages(prev => prev.map(msg => 
          msg.id === assistantMessageId 
            ? { ...msg, content: assistantContent }
            : msg
        ));
      }

      if (isVoiceOutputEnabled) {
        speak(assistantContent, selectedAgent.voicePrefs);
      }
    } catch (error) {
      console.error("Failed to get response:", error);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'model',
        content: "I'm sorry, I encountered an error. Please try again.",
        timestamp: Date.now(),
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const clearChat = () => {
    setMessages([]);
  };

  const saveAgent = (agent: Agent) => {
    setAgents(prev => {
      const exists = prev.find(a => a.id === agent.id);
      if (exists) {
        return prev.map(a => a.id === agent.id ? agent : a);
      }
      return [...prev, agent];
    });
    
    // Update selected agent if we just edited it
    if (selectedAgent.id === agent.id) {
      setSelectedAgent(agent);
    } else if (!agents.find(a => a.id === agent.id)) {
      // If it's a new agent, select it
      setSelectedAgent(agent);
    }
    
    setEditingAgent(null);
  };

  const removeAgent = (agent: Agent) => {
    setAgents(prev => prev.filter(a => a.id !== agent.id));
    if (selectedAgent.id === agent.id) {
      setSelectedAgent(DEFAULT_AGENTS[0]);
    }
  };

  const startEditing = (agent: Agent) => {
    setEditingAgent(agent);
    setIsPersonaDialogOpen(true);
  };

  return (
    <TooltipProvider>
      <div className="flex h-screen w-full bg-background overflow-hidden font-sans">
        {/* Sidebar */}
        <AnimatePresence mode="wait">
          {isSidebarOpen && (
            <motion.aside
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 320, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="border-r bg-muted/30 flex flex-col h-full"
            >
              <div className="p-6 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-primary rounded-lg text-primary-foreground">
                    <Bot size={20} />
                  </div>
                  <h1 className="text-xl font-bold tracking-tight">Nexus AI</h1>
                </div>
              </div>

              <div className="px-6 mb-4">
                <Button 
                  onClick={clearChat}
                  className="w-full justify-start gap-2 h-10 shadow-sm"
                >
                  <MessageSquarePlus size={18} />
                  New Chat
                </Button>
              </div>

              <div className="px-6 mb-6">
                <div className="relative group">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <Input 
                    placeholder="Search agents..." 
                    className="pl-9 pr-8 h-9 bg-muted/50 border-none focus-visible:ring-1 focus-visible:ring-primary/30"
                    value={agentSearchQuery}
                    onChange={(e) => setAgentSearchQuery(e.target.value)}
                  />
                  {agentSearchQuery && (
                    <button 
                      onClick={() => setAgentSearchQuery("")}
                      className="absolute right-2 top-1/2 -translate-y-1/2 h-5 w-5 flex items-center justify-center rounded-md hover:bg-muted-foreground/10 text-muted-foreground transition-colors"
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>
              </div>

              <ScrollArea className="flex-1 px-4">
                <div className="space-y-6 py-2">
                  <div>
                    <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-2 flex justify-between items-center">
                      <span>{agentSearchQuery ? "Matching Agents" : "Active Agents"}</span>
                      {agentSearchQuery && (
                        <span className="text-[10px] lowercase font-normal opacity-70">
                          {filteredAgents.length} found
                        </span>
                      )}
                    </h2>
                    <div className="space-y-2">
                      {filteredAgents.length > 0 ? (
                        filteredAgents.map((agent) => (
                          <AgentCard
                            key={agent.id}
                            agent={agent}
                            isSelected={selectedAgent.id === agent.id}
                            isTyping={selectedAgent.id === agent.id && isTyping}
                            isSpeaking={selectedAgent.id === agent.id && isSpeaking}
                            onClick={() => setSelectedAgent(agent)}
                            onEdit={startEditing}
                            onRemove={removeAgent}
                          />
                        ))
                      ) : (
                        <div className="px-2 py-8 text-center space-y-2">
                          <p className="text-xs text-muted-foreground italic">No matching agents found</p>
                          <Button 
                            variant="link" 
                            size="sm" 
                            className="h-auto p-0 text-[10px]"
                            onClick={() => setAgentSearchQuery("")}
                          >
                            Clear search
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="px-2">
                    <PersonaDialog 
                      onSave={saveAgent} 
                      agentToEdit={editingAgent}
                      open={isPersonaDialogOpen}
                      onOpenChange={(open) => {
                        setIsPersonaDialogOpen(open);
                        if (!open) setEditingAgent(null);
                      }}
                    />
                  </div>
                </div>
              </ScrollArea>

              <div className="p-4 border-t bg-muted/50">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>v1.0.0</span>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Settings2 size={14} />
                    </Button>
                  </div>
                </div>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Main Chat Area */}
        <main className="flex-1 flex flex-col relative min-w-0">
          {/* Header */}
          <header className="h-16 border-b flex items-center justify-between px-6 glass sticky top-0 z-10">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="text-muted-foreground"
              >
                <PanelLeft size={20} />
              </Button>
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-2 h-2 rounded-full",
                  isSpeaking ? "bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.5)]" : selectedAgent.color
                )} />
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-semibold text-sm leading-none">{selectedAgent.name}</h2>
                    {isSpeaking && (
                      <Badge variant="outline" className="h-4 px-1 text-[8px] uppercase tracking-tighter border-red-500/50 text-red-500 animate-pulse">
                        Speaking
                      </Badge>
                    )}
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    {isTyping ? "Thinking..." : "Active Agent"}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="hidden lg:flex">
                Gemini 3 Flash
              </Badge>
              {isSpeaking && (
                <Button 
                  variant="destructive" 
                  size="sm" 
                  onClick={stop}
                  className="h-8 gap-2 animate-pulse"
                >
                  <VolumeX size={14} />
                  Stop
                </Button>
              )}
              <div className="flex items-center gap-2 px-2 py-1 bg-muted/50 rounded-lg group/volume">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setIsVoiceOutputEnabled(!isVoiceOutputEnabled)}
                  className={cn(
                    "h-8 w-8 text-muted-foreground transition-colors",
                    isVoiceOutputEnabled && "text-primary bg-primary/10"
                  )}
                >
                  {isVoiceOutputEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
                </Button>
                <div className="flex items-center gap-2 overflow-hidden transition-all duration-300 w-16 md:w-24">
                  <input 
                    type="range" 
                    min="0" 
                    max="1" 
                    step="0.05" 
                    value={ttsVolume} 
                    onChange={(e) => setTtsVolume(parseFloat(e.target.value))}
                    className="w-full h-1 bg-muted-foreground/20 rounded-full appearance-none cursor-pointer accent-primary"
                    title={`Volume: ${Math.round(ttsVolume * 100)}%`}
                  />
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={clearChat}
                className="text-muted-foreground hover:text-destructive"
              >
                <Trash2 size={18} />
              </Button>
            </div>
          </header>

          {/* Messages */}
          <ScrollArea className="flex-1 p-6">
            <div className="max-w-3xl mx-auto w-full">
              {messages.length === 0 ? (
                <div className="h-[60vh] flex flex-col items-center justify-center text-center space-y-4">
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className={`p-6 rounded-3xl text-white shadow-2xl ${selectedAgent.color}`}
                  >
                    <Bot size={48} />
                  </motion.div>
                  <div className="space-y-2">
                    <h3 className="text-2xl font-bold">Hello, I'm {selectedAgent.name}</h3>
                    <p className="text-muted-foreground max-w-sm">
                      {selectedAgent.description} How can I help you today?
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  {messages.map((msg) => (
                    <ChatMessage 
                      key={msg.id} 
                      message={msg} 
                      agentColor={selectedAgent.color}
                      agentAvatar={selectedAgent.avatarUrl}
                    />
                  ))}
                  {isTyping && (
                    <div className="flex gap-3 mb-6">
                      <div className={`h-8 w-8 rounded-full flex items-center justify-center text-white text-[10px] ${selectedAgent.color}`}>
                        AI
                      </div>
                      <div className="bg-muted px-4 py-2 rounded-2xl rounded-tl-none flex gap-1 items-center h-9">
                        <span className="w-1.5 h-1.5 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-1.5 h-1.5 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-1.5 h-1.5 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  )}
                  <div ref={scrollRef} />
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Input Area */}
          <div className="p-6">
            <div className="max-w-3xl mx-auto">
              <ChatInput onSend={handleSendMessage} disabled={isTyping || isSpeaking} />
              <p className="text-[10px] text-center text-muted-foreground mt-3">
                Nexus AI can make mistakes. Check important info.
              </p>
            </div>
          </div>
        </main>
      </div>
    </TooltipProvider>
  );
}
