import { Toaster } from "sonner";
import { AdminSidebar } from "./admin-sidebar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-neutral-50">
      <AdminSidebar />
      <main className="flex-1 p-8">{children}</main>
      <Toaster richColors position="top-right" />
    </div>
  );
}
