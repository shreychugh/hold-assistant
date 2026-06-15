import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Hold Assistant",
  description: "We wait on hold. You don't.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
