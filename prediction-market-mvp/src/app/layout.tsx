// src/app/layout.tsx
import "./globals.css";
import Link from "next/link";
import NavAuthActions from "@/components/NavAuthActions";
import AdminNavLink from "@/components/AdminNavLink";
import Navbar from "@/components/Navbar";

export const metadata = {
  title: "Predict (MVP)",
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
        <Navbar
          brand={
            <Link href="/" className="text-sm font-semibold">
              Predict_LOGO
            </Link>
          }
          links={
            <>
              <Link className="nav-link" href="/">
                Markets
              </Link>
              <Link className="nav-link" href="/leaderboard">
                Leaderboard
              </Link>
              <AdminNavLink />
            </>
          }
          actions={<NavAuthActions />}
        />
        <main className="mx-auto max-w-5xl px-5 py-6 page-stack">{children}</main>
      </body>
    </html>
  );
}
