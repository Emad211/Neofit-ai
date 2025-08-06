import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ChevronRight, MessageSquare, Bell, User as UserIcon, HelpCircle, LogOut } from "lucide-react";
import Link from "next/link";

const menuItems = [
    { icon: UserIcon, text: "Edit Profile", href: "#" },
    { icon: Bell, text: "Notification Settings", href: "#" },
    { icon: MessageSquare, text: "AI Coach Chat", href: "/chat" },
    { icon: HelpCircle, text: "Support & FAQ", href: "#" },
];

export default function ProfilePage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-background">
      <header className="mb-8 flex items-center gap-4">
        <Avatar className="h-20 w-20">
            <AvatarImage src="https://placehold.co/100x100.png" alt="Sara" data-ai-hint="profile picture" />
            <AvatarFallback>S</AvatarFallback>
        </Avatar>
        <div>
            <h1 className="text-4xl font-bold font-headline text-foreground">
            Sara
            </h1>
            <p className="text-muted-foreground">sara.designer@example.com</p>
        </div>
      </header>

      <main>
        <Card>
            <CardContent className="p-0">
                <ul className="divide-y divide-border">
                    {menuItems.map((item, index) => (
                        <li key={index}>
                            <Link href={item.href} className="flex items-center justify-between p-4 hover:bg-secondary transition-colors">
                                <div className="flex items-center gap-4">
                                    <item.icon className="h-5 w-5 text-primary" />
                                    <span className="text-foreground">{item.text}</span>
                                </div>
                                <ChevronRight className="h-5 w-5 text-muted-foreground" />
                            </Link>
                        </li>
                    ))}
                </ul>
            </CardContent>
        </Card>

        <div className="mt-8">
             <Button variant="outline" className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10">
                <LogOut className="mr-2 h-5 w-5" />
                Logout
            </Button>
        </div>
      </main>
    </div>
  );
}
