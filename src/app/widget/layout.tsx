"use client";

import Script from "next/script";

export default function WidgetLayout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <head>
        <Script strategy="beforeInteractive" src="https://docs.getgrist.com/grist-plugin-api.js" />
        {process.env.NODE_ENV === "production" && (
          <Script id="matomo" strategy="afterInteractive">{`var _paq = window._paq = window._paq || [];
          /* tracker methods like "setCustomDimension" should be called before "trackPageView" */
          _paq.push(['trackPageView']);
          _paq.push(['enableLinkTracking']);
          (function() {
          var u="https://stats.beta.gouv.fr/";
          _paq.push(['setTrackerUrl', u+'matomo.php']);
          _paq.push(['setSiteId', '184']);
          var d=document, g=d.createElement('script'), s=d.getElementsByTagName('script')[0];
          g.async=true; g.src=u+'matomo.js'; s.parentNode.insertBefore(g,s);
        })()`}</Script>
        )}
      </head>
      <body>{children}</body>
    </html>
  );
}
