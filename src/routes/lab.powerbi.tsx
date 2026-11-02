import { createFileRoute } from "@tanstack/react-router";
import { PowerBiLab } from "@/components/PowerBiLab";

export const Route = createFileRoute("/lab/powerbi")({
  head: () => ({
    meta: [
      { title: "Power BI & Analytics Lab — GardiaLab" },
      {
        name: "description",
        content:
          "Power BI studio with downloadable starter datasets, exercise briefs, and sample embedded reports.",
      },
      { property: "og:title", content: "Power BI & Analytics Lab — GardiaLab" },
      {
        property: "og:description",
        content:
          "Master business intelligence, interactive dashboards, DAX measures, and data modeling.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PowerBiLab,
});

