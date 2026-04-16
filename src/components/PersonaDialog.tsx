/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Agent } from "@/src/types";
import { Plus, UserCircle, Check, Settings2, Sparkles, User, Turtle, Rabbit, ArrowDown, ArrowUp } from "lucide-react";

const AVAILABLE_CAPABILITIES = [
  "coding", "debugging", "architecture", "optimization", "automation", "security",
  "writing", "storytelling", "creative", "brainstorming", "design",
  "research", "fact-checking", "summarization", "mathematics", "science", "history",
  "empathy", "chat", "support", "tutoring", "translation", "planning", "scheduling"
];

const DESCRIPTION_LIMIT = 100;
const INSTRUCTION_LIMIT = 1000;

interface PersonaDialogProps {
  onSave: (agent: Agent) => void;
  agentToEdit?: Agent | null;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
}

export function PersonaDialog({ onSave, agentToEdit, open: externalOpen, onOpenChange: setExternalOpen, trigger }: PersonaDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = externalOpen !== undefined ? externalOpen : internalOpen;
  const setOpen = setExternalOpen !== undefined ? setExternalOpen : setInternalOpen;

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [instruction, setInstruction] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [selectedCapabilities, setSelectedCapabilities] = useState<string[]>([]);
  const [pitch, setPitch] = useState(1);
  const [rate, setRate] = useState(1);

  // Load agent data when editing
  useEffect(() => {
    if (agentToEdit) {
      setName(agentToEdit.name);
      setDescription(agentToEdit.description);
      setInstruction(agentToEdit.systemInstruction);
      setAvatarUrl(agentToEdit.avatarUrl || "");
      setSelectedCapabilities(agentToEdit.capabilities || []);
      setPitch(agentToEdit.voicePrefs?.pitch ?? 1);
      setRate(agentToEdit.voicePrefs?.rate ?? 1);
    } else {
      setName("");
      setDescription("");
      setInstruction("");
      setAvatarUrl("");
      setSelectedCapabilities([]);
      setPitch(1);
      setRate(1);
    }
  }, [agentToEdit, open]);

  const toggleCapability = (cap: string) => {
    setSelectedCapabilities(prev =>
      prev.includes(cap) ? prev.filter(c => c !== cap) : [...prev, cap]
    );
  };

  const clearCapabilities = () => setSelectedCapabilities([]);

  const handleSave = () => {
    if (!name || !instruction || description.length > DESCRIPTION_LIMIT || instruction.length > INSTRUCTION_LIMIT) return;

    const newAgent: Agent = {
      id: agentToEdit?.id || `custom-${Date.now()}`,
      name,
      description: description || "Custom designated agent.",
      systemInstruction: instruction,
      icon: "UserCircle",
      color: agentToEdit?.color || "bg-slate-500",
      avatarUrl: avatarUrl || undefined,
      capabilities: selectedCapabilities,
      voicePrefs: { pitch, rate },
    };

    onSave(newAgent);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger ? (
        <DialogTrigger asChild>
          {trigger}
        </DialogTrigger>
      ) : (
        <DialogTrigger
          render={
            <Button variant="outline" className="w-full gap-2 border-dashed">
              <Plus size={16} />
              Designate New Agent
            </Button>
          }
        />
      )}
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{agentToEdit ? "Update Agent Persona" : "Designate Agent Persona"}</DialogTitle>
          <DialogDescription>
            {agentToEdit 
              ? `Updating the behavior for ${agentToEdit.name}.`
              : "Define the personality and behavior of your new AI agent."}
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="identity" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="identity" className="flex gap-2">
              <User size={14} /> Identity
            </TabsTrigger>
            <TabsTrigger value="persona" className="flex gap-2">
              <Sparkles size={14} /> Persona
            </TabsTrigger>
          </TabsList>

          <TabsContent value="identity" className="space-y-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="name">Agent Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Marketing Expert"
              />
            </div>
            <div className="grid gap-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="description">Short Description</Label>
                <span className={cn(
                  "text-[10px]",
                  description.length > DESCRIPTION_LIMIT ? "text-destructive font-bold" : "text-muted-foreground"
                )}>
                  {description.length}/{DESCRIPTION_LIMIT}
                </span>
              </div>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g., Helps with copy and strategy"
                className={cn(description.length > DESCRIPTION_LIMIT && "border-destructive focus-visible:ring-destructive")}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="avatarUrl">Avatar URL (Optional)</Label>
              <Input
                id="avatarUrl"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="https://example.com/avatar.png"
              />
            </div>
            <div className="grid gap-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="instruction">System Instruction (Behavior)</Label>
                <span className={cn(
                  "text-[10px]",
                  instruction.length > INSTRUCTION_LIMIT ? "text-destructive font-bold" : "text-muted-foreground"
                )}>
                  {instruction.length}/{INSTRUCTION_LIMIT}
                </span>
              </div>
              <Textarea
                id="instruction"
                value={instruction}
                onChange={(e) => setInstruction(e.target.value)}
                placeholder="Describe how the agent should behave..."
                className={cn(
                  "min-h-[120px]",
                  instruction.length > INSTRUCTION_LIMIT && "border-destructive focus-visible:ring-destructive"
                )}
              />
            </div>
          </TabsContent>

          <TabsContent value="persona" className="space-y-6 py-2">
            <div className="grid gap-2">
              <div className="flex justify-between items-center">
                <Label className="flex items-center gap-2">
                  Capabilities
                </Label>
                {selectedCapabilities.length > 0 && (
                  <button 
                    onClick={clearCapabilities}
                    className="text-[10px] text-muted-foreground hover:text-primary transition-colors underline underline-offset-2"
                  >
                    Clear all ({selectedCapabilities.length})
                  </button>
                )}
              </div>
              <ScrollArea className="h-[140px] w-full rounded-md border p-4 bg-muted/10">
                <div className="grid grid-cols-2 gap-4">
                  {AVAILABLE_CAPABILITIES.map((cap) => (
                    <div key={cap} className="flex items-center space-x-2">
                      <Checkbox 
                        id={`cap-${cap}`} 
                        checked={selectedCapabilities.includes(cap)}
                        onCheckedChange={() => toggleCapability(cap)}
                      />
                      <label
                        htmlFor={`cap-${cap}`}
                        className="text-xs font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer capitalize"
                      >
                        {cap}
                      </label>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
            
            <div className="grid gap-6 p-4 border rounded-xl bg-muted/30 shadow-sm">
              <div className="flex items-center gap-2">
                <Settings2 size={16} className="text-primary" />
                <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Voice Customization</Label>
              </div>
              
              <div className="grid gap-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-end">
                    <div className="space-y-1">
                      <Label className="text-xs font-medium">Voice Pitch</Label>
                      <p className="text-[10px] text-muted-foreground">Adjust the frequency of the agent's voice</p>
                    </div>
                    <span className="font-mono text-xs font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                      {pitch.toFixed(1)}x
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <ArrowDown size={14} className="text-muted-foreground shrink-0" />
                    <Slider 
                      min={0.5} max={2} step={0.1}
                      value={[pitch]}
                      onValueChange={(vals) => setPitch(vals[0])}
                      className="flex-1"
                    />
                    <ArrowUp size={14} className="text-muted-foreground shrink-0" />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-end">
                    <div className="space-y-1">
                      <Label className="text-xs font-medium">Speaking Rate</Label>
                      <p className="text-[10px] text-muted-foreground">Adjust how quickly the agent speaks</p>
                    </div>
                    <span className="font-mono text-xs font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                      {rate.toFixed(1)}x
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <Turtle size={16} className="text-muted-foreground shrink-0" />
                    <Slider 
                      min={0.5} max={2} step={0.1}
                      value={[rate]}
                      onValueChange={(vals) => setRate(vals[0])}
                      className="flex-1"
                    />
                    <Rabbit size={16} className="text-muted-foreground shrink-0" />
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="mt-4">
          <Button 
            onClick={handleSave} 
            disabled={
              !name || 
              !instruction || 
              description.length > DESCRIPTION_LIMIT || 
              instruction.length > INSTRUCTION_LIMIT
            }
          >
            {agentToEdit ? "Save Changes" : "Create Agent"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
