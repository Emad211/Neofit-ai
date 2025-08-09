// This component is created by Studio.
"use client";

import { conversationalAgent } from "@/ai/flows/ai-coach-chat";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useUserData } from "@/context/user-profile-context";
import { cn } from "@/lib/utils";
import { Bot, Send, User, Loader2 } from "lucide-react";
import { useState, useRef, useEffect, FormEvent } from "react";

type Message = {
  role: "user" | "assistant";
  content: string;
};

type AgentType = "fitness" | "nutrition";

const initialMessages: Record<AgentType, Message[]> = {
  fitness: [
    {
      role: "assistant",
      content:
        "Hello! I'm your AI Fitness Coach. How can I help you with your training today?",
    },
  ],
  nutrition: [
    {
      role: "assistant",
      content:
        "Hello! I'm your AI Nutrition Coach. What questions do you have about your diet or meals?",
    },
  ],
};

export function AIChatInterface() {
  const [activeTab, setActiveTab] = useState<AgentType>("fitness");
  const [messages, setMessages] = useState<Record<AgentType, Message[]>>(initialMessages);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { user } = useUserData();

  const handleTabChange = (value: string) => {
    setActiveTab(value as AgentType);
  };
  
  useEffect(() => {
    if (scrollAreaRef.current) {
        scrollAreaRef.current.scrollTo({
            top: scrollAreaRef.current.scrollHeight,
            behavior: 'smooth'
        });
    }
  }, [messages, activeTab]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim() || !user) return;

    const newMessage: Message = { role: "user", content: input };
    const currentMessages = [...messages[activeTab], newMessage];

    setMessages((prev) => ({ ...prev, [activeTab]: currentMessages }));
    setInput("");
    setIsLoading(true);

    try {
      const result = await conversationalAgent({
        userId: user.uid,
        agentType: activeTab,
        messageHistory: currentMessages.slice(0, -1).map(m => ({ role: m.role, content: m.content })),
        newMessage: input,
      });

      const assistantMessage: Message = {
        role: "assistant",
        content: result.response,
      };
      setMessages((prev) => ({
        ...prev,
        [activeTab]: [...currentMessages, assistantMessage],
      }));
    } catch (error) {
      console.error("Error fetching AI response:", error);
       const errorMessage: Message = {
        role: "assistant",
        content: "Sorry, I encountered an error. Please try again.",
      };
      setMessages((prev) => ({
        ...prev,
        [activeTab]: [...currentMessages, errorMessage],
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const renderChatContent = (agentType: AgentType) => (
    <Card className="h-full flex flex-col">
      <CardContent className="flex-grow p-0 flex flex-col">
        <ScrollArea className="flex-grow p-4" ref={scrollAreaRef}>
          <div className="space-y-6">
            {messages[agentType].map((message, index) => (
              <div
                key={index}
                className={cn(
                  "flex items-start gap-3",
                  message.role === "user" ? "justify-end" : "justify-start"
                )}
              >
                {message.role === "assistant" && (
                  <Avatar className="h-9 w-9 border">
                    <AvatarFallback><Bot /></AvatarFallback>
                  </Avatar>
                )}
                <div
                  className={cn(
                    "max-w-xs md:max-w-md lg:max-w-lg rounded-lg px-4 py-2",
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-secondary-foreground"
                  )}
                >
                  <p className="text-sm">{message.content}</p>
                </div>
                 {message.role === "user" && (
                  <Avatar className="h-9 w-9 border">
                    <AvatarImage src={user?.photoURL || "https://placehold.co/100x100.png"} alt={user?.displayName || "User"} data-ai-hint="profile picture" />
                    <AvatarFallback><User /></AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="flex items-start gap-3 justify-start">
                  <Avatar className="h-9 w-9 border">
                    <AvatarFallback><Bot /></AvatarFallback>
                  </Avatar>
                 <div className="bg-secondary text-secondary-foreground rounded-lg px-4 py-2 flex items-center">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                 </div>
              </div>
            )}
          </div>
        </ScrollArea>
        <div className="p-4 border-t">
          <form onSubmit={handleSubmit} className="flex items-center gap-3">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={`Message ${agentType} coach...`}
              autoComplete="off"
              disabled={isLoading || !user}
            />
            <Button type="submit" size="icon" disabled={isLoading || !input.trim() || !user}>
              <Send className="h-5 w-5" />
            </Button>
          </form>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <Tabs
      value={activeTab}
      onValueChange={handleTabChange}
      className="h-full flex flex-col"
    >
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="fitness">Fitness</TabsTrigger>
        <TabsTrigger value="nutrition">Nutrition</TabsTrigger>
      </TabsList>
      <div className="flex-grow mt-4">
        <TabsContent value="fitness" className="h-full m-0">
          {renderChatContent("fitness")}
        </TabsContent>
        <TabsContent value="nutrition" className="h-full m-0">
          {renderChatContent("nutrition")}
        </TabsContent>
      </div>
    </Tabs>
  );
}
