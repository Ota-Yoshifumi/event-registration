import { AdminSidebar } from "@/components/manage-console-sidebar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="force-light flex min-h-screen">
      <AdminSidebar />
      <main className="admin-main flex-1 overflow-auto bg-background font-sans text-foreground">
        {children}
      </main>
    </div>
  );
}
