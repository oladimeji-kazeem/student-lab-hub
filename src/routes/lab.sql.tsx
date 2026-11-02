import { createFileRoute } from "@tanstack/react-router";
import { SqlLab } from "@/components/SqlLab";

export const Route = createFileRoute("/lab/sql")({
  head: () => ({
    meta: [
      { title: "SQL Server Lab — e-Lab" },
      {
        name: "description",
        content: "Run SQL Server, T-SQL and relational database queries online in your browser.",
      },
      { property: "og:title", content: "SQL Server Lab — e-Lab" },
      {
        property: "og:description",
        content: "Interactive SQL queries, schema explorer, and database practice.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SqlLab,
});
