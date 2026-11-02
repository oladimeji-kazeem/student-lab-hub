import { createFileRoute } from "@tanstack/react-router";
import { ResourceLibrary } from "@/components/ResourceLibrary";

export const Route = createFileRoute("/resources")({
  head: () => ({
    meta: [
      { title: "Resource Library & Lab Manuals — e-Lab" },
      {
        name: "description",
        content:
          "Access course textbooks, practical lab manuals, and datasets from Google Drive & OneDrive.",
      },
      { property: "og:title", content: "Resource Library & Lab Manuals — e-Lab" },
      {
        property: "og:description",
        content:
          "Textbooks, lab manuals, and cloud dataset links for Python, R, and SQL.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ResourceLibrary,
});

