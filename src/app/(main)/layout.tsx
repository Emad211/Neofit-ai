import { AppShell } from "@/components/app-shell";
import { UserDataProvider } from "@/context/user-profile-context";

export default function MainAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <UserDataProvider>
      <AppShell>{children}</AppShell>
    </UserDataProvider>
  );
}
