import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "场景词汇点读｜听见每一个词",
  description: "914 个大学英语听力场景词汇，点击即可发音，支持搜索、分类、收藏和随机练习。",
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
      <body>{children}</body>
    </html>
  );
}
