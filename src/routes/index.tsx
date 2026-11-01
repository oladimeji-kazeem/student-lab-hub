import { createFileRoute, Link } from "@tanstack/react-router";
import { Logo, Button } from "@/components/ui-kit";
import { useStore, formatNaira } from "@/lib/store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "e-Lab — Run Python, R & VS Code in your browser" },
      {
        name: "description",
        content:
          "e-Lab empowers Nigerian students, lecturers, and researchers to run Python, R, and VS Code coding labs online with zero setup.",
      },
      {
        property: "og:title",
        content: "e-Lab — Cloud Computing & Coding Labs for Nigeria",
      },
      {
        property: "og:description",
        content:
          "Python, R, Jupyter notebooks and VS Code online in your browser. Tailored for Nigerian universities, colleges, and professionals.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  const plans = useStore((s) => s.plans);

  return (
    <div className="min-h-screen">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-4 sm:px-6 py-5">
        <Logo />
        <div className="flex items-center gap-2">
          <Link to="/login">
            <Button variant="ghost">Sign in</Button>
          </Link>
          <Link to="/register">
            <Button variant="lime">Get started</Button>
          </Link>
        </div>
      </header>

      <section className="mx-auto grid max-w-6xl items-center gap-10 px-4 sm:px-6 py-12 md:py-16 md:grid-cols-2">
        <div className="fade-up">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-lime/25 border border-lime/40 px-3 py-1 text-xs font-semibold text-primary">
            <span>🇳🇬</span> Zero local setup · Tailored for Nigerian Institutions
          </span>
          <h1 className="mt-5 text-4xl sm:text-5xl font-extrabold leading-tight text-primary md:text-6xl tracking-tight">
            Your school lab code,{" "}
            <span className="text-brand">running anywhere.</span>
          </h1>
          <p className="mt-5 text-base sm:text-lg text-muted-foreground leading-relaxed">
            Write and execute Python and R in interactive Jupyter notebooks or script consoles, or launch a full
            VS Code workspace right inside your browser. Download your code as <code className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded text-primary">.py</code>, <code className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded text-primary">.rdata</code>, <code className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded text-primary">.rda</code>, or <code className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded text-primary">.ipynb</code> with one click.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/register">
              <Button variant="lime" className="px-6 py-3 text-base shadow-glow">
                Create student account
              </Button>
            </Link>
            <Link to="/login">
              <Button variant="outline" className="px-6 py-3 text-base">
                I have an account
              </Button>
            </Link>
          </div>
        </div>

        <div className="rounded-2xl bg-editor p-1 shadow-glow fade-up">
          <div className="flex gap-1.5 px-3 py-2 border-b border-editor-panel">
            {[0, 1, 2].map((i) => (
              <span key={i} className="h-3 w-3 rounded-full bg-editor-panel" />
            ))}
            <span className="ml-2 font-mono text-xs text-muted-foreground opacity-60">
              student_lab.py
            </span>
          </div>
          <pre className="overflow-x-auto rounded-xl bg-editor-panel p-5 font-mono text-xs sm:text-sm text-editor-foreground">{`import numpy as np
data = np.random.normal(0, 1, 1000)
print(f"mean={data.mean():.3f}")

# R statistical calculation
# summary(lm(mpg ~ wt, data = mtcars))`}</pre>
          <div className="px-5 py-3 font-mono text-xs text-lime border-t border-editor-panel/50 flex items-center justify-between">
            <span>▶ mean=0.012 · completed in 0.4s</span>
            <span className="text-[11px] text-teal">export .ipynb / .rdata</span>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-5 px-4 sm:px-6 pb-16 sm:grid-cols-2 lg:grid-cols-4">
        {[
          [
            "Nigerian Local Data",
            "Public localised data for research, experiments and application testing.",
          ],
          [
            "Interactive Notebook",
            "Jupyter-style notebooks for Python & R with rich cell execution and .ipynb export.",
          ],
          [
            "Python Lab",
            "Python 3 with NumPy, Pandas and scientific computing in your browser. Export .py or .ipynb.",
          ],
          ["R Lab", "Full R runtime for statistics and coursework. Download as .R, .RData, or .rda."],
          [
            "VS Code Online",
            "Full developer environment with code editing, terminal commands, and multi-file workflows.",
          ],
        ].map(([t, d]) => (
          <div key={t} className="glass rounded-2xl p-6 shadow-card hover:translate-y-[-2px] transition">
            <div className="h-1.5 w-12 rounded-full bg-brand" />
            <h3 className="mt-4 text-lg font-bold text-primary">{t}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{d}</p>
          </div>
        ))}
      </section>

      <section className="mx-auto max-w-6xl px-4 sm:px-6 pb-20">
        <h2 className="text-2xl sm:text-3xl font-bold text-primary">How it works</h2>
        <ol className="mt-6 grid gap-4 sm:grid-cols-2 md:grid-cols-4">
          {[
            "Register with your School details",
            "Pay fee via Nigerian Bank Transfer (NUBAN)",
            "Log your transaction reference",
            "Admin approves, Access granted to lab manuals & start coding immediately",
          ].map((s, i) => (
            <li key={s} className="glass rounded-xl p-5 border border-border">
              <div className="font-mono text-2xl font-bold text-teal">0{i + 1}</div>
              <div className="mt-2 text-sm font-semibold text-primary">{s}</div>
            </li>
          ))}
        </ol>

        <h2 className="mt-14 text-2xl sm:text-3xl font-bold text-primary">Access Plans</h2>
        <p className="mt-1 text-sm text-muted-foreground">Affordable student pricing in Nigerian Naira (₦)</p>

        <div className="mt-6 grid gap-5 md:grid-cols-3">
          {plans.map((p) => (
            <div
              key={p.id}
              className="glass rounded-2xl p-6 shadow-card border border-border flex flex-col justify-between"
            >
              <div>
                <div className="font-semibold text-muted-foreground">{p.name}</div>
                <div className="mt-2 text-3xl sm:text-4xl font-extrabold text-primary">
                  {formatNaira(p.price)}
                </div>
                <div className="mt-2 text-xs font-medium text-teal">
                  {p.days} days access · {p.envs.map((e) => e.toUpperCase()).join(" + ")}
                </div>
              </div>
              <div className="mt-6">
                <Link to="/register" className="w-full block">
                  <Button variant="outline" className="w-full">
                    Choose {p.name}
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-border py-8 text-center text-sm text-muted-foreground">
        © 2026 e-Lab. Empowering Nigerian education and research with instant cloud computing.
      </footer>
    </div>
  );
}
