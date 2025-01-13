"use client";

import { GristAnalyzer } from "@/app/widget/GristAnalyzer";
import init from "@socialgouv/matomo-next";
import { useEffect } from "react";

export default function WidgetPage() {
  useEffect(() => {
    init({ url: "https://stats.beta.gouv.fr/", siteId: "184", disableCookies: true });
  }, []);

  return <GristAnalyzer />;
}
