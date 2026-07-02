import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LearnIt - AI Academic Operating System",
  description: "Know what to study next, what you are forgetting, and whether you are ready for the exam."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
