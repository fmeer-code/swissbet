// src/app/layout.tsx
import "./globals.css";
import Link from "next/link";
import NavAuthActions from "@/components/NavAuthActions";
import AdminNavLink from "@/components/AdminNavLink";

export const metadata = {
  title: "PredictIQ (MVP)",
  description: "Play-money intelligence prediction game",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="app-shell">
        <header className="border-b border-[var(--color-border-subtle)] bg-[var(--color-bg-elevated)]">
          <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-3 px-4 py-3">
            <Link href="/" className="text-sm font-semibold">
              PredictIQ
            </Link>
            <nav className="flex flex-1 flex-wrap items-center justify-end gap-6 text-xs">
              <div className="flex flex-wrap items-center gap-5">
                <Link className="nav-link" href="/">
                  Markets
                </Link>
                <Link className="nav-link" href="/leaderboard">
                  Leaderboard
                </Link>
                <AdminNavLink />
              </div>
              <div className="flex items-center gap-2 border-l border-[var(--color-border-subtle)] pl-3">
                <NavAuthActions />
              </div>
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
      </body>
    </html>
  );
}
