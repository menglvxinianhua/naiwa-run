import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "奶蛙快跑 · 再跑亿次",
  description: "黄色奶蛙的像素跑酷。跳过障碍、低头躲鸟，和朋友一起挑战最高分。",
  other: {
    "codex-preview": "development",
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="antialiased">{children}</body>
    </html>
  );
}
