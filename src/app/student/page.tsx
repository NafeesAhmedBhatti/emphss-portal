import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { StudentPortalClient } from "@/components/StudentPortalClient";

export default function StudentPortalPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 px-4 py-10 sm:px-6">
        <StudentPortalClient />
      </main>
      <Footer />
    </div>
  );
}
