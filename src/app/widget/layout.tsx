"use client";

import Script from "next/script";

export default function WidgetLayout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <head>
        <Script strategy={"beforeInteractive"} src="https://docs.getgrist.com/grist-plugin-api.js" />
      </head>
      <body>{children}</body>
    </html>
  );
}
