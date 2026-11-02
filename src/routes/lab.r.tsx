import { createFileRoute } from "@tanstack/react-router";
import { CodeLab } from "@/components/CodeLab";

export const Route = createFileRoute("/lab/r")({
  head: () => ({
    meta: [
      { title: "R Lab — GardiaLab" },
      { name: "description", content: "Run R code online for statistics labs." },
      { property: "og:title", content: "R Lab — GardiaLab" },
      { property: "og:description", content: "R in the browser, no install." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <CodeLab
      env="r"
      title="R Lab"
      starter={`x <- rnorm(100, mean = 50, sd = 10)
summary(x)

model <- lm(mpg ~ wt, data = mtcars)
coef(model)
`}
    />
  ),
});
