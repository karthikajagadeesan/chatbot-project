import Sidebar from "@/components/sidebar";
import MobileHeader from "@/components/mobile-header";

export default function ProtectedLayout({
    children,
}: {
    children: React.ReactNode;
}) {

    return (
        <main className="flex min-h-screen max-h-screen w-full md:p-2 overflow-hidden gap-2">
            <Sidebar />
            <div className="flex flex-1 flex-col border rounded-lg min-w-0">
                <MobileHeader />
                <div className="flex flex-1 flex-col overflow-y-auto px-3 py-2 md:p-3">
                    {children}
                </div>
            </div>
        </main>
    );
}
