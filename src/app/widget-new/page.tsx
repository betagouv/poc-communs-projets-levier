"use client";

import init from "@socialgouv/matomo-next";
import { useEffect } from "react";
import { WidgetGrist } from "@/app/widget-new/_components/WidgetGrist";

export default function WidgetPage() {
  useEffect(() => {
    init({ url: "https://stats.beta.gouv.fr/", siteId: "184", disableCookies: true });
  }, []);

  return <WidgetGrist />;
}
