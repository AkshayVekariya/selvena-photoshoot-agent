import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "SELVENA Photoshoot Agent",
  description: "Jewelry product photography workflow"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
