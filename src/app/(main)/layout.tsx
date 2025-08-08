import { AppShell } from "@/components/app-shell";
import { UserProfileProvider } from "@/context/user-profile-context";

export default function MainAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <UserProfileProvider>
      <AppShell>{children}</AppShell>
    </UserProfileProvider>
  );
}
