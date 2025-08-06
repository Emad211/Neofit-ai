import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ChatPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <header className="mb-8">
        <h1 className="text-4xl font-bold font-headline text-foreground">
          AI Coach Chat
        </h1>
        <p className="text-muted-foreground">
          Ask our AI experts anything about fitness and nutrition.
        </p>
      </header>
       <Card>
        <CardHeader>
          <CardTitle>Coming Soon</CardTitle>
        </CardHeader>
        <CardContent>
          <p>A full conversational AI experience is coming soon.</p>
        </CardContent>
      </Card>
    </div>
  );
}
