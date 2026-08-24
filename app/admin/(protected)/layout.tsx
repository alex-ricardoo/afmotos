import { AdminSidebar } from '@/components/admin/admin-sidebar';
import { AdminHeader } from '@/components/admin/admin-header';
import { AdminBottomNav } from '@/components/admin/admin-bottom-nav';
import { getSettings } from '@/lib/actions/settings';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSettings();

  return (
    <div className="flex h-screen w-full bg-[#08080a] text-zinc-100 overflow-hidden">
      {/* Desktop Fixed Sidebar */}
      <div className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 z-30">
        <AdminSidebar settings={settings} />
      </div>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col lg:pl-64 min-w-0 h-full overflow-hidden">
        <AdminHeader settings={settings} />
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8">
          {children}
        </main>
      </div>

      {/* Mobile Floating Bottom Dock */}
      <AdminBottomNav />
    </div>
  );
}
