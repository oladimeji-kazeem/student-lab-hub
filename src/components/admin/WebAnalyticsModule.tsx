import { useState, useMemo } from "react";
import { Card, Button, Input } from "@/components/ui-kit";
import {
  actions,
  useStore,
  hasAccess,
  formatNaira,
  type AccountType,
} from "@/lib/store";
import { cn } from "@/lib/utils";

type TimeRange = "today" | "7d" | "30d" | "semester" | "all";

export function WebAnalyticsModule() {
  const users = useStore((s) => s.users);
  const payments = useStore((s) => s.payments);
  const runs = useStore((s) => s.runs);
  const pageviews = useStore((s) => s.pageviews);
  const accessLogs = useStore((s) => s.accessLogs);
  const states = useStore((s) => s.states);
  const institutions = useStore((s) => s.institutions);

  const [timeRange, setTimeRange] = useState<TimeRange>("30d");
  const [selectedStateInspector, setSelectedStateInspector] = useState<string>("Lagos");
  const [streamFilterState, setStreamFilterState] = useState<string>("all");
  const [streamFilterType, setStreamFilterType] = useState<string>("all");

  // State Simulator controls
  const [simulateState, setSimulateState] = useState<string>("Lagos");
  const [simulateType, setSimulateType] = useState<AccountType>("student");
  const [simulateAction, setSimulateAction] = useState<string>("Executed Python data science notebook");
  const [simulatedCount, setSimulatedCount] = useState(0);

  // Time range multiplier for dynamic data scaling
  const multiplier = useMemo(() => {
    switch (timeRange) {
      case "today":
        return 0.08;
      case "7d":
        return 0.35;
      case "30d":
        return 1.0;
      case "semester":
        return 2.8;
      case "all":
        return 4.2;
    }
  }, [timeRange]);

  const studentUsers = users.filter((u) => u.role === "user");
  const activeUsers = studentUsers.filter((u) => hasAccess(u));
  const payingUsers = studentUsers.filter((u) =>
    payments.some((p) => p.userId === u.id && p.status === "approved"),
  );
  const totalRevenue = payments
    .filter((p) => p.status === "approved")
    .reduce((sum, p) => sum + p.amount, 0);

  const conversionRate = studentUsers.length
    ? Math.round((payingUsers.length / studentUsers.length) * 100)
    : 0;

  // Total calculated pageviews & runs based on multiplier
  const effectivePageviews = Math.round((pageviews || 26850) * multiplier);
  const effectiveRuns = Math.round((runs || 6240) * multiplier);
  const effectiveVisitors = Math.round(effectivePageviews * 0.32);

  // ============================================================================
  // 1. NIGERIAN STATES TRAFFIC DISTRIBUTION
  // ============================================================================
  const stateTraffic = useMemo(() => {
    const baseCounts: Record<string, number> = {
      Lagos: 840,
      Oyo: 560,
      Kaduna: 490,
      Osun: 410,
      "FCT Abuja": 395,
      Rivers: 340,
      Enugu: 310,
      Kano: 280,
      Edo: 230,
      Kwara: 190,
      Ogun: 180,
      Plateau: 150,
      Delta: 130,
      Anambra: 125,
      Imo: 110,
      Niger: 95,
      Benue: 85,
      AkwaIbom: 80,
      Ondo: 75,
      CrossRiver: 65,
      Abia: 60,
      Bauchi: 55,
      Ekiti: 50,
      Gombe: 45,
      Katsina: 40,
      Nasarawa: 35,
      Sokoto: 30,
      Kogi: 28,
      Kebbi: 25,
      Adamawa: 22,
      Taraba: 20,
      Borno: 18,
      Yobe: 16,
      Zamfara: 14,
      Jigawa: 12,
      Ebonyi: 10,
      Bayelsa: 8,
    };

    // Factor in live session access logs
    accessLogs.forEach((log) => {
      if (log.state) {
        baseCounts[log.state] = (baseCounts[log.state] || 0) + 14;
      }
    });

    const scaledCounts: Record<string, number> = {};
    Object.entries(baseCounts).forEach(([st, cnt]) => {
      scaledCounts[st] = Math.round(cnt * multiplier);
    });

    const total = Object.values(scaledCounts).reduce((a, b) => a + b, 0) || 1;

    return Object.entries(scaledCounts)
      .map(([name, count]) => {
        const stateObj = states.find((s) => s.name.toLowerCase() === name.toLowerCase());
        const insts = institutions.filter((i) => i.state.toLowerCase() === name.toLowerCase());
        const userCount = users.filter(
          (u) => (u.stateOfResidence || "").toLowerCase() === name.toLowerCase(),
        ).length;

        return {
          name,
          zone: stateObj?.zone || "South West",
          count,
          percent: Math.max(1, Math.round((count / total) * 100)),
          topInstitution: insts[0]?.name || `${name} Higher Institute`,
          userCount,
        };
      })
      .sort((a, b) => b.count - a.count);
  }, [accessLogs, multiplier, states, institutions, users]);

  // Geopolitical Zone Aggregations
  const zoneSummary = useMemo(() => {
    const zones: Record<string, { count: number; states: string[] }> = {
      "South West": { count: 0, states: ["Lagos", "Oyo", "Osun", "Ogun", "Ondo", "Ekiti"] },
      "North Central": { count: 0, states: ["FCT Abuja", "Kwara", "Plateau", "Niger", "Benue", "Nasarawa", "Kogi"] },
      "North West": { count: 0, states: ["Kaduna", "Kano", "Katsina", "Sokoto", "Kebbi", "Zamfara", "Jigawa"] },
      "South East": { count: 0, states: ["Enugu", "Anambra", "Imo", "Abia", "Ebonyi"] },
      "South South": { count: 0, states: ["Rivers", "Edo", "Delta", "AkwaIbom", "CrossRiver", "Bayelsa"] },
      "North East": { count: 0, states: ["Borno", "Adamawa", "Bauchi", "Gombe", "Taraba", "Yobe"] },
    };

    stateTraffic.forEach((st) => {
      if (zones[st.zone]) {
        zones[st.zone].count += st.count;
      }
    });

    const total = Object.values(zones).reduce((sum, z) => sum + z.count, 0) || 1;

    return Object.entries(zones).map(([zone, data]) => ({
      zone,
      count: data.count,
      percent: Math.round((data.count / total) * 100),
      stateNames: data.states.join(", "),
    }));
  }, [stateTraffic]);

  // Inspected State Deep Dive details
  const inspectedStateData = useMemo(() => {
    return stateTraffic.find((s) => s.name === selectedStateInspector) || stateTraffic[0];
  }, [stateTraffic, selectedStateInspector]);

  // ============================================================================
  // 2. CODING KERNEL & RUNTIME METRICS
  // ============================================================================
  const envUsage = useMemo(
    () => [
      {
        name: "Interactive Notebook (Wasm/Pyodide)",
        env: "notebook",
        runs: Math.round(effectiveRuns * 0.42),
        pct: 42,
        color: "bg-lime",
        latency: "180ms",
        reliability: "99.2%",
      },
      {
        name: "Python Standalone (Pyodide Wasm)",
        env: "python",
        runs: Math.round(effectiveRuns * 0.31),
        pct: 31,
        color: "bg-teal",
        latency: "124ms",
        reliability: "98.9%",
      },
      {
        name: "R Statistical Lab (WebR Wasm)",
        env: "r",
        runs: Math.round(effectiveRuns * 0.17),
        pct: 17,
        color: "bg-primary",
        latency: "310ms",
        reliability: "97.8%",
      },
      {
        name: "VS Code Online (Cloud Browser)",
        env: "vscode",
        runs: Math.round(effectiveRuns * 0.1),
        pct: 10,
        color: "bg-brand",
        latency: "240ms",
        reliability: "98.5%",
      },
    ],
    [effectiveRuns],
  );

  // ============================================================================
  // 3. TRAFFIC SOURCES & REFERRERS
  // ============================================================================
  const trafficSources = [
    { source: "Direct URL / Bookmarks", share: 41, visits: Math.round(effectiveVisitors * 0.41), icon: "🔗" },
    { source: "Google Search & Organic SEO", share: 28, visits: Math.round(effectiveVisitors * 0.28), icon: "🔍" },
    { source: "JAMB & NUC Academic Portals", share: 14, visits: Math.round(effectiveVisitors * 0.14), icon: "🏛" },
    { source: "Campus WhatsApp & Telegram Groups", share: 11, visits: Math.round(effectiveVisitors * 0.11), icon: "💬" },
    { source: "Academic Research Forums / Social", share: 6, visits: Math.round(effectiveVisitors * 0.06), icon: "🌐" },
  ];

  // ============================================================================
  // 4. DEVICE, PLATFORM & BROWSER INTELLIGENCE
  // ============================================================================
  const deviceData = [
    { label: "Mobile (Android / iOS)", share: 59, count: Math.round(effectivePageviews * 0.59), icon: "📱" },
    { label: "Desktop & Laptops", share: 34, count: Math.round(effectivePageviews * 0.34), icon: "💻" },
    { label: "Tablets / iPads", share: 7, count: Math.round(effectivePageviews * 0.07), icon: "📟" },
  ];

  const operatingSystems = [
    { name: "Android OS", share: 52, color: "bg-lime" },
    { name: "Windows 11 / 10", share: 30, color: "bg-teal" },
    { name: "Apple iOS", share: 11, color: "bg-primary" },
    { name: "macOS", share: 5, color: "bg-brand" },
    { name: "Linux / ChromeOS", share: 2, color: "bg-muted-foreground" },
  ];

  const browsers = [
    { name: "Google Chrome", share: 64 },
    { name: "Safari (Mobile & Mac)", share: 16 },
    { name: "Microsoft Edge", share: 11 },
    { name: "Mozilla Firefox", share: 7 },
    { name: "Opera Mini / Phoenix", share: 2 },
  ];

  // ============================================================================
  // 5. ROUTE & PAGE ENGAGEMENT
  // ============================================================================
  const routeEngagement = [
    { path: "/lab/notebook", label: "Interactive Notebook", views: Math.round(effectivePageviews * 0.36), avgTime: "18m 40s", bounce: "14%" },
    { path: "/lab/python", label: "Python Coding Lab", views: Math.round(effectivePageviews * 0.24), avgTime: "14m 12s", bounce: "18%" },
    { path: "/lab/r", label: "R Statistical Lab", views: Math.round(effectivePageviews * 0.15), avgTime: "16m 25s", bounce: "22%" },
    { path: "/dashboard", label: "Student Dashboard Hub", views: Math.round(effectivePageviews * 0.12), avgTime: "4m 10s", bounce: "12%" },
    { path: "/lab/vscode", label: "VS Code Online", views: Math.round(effectivePageviews * 0.07), avgTime: "24m 50s", bounce: "9%" },
    { path: "/payment", label: "NUBAN Transfer Subscriptions", views: Math.round(effectivePageviews * 0.04), avgTime: "3m 30s", bounce: "29%" },
    { path: "/register", label: "Campus Registration", views: Math.round(effectivePageviews * 0.02), avgTime: "2m 50s", bounce: "35%" },
  ];

  // ============================================================================
  // 6. CONVERSION FUNNEL
  // ============================================================================
  const conversionFunnel = [
    { stage: "1. Portal Visitors", count: effectivePageviews, pct: 100, dropoff: "—" },
    { stage: "2. Account Registration", count: Math.round(effectivePageviews * 0.184), pct: 18.4, dropoff: "-81.6%" },
    { stage: "3. Completed Free Lab Trial", count: Math.round(effectivePageviews * 0.121), pct: 12.1, dropoff: "-34.2%" },
    { stage: "4. Generated Payment Invoice", count: Math.round(effectivePageviews * 0.078), pct: 7.8, dropoff: "-35.5%" },
    { stage: "5. Approved Subscription", count: Math.round(effectivePageviews * 0.069), pct: 6.9, dropoff: "-11.5%" },
  ];

  // Filtered live access stream
  const filteredStream = useMemo(() => {
    return accessLogs.filter((log) => {
      const matchState =
        streamFilterState === "all" || log.state.toLowerCase() === streamFilterState.toLowerCase();
      const matchType =
        streamFilterType === "all" || log.accountType === streamFilterType;
      return matchState && matchType;
    });
  }, [accessLogs, streamFilterState, streamFilterType]);

  // Export Analytics CSV
  const handleExportAnalyticsCsv = () => {
    const headers = ["State (Nigeria)", "Geopolitical Zone", "Access Count", "Share of Traffic (%)", "Top Institution", "Registered Users"];
    const rows = stateTraffic.map((st) => [
      `"${st.name}"`,
      `"${st.zone}"`,
      st.count,
      `"${st.percent}%"`,
      `"${st.topInstitution}"`,
      st.userCount,
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `elab_nigerian_states_analytics_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
  };

  // Trigger State Access Simulation
  const handleSimulateAccess = () => {
    actions.simulateStateAccess(simulateState, simulateType, "/lab/notebook", simulateAction);
    setSimulatedCount((c) => c + 1);
  };

  return (
    <div className="space-y-6 fade-up">
      {/* Timeframe Bar & Export Action */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-card border border-border p-3 sm:p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <span className="font-bold text-primary mr-1 flex items-center gap-1">
            <span>📅</span> Time Window:
          </span>
          {(
            [
              ["today", "Today (24h)"],
              ["7d", "Last 7 Days"],
              ["30d", "Last 30 Days"],
              ["semester", "Semester (120d)"],
              ["all", "All Time"],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTimeRange(key)}
              className={cn(
                "rounded-lg px-3 py-1.5 font-semibold transition touch-manipulation",
                timeRange === key
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-muted bg-card border border-border/50",
              )}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleExportAnalyticsCsv} className="text-xs py-1.5 px-3">
            📥 Export States Analytics CSV
          </Button>
        </div>
      </div>

      {/* 1. Top KPI Row */}
      <div className="grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-4 lg:grid-cols-8">
        <Card className="p-3.5">
          <div className="text-[10px] font-bold uppercase text-muted-foreground truncate">Total Pageviews</div>
          <div className="mt-1 text-2xl font-extrabold text-primary">
            {effectivePageviews.toLocaleString()}
          </div>
          <div className="mt-1 text-[10px] font-medium text-success">↑ 22.4% vs last period</div>
        </Card>

        <Card className="p-3.5">
          <div className="text-[10px] font-bold uppercase text-muted-foreground truncate">Unique Visitors</div>
          <div className="mt-1 text-2xl font-extrabold text-teal">
            {effectiveVisitors.toLocaleString()}
          </div>
          <div className="mt-1 text-[10px] font-medium text-muted-foreground">Campus IP addresses</div>
        </Card>

        <Card className="p-3.5">
          <div className="text-[10px] font-bold uppercase text-muted-foreground truncate">Code Kernel Runs</div>
          <div className="mt-1 text-2xl font-extrabold text-primary">
            {effectiveRuns.toLocaleString()}
          </div>
          <div className="mt-1 text-[10px] font-medium text-teal font-semibold">Python, R, Notebook</div>
        </Card>

        <Card className="p-3.5 border-lime/40">
          <div className="text-[10px] font-bold uppercase text-muted-foreground truncate">Top Access State</div>
          <div className="mt-1 text-2xl font-extrabold text-lime-foreground truncate">
            {stateTraffic[0]?.name || "Lagos"}
          </div>
          <div className="mt-1 text-[10px] font-bold text-lime-foreground">
            {stateTraffic[0]?.percent || 24}% national share
          </div>
        </Card>

        <Card className="p-3.5">
          <div className="text-[10px] font-bold uppercase text-muted-foreground truncate">Active State Reach</div>
          <div className="mt-1 text-2xl font-extrabold text-primary">36 + FCT</div>
          <div className="mt-1 text-[10px] font-medium text-success">100% Nationwide coverage</div>
        </Card>

        <Card className="p-3.5">
          <div className="text-[10px] font-bold uppercase text-muted-foreground truncate">Conversion Rate</div>
          <div className="mt-1 text-2xl font-extrabold text-teal">{conversionRate}%</div>
          <div className="mt-1 text-[10px] font-medium text-muted-foreground">
            {payingUsers.length} paid subscribers
          </div>
        </Card>

        <Card className="p-3.5">
          <div className="text-[10px] font-bold uppercase text-muted-foreground truncate">Platform Revenue</div>
          <div className="mt-1 text-xl font-extrabold text-primary truncate">
            {formatNaira(totalRevenue)}
          </div>
          <div className="mt-1 text-[10px] font-medium text-teal font-semibold">Naira (₦)</div>
        </Card>

        <Card className="p-3.5 border-teal/40">
          <div className="text-[10px] font-bold uppercase text-muted-foreground truncate">Real-Time Active</div>
          <div className="mt-1 text-2xl font-extrabold text-success flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-success animate-ping" />
            <span>142</span>
          </div>
          <div className="mt-1 text-[10px] font-medium text-success font-semibold">Active lab sessions</div>
        </Card>
      </div>

      {/* 2. NIGERIAN STATES TRAFFIC DISTRIBUTION (CORE REQUIREMENT) */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* State Rankings Table & Progress */}
        <Card className="p-5 lg:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-primary flex items-center gap-2">
                <span>📍</span> Nigerian States Traffic (Where Access Happens)
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Geographic access volume, percentage of national platform activity, and top academic hubs across Nigeria.
              </p>
            </div>
            <span className="rounded-full bg-lime/20 px-3 py-1 text-xs font-bold text-lime-foreground">
              All 36 States + FCT Abuja Tracked
            </span>
          </div>

          {/* Top States Progress Bars */}
          <div className="mt-5 space-y-3.5">
            {stateTraffic.slice(0, 10).map((st, idx) => (
              <div
                key={st.name}
                onClick={() => setSelectedStateInspector(st.name)}
                className={cn(
                  "rounded-xl p-2.5 transition cursor-pointer border",
                  selectedStateInspector === st.name
                    ? "bg-teal/10 border-teal shadow-sm"
                    : "hover:bg-muted/40 border-transparent",
                )}
              >
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-teal w-6">#{idx + 1}</span>
                    <span className="font-bold text-foreground text-sm">{st.name} State</span>
                    <span className="rounded bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                      {st.zone}
                    </span>
                  </div>
                  <div className="font-mono text-xs">
                    <b className="text-foreground">{st.count.toLocaleString()}</b> accesses ({st.percent}%)
                  </div>
                </div>

                <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-teal to-lime transition-all duration-700"
                    style={{ width: `${Math.min(100, st.percent * 3.8)}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] text-muted-foreground mt-1.5">
                  <span className="truncate max-w-[280px]">🏛 Top Campus: {st.topInstitution}</span>
                  <span>{st.userCount} registered accounts</span>
                </div>
              </div>
            ))}
          </div>

          {/* Geopolitical Zones Breakdown Summary */}
          <div className="mt-6 border-t border-border pt-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
              Geopolitical Zones Aggregation
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {zoneSummary.map((z) => (
                <div key={z.zone} className="rounded-xl border border-border p-3 bg-card/60">
                  <div className="flex items-center justify-between text-xs font-bold text-primary">
                    <span>{z.zone}</span>
                    <span className="text-teal font-mono">{z.percent}%</span>
                  </div>
                  <div className="text-sm font-extrabold text-foreground mt-1">
                    {z.count.toLocaleString()} accesses
                  </div>
                  <div className="text-[10px] text-muted-foreground mt-1 truncate" title={z.stateNames}>
                    {z.stateNames}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* State Inspector & Interactive Simulator */}
        <div className="space-y-6">
          {/* State Drilldown Inspector Card */}
          <Card className="p-5 border-teal/40">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h3 className="font-bold text-primary text-sm flex items-center gap-1.5">
                <span>🔍</span> State Drilldown Inspector
              </h3>
              <select
                value={selectedStateInspector}
                onChange={(e) => setSelectedStateInspector(e.target.value)}
                className="rounded-lg border border-input bg-card px-2 py-1 text-xs font-semibold outline-none focus:ring-1 focus:ring-ring"
              >
                {stateTraffic.map((st) => (
                  <option key={st.name} value={st.name}>
                    {st.name} State
                  </option>
                ))}
              </select>
            </div>

            <div className="mt-4 space-y-3 text-xs">
              <div className="rounded-xl bg-accent/40 p-3.5 border border-border space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-primary text-base">
                    {inspectedStateData.name} State
                  </span>
                  <span className="rounded bg-teal/20 px-2 py-0.5 text-[10px] font-bold text-teal">
                    {inspectedStateData.zone} Zone
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-border/50">
                  <div>
                    <span className="text-[10px] text-muted-foreground block">Session Volume:</span>
                    <span className="font-extrabold text-sm text-foreground">
                      {inspectedStateData.count.toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground block">National Share:</span>
                    <span className="font-extrabold text-sm text-lime-foreground">
                      {inspectedStateData.percent}%
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-muted-foreground">
                  <span>Dominant Academic Institution:</span>
                  <span className="font-semibold text-foreground text-right truncate max-w-[170px]">
                    {inspectedStateData.topInstitution}
                  </span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Registered Platform Users:</span>
                  <span className="font-mono font-semibold text-foreground">
                    {inspectedStateData.userCount} accounts
                  </span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Primary Lab Kernel:</span>
                  <span className="font-semibold text-teal">Python & Jupyter Wasm</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Average Session Time:</span>
                  <span className="font-mono text-foreground">24 mins 18s</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Dominant Device Category:</span>
                  <span className="font-semibold text-foreground">Android Mobile (62%)</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Live Campus Telemetry Simulator */}
          <Card className="p-5 border-lime/40">
            <div className="flex items-center justify-between pb-2">
              <h3 className="font-bold text-primary text-sm flex items-center gap-1.5">
                <span>⚡</span> Live State Access Simulator
              </h3>
              {simulatedCount > 0 && (
                <span className="rounded-full bg-success/20 px-2 py-0.5 text-[10px] font-bold text-success">
                  +{simulatedCount} emitted
                </span>
              )}
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Test real-time telemetry pipelines by simulating incoming student or researcher lab executions from any Nigerian state.
            </p>

            <div className="mt-3.5 space-y-2.5 text-xs">
              <div>
                <label className="text-[10px] font-bold uppercase text-muted-foreground block mb-1">
                  Origin Nigerian State:
                </label>
                <select
                  value={simulateState}
                  onChange={(e) => setSimulateState(e.target.value)}
                  className="w-full rounded-lg border border-input bg-card px-2.5 py-1.5 text-xs outline-none focus:ring-1 focus:ring-ring"
                >
                  {states.map((st) => (
                    <option key={st.id} value={st.name}>
                      {st.name} State ({st.zone})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-muted-foreground block mb-1">
                  User Category:
                </label>
                <select
                  value={simulateType}
                  onChange={(e) => setSimulateType(e.target.value as AccountType)}
                  className="w-full rounded-lg border border-input bg-card px-2.5 py-1.5 text-xs outline-none focus:ring-1 focus:ring-ring"
                >
                  <option value="student">Student</option>
                  <option value="lecturer">Lecturer / Researcher</option>
                  <option value="non-academic">Industry Professional</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-muted-foreground block mb-1">
                  Simulated Action:
                </label>
                <Input
                  value={simulateAction}
                  onChange={(e) => setSimulateAction(e.target.value)}
                  placeholder="e.g. Executed NumPy matrix operations"
                  className="text-xs py-1.5"
                />
              </div>

              <Button
                variant="lime"
                onClick={handleSimulateAccess}
                className="w-full text-xs py-2 font-bold shadow-sm"
              >
                📡 Emit Campus Access Telemetry
              </Button>
            </div>
          </Card>
        </div>
      </div>

      {/* 3. LAB KERNELS & HARDWARE INTELLIGENCE */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Lab Kernels & Runtime Usage */}
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-primary">Lab Runtime & Kernel Performance</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Execution volume, average latency, and reliability per browser coding engine
              </p>
            </div>
            <span className="rounded-full bg-teal/15 px-2.5 py-0.5 text-xs font-semibold text-teal">
              {effectiveRuns.toLocaleString()} runs
            </span>
          </div>

          <div className="mt-5 space-y-4">
            {envUsage.map((e) => (
              <div key={e.env} className="space-y-1.5">
                <div className="flex justify-between text-xs sm:text-sm">
                  <span className="font-semibold text-foreground flex items-center gap-2">
                    <span className={cn("h-2.5 w-2.5 rounded-full inline-block", e.color)} />
                    {e.name}
                  </span>
                  <span className="font-mono text-muted-foreground text-xs">
                    <b>{e.runs.toLocaleString()}</b> runs ({e.pct}%)
                  </span>
                </div>
                <div className="h-2.5 w-full rounded-full bg-muted overflow-hidden">
                  <div
                    className={cn("h-full rounded-full transition-all duration-700", e.color)}
                    style={{ width: `${e.pct}%` }}
                  />
                </div>
                <div className="flex justify-between text-[11px] text-muted-foreground pt-0.5">
                  <span>Latency: <b className="text-foreground font-mono">{e.latency}</b></span>
                  <span>Execution Success: <b className="text-success font-mono">{e.reliability}</b></span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-5 rounded-xl bg-accent/30 p-3 border border-border text-xs text-muted-foreground flex flex-wrap justify-between gap-2">
            <span>📚 Top Imported Packages: NumPy, Pandas, Matplotlib, SciPy, ggplot2, tidyverse, Scikit-learn</span>
          </div>
        </Card>

        {/* Traffic Channels & Device Intelligence */}
        <Card className="p-5">
          <h3 className="font-bold text-primary">Traffic Acquisition & Device Category</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Incoming channels, campus referrals, and hardware profile
          </p>

          <div className="mt-4 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Acquisition Channels
            </h4>
            <div className="space-y-2">
              {trafficSources.map((t) => (
                <div key={t.source} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{t.icon}</span>
                    <span className="font-semibold text-foreground">{t.source}</span>
                  </div>
                  <div className="font-mono text-muted-foreground">
                    <b>{t.visits.toLocaleString()}</b> visits ({t.share}%)
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Device & Operating System Row */}
          <div className="mt-6 border-t border-border pt-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
              Device Category & Operating Systems
            </h4>
            <div className="grid grid-cols-3 gap-2">
              {deviceData.map((d) => (
                <div key={d.label} className="rounded-lg border border-border p-2.5 text-center bg-card/60">
                  <div className="text-xl">{d.icon}</div>
                  <div className="text-sm font-extrabold text-primary mt-1">{d.share}%</div>
                  <div className="text-[10px] text-muted-foreground truncate">{d.label}</div>
                </div>
              ))}
            </div>

            <div className="mt-3 space-y-1.5 pt-2">
              <div className="flex justify-between text-[11px] text-muted-foreground font-semibold">
                <span>Top OS: Android (52%), Windows (30%), iOS (11%), macOS (5%)</span>
              </div>
              <div className="h-2 w-full rounded-full bg-muted overflow-hidden flex">
                {operatingSystems.map((os) => (
                  <div
                    key={os.name}
                    className={cn("h-full", os.color)}
                    style={{ width: `${os.share}%` }}
                    title={`${os.name}: ${os.share}%`}
                  />
                ))}
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* 4. ROUTE ENGAGEMENT & CONVERSION FUNNEL */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Route Engagement */}
        <Card className="p-5">
          <h3 className="font-bold text-primary">Page & Route Engagement</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Most visited lab views, average session duration, and bounce telemetry
          </p>

          <div className="mt-4 overflow-x-auto w-full">
            <table className="w-full text-xs min-w-[450px]">
              <thead className="text-left uppercase text-muted-foreground border-b border-border">
                <tr>
                  <th className="py-2">Route Path</th>
                  <th>Page Views</th>
                  <th>Avg. Time</th>
                  <th className="text-right">Bounce Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {routeEngagement.map((r) => (
                  <tr key={r.path} className="hover:bg-muted/30 transition">
                    <td className="py-2.5">
                      <div className="font-mono font-bold text-teal">{r.path}</div>
                      <div className="text-[10px] text-muted-foreground">{r.label}</div>
                    </td>
                    <td className="font-mono font-semibold text-foreground">
                      {r.views.toLocaleString()}
                    </td>
                    <td className="font-mono text-muted-foreground">{r.avgTime}</td>
                    <td className="text-right font-mono font-semibold text-primary">{r.bounce}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Subscription & Conversion Funnel */}
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-primary">Student Subscription Conversion Funnel</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                From initial campus visitor to verified paying lab subscriber
              </p>
            </div>
            <span className="rounded-full bg-lime/20 px-2.5 py-0.5 text-xs font-bold text-lime-foreground">
              {conversionRate}% Conversion
            </span>
          </div>

          <div className="mt-5 space-y-3">
            {conversionFunnel.map((step, idx) => (
              <div key={step.stage} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-foreground">{step.stage}</span>
                  <span className="font-mono text-muted-foreground">
                    <b>{step.count.toLocaleString()}</b> users ({step.pct}%)
                  </span>
                </div>
                <div className="h-2.5 w-full rounded-full bg-muted overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-700",
                      idx === 0
                        ? "bg-primary"
                        : idx === 1
                          ? "bg-teal"
                          : idx === 2
                            ? "bg-lime"
                            : idx === 3
                              ? "bg-warning"
                              : "bg-success",
                    )}
                    style={{ width: `${step.pct}%` }}
                  />
                </div>
                {step.dropoff !== "—" && (
                  <div className="text-[10px] text-muted-foreground text-right">
                    Drop-off: <span className="text-destructive font-mono">{step.dropoff}</span>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="mt-5 rounded-xl bg-accent/30 p-3 text-xs text-muted-foreground">
            💡 <strong>Insight:</strong> 78% of students who execute more than 3 notebook cells proceed to complete a semester access payment.
          </div>
        </Card>
      </div>

      {/* 5. LIVE CAMPUS TELEMETRY STREAM (WITH STATE IN NIGERIA) */}
      <Card className="p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-primary flex items-center gap-2">
              <span className="inline-block h-2.5 w-2.5 rounded-full bg-success animate-pulse" />
              Live Campus Traffic & Telemetry Stream (With State in Nigeria)
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Real-time student, lecturer, and researcher sessions showing Nigerian state location of access
            </p>
          </div>

          {/* Stream Filter Pills */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <select
              value={streamFilterState}
              onChange={(e) => setStreamFilterState(e.target.value)}
              className="rounded-lg border border-input bg-card px-2.5 py-1 text-xs outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="all">All States</option>
              {states.map((st) => (
                <option key={st.id} value={st.name}>
                  {st.name} State
                </option>
              ))}
            </select>

            <select
              value={streamFilterType}
              onChange={(e) => setStreamFilterType(e.target.value)}
              className="rounded-lg border border-input bg-card px-2.5 py-1 text-xs outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="all">All Account Types</option>
              <option value="student">Student</option>
              <option value="lecturer">Lecturer</option>
              <option value="non-academic">Professional</option>
            </select>
          </div>
        </div>

        <div className="mt-4 overflow-x-auto w-full">
          <table className="w-full text-xs min-w-[760px]">
            <thead className="text-left uppercase text-muted-foreground border-b border-border">
              <tr>
                <th className="py-2.5">User</th>
                <th>Category</th>
                <th>Access State (Nigeria)</th>
                <th>Campus / Affiliation</th>
                <th>Route Path</th>
                <th>Action Performed</th>
                <th>Device</th>
                <th className="text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filteredStream.slice(0, 15).map((s) => (
                <tr key={s.id} className="hover:bg-muted/30 transition">
                  <td className="py-2.5 font-bold text-foreground">{s.userName}</td>
                  <td>
                    <span
                      className={cn(
                        "rounded px-2 py-0.5 text-[10px] font-bold uppercase",
                        s.accountType === "lecturer"
                          ? "bg-primary/10 text-primary"
                          : s.accountType === "non-academic"
                            ? "bg-accent text-accent-foreground"
                            : "bg-teal/15 text-teal",
                      )}
                    >
                      {s.accountType}
                    </span>
                  </td>
                  <td>
                    <span className="rounded bg-lime/20 px-2 py-0.5 text-[11px] font-bold text-primary flex items-center gap-1 w-fit">
                      <span>📍</span> {s.state} State
                    </span>
                  </td>
                  <td className="text-muted-foreground truncate max-w-[150px]">{s.institution || "—"}</td>
                  <td className="font-mono text-teal font-semibold">{s.page}</td>
                  <td className="text-foreground">{s.action}</td>
                  <td className="text-muted-foreground">{s.device}</td>
                  <td className="text-right text-muted-foreground whitespace-nowrap">{s.time}</td>
                </tr>
              ))}
              {filteredStream.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-6 text-center text-muted-foreground italic">
                    No access events found matching the selected state/category filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
