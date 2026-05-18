import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Micro-RAG — 우리 모임 전용 AI 지식창고",
  description:
    "카톡처럼 툭 던지면 1초 만에 AI가 학습하는 소규모 모임 전용 데이터 주입기.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
