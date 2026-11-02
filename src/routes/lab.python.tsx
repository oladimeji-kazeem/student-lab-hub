import { createFileRoute } from "@tanstack/react-router";
import { CodeLab } from "@/components/CodeLab";

export const Route = createFileRoute("/lab/python")({
  head: () => ({
    meta: [
      { title: "Python Lab — GardiaLab" },
      { name: "description", content: "Run Python 3 code online in your browser." },
      { property: "og:title", content: "Python Lab — GardiaLab" },
      { property: "og:description", content: "Python in the browser, no install." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <CodeLab
      env="python"
      title="Python Lab"
      starter={`import numpy as np

data = np.random.normal(loc=50, scale=10, size=500)
print("Mean:", round(data.mean(), 2))
print("Std :", round(data.std(), 2))

for i in range(3):
    print(f"Trial {i+1}: {np.random.randint(1, 100)}")
`}
    />
  ),
});
