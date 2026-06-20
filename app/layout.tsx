import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Submit Your Project",
  description: "Tell us about the project you want to build.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-gray-50 text-gray-900 antialiased">{children}</body>
    </html>
  );
}
