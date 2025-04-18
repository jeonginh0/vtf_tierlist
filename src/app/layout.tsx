import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "VTF 티어리스트",
  description: "VTF 에이전트 티어리스트",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
