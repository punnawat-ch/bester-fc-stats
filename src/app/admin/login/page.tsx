import type { Metadata } from "next";
import Image from "next/image";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import LoginForm from "./login-form";

export const metadata: Metadata = {
  title: "Sign in",
  robots: { index: false, follow: false },
};

export default async function LoginPage() {
  const session = await auth();
  if (session?.user) {
    redirect("/admin");
  }

  return (
    <main className="pitch-bg flex min-h-dvh items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <section className="rounded-2xl border border-border bg-panel-2/60 p-6 shadow-panel ring-1 ring-border backdrop-blur-2xl sm:p-8">
          <div className="mb-6 flex flex-col items-center gap-3 text-center">
            <Image
              src="/logo.png"
              alt="Bester FC"
              width={48}
              height={48}
              className="h-12 w-12 rounded-xl bg-white/90 p-1.5"
              priority
            />
            <div>
              <h1 className="text-lg font-semibold text-fg">Admin sign in</h1>
              <p className="mt-1 text-sm text-fg-muted">
                Sign in to manage Bester FC stats.
              </p>
            </div>
          </div>

          <LoginForm />
        </section>
      </div>
    </main>
  );
}
