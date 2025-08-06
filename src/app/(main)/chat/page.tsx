import { AIChatInterface } from "@/components/chat/ai-chat-interface";

export default function ChatPage() {
  return (
    <div className="h-full flex flex-col">
      <header className="p-4 sm:p-6 lg:p-8">
        <h1 className="text-4xl font-bold font-headline text-foreground">
          AI Coach Chat
        </h1>
        <p className="text-muted-foreground">
          Ask our AI experts anything about fitness and nutrition.
        </p>
      </header>
       <div className="flex-grow p-4 sm:p-6 lg:p-8 pt-0">
         <AIChatInterface />
       </div>
    </div>
  );
}
