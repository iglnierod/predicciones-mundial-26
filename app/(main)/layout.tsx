import Footer from "@/components/footer";
import Header from "@/components/header";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import React from "react";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL;

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  const isAdmin = user?.email === ADMIN_EMAIL;

  return (
    <div className="bg-ball-blur flex min-h-dvh flex-col bg-neutral-950 text-white">
      <Header user={user} isAdmin={isAdmin} />
      <main className="mx-auto w-full max-w-7xl flex-1 px-6 py-8">
        {children}
      </main>
      <Footer />
    </div>
  );
}
