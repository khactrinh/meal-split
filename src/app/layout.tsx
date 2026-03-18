import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";
import { Providers } from "@/components/Providers";
import AuthHeader from "@/components/AuthHeader";

export const metadata: Metadata = {
  title: "Meal Split - Chia tiền nhanh chóng",
  description: "Ứng dụng chia tiền khi đi ăn chuyên nghiệp",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body>
        <Providers>
          <div className="container">
            <header className="flex justify-between items-center flex-mobile-col" style={{ 
              padding: "1rem 0",
              borderBottom: "1px solid var(--border)",
              marginBottom: "2rem"
            }}>
              <Link href="/" style={{ fontSize: "1.5rem", fontWeight: "700", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span>💸</span> Meal Split
              </Link>
              <AuthHeader />
            </header>
            <main>
              {children}
            </main>
          </div>
        </Providers>
      </body>
    </html>
  );
}
