"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Zap,
  Globe,
  Database,
  MessageSquare,
  CheckCircle2,
  ArrowRight,
  Loader2,
} from "lucide-react";
import Header from "@/components/header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Line, LineChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { getAllEndpointConfigs } from "@/app/(main)/configure/action";
import type { EndpointConfig, ScrapedEndpoint } from "@/app/(main)/configure/action";

// ── Types ─────────────────────────────────────────────────────────────────────
type ActiveConfig = EndpointConfig & { scraped_endpoints: ScrapedEndpoint[] };

// ── Chart data ────────────────────────────────────────────────────────────────
const chartData = [
  { day: "Day 1",  chats: 250  },
  { day: "Day 5",  chats: 350  },
  { day: "Day 10", chats: 1000 },
  { day: "Day 15", chats: 1400 },
  { day: "Day 20", chats: 850  },
  { day: "Day 25", chats: 1500 },
  { day: "Day 30", chats: 1650 },
];

const chartConfig = {
  chats: { label: "Chats", color: "#ff6b35" },
};

// ── Steps ─────────────────────────────────────────────────────────────────────
const STEPS = [
  {
    number: 1,
    icon: Globe,
    title: "Configure URL",
    description:
      "Go to Configuration and enter your website URL endpoint so we know where to pull your data from.",
  },
  {
    number: 2,
    icon: Database,
    title: "Data Scrape",
    description:
      "Our system automatically scrapes and indexes your data in the background — no action needed from you.",
  },
  {
    number: 3,
    icon: MessageSquare,
    title: "Test Chatbot",
    description:
      "Open the chatbot widget and ask a question. It will respond using your indexed content.",
  },
  {
    number: 4,
    icon: CheckCircle2,
    title: "Go Live",
    description:
      "Embed the chatbot snippet on your website and start automating customer interactions instantly.",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Instructions view
// ─────────────────────────────────────────────────────────────────────────────
function InstructionsDashboard() {
  return (
    <div className="space-y-6">
      <Header
        icon={Zap}
        heading="Chatbot Dashboard"
        description="Complete the setup to activate your chatbot"
        breadcrumbs={[{ label: "Dashboard" }]}
      />

      <Card>
        <CardHeader>
          <CardTitle>Launch Your Chatbot</CardTitle>
          <CardDescription>
            Follow these four steps to configure and deploy your chatbot.
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {STEPS.map((step) => {
          const Icon = step.icon;
          return (
            <Card key={step.number} className="flex flex-col">
              <CardHeader className="flex flex-col items-center text-center space-y-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-md border text-sm font-semibold">
                  {step.number}
                </div>
                <Icon className="h-5 w-5 text-muted-foreground" />
                <CardTitle className="text-base">{step.title}</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-sm text-muted-foreground">{step.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="flex justify-end">
        <Button onClick={() => (window.location.href = "/configure")}>
          Go to Configuration
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Analytics dashboard
// ─────────────────────────────────────────────────────────────────────────────
function AnalyticsDashboard() {
  return (
    <div className="space-y-1">
      <Header
        icon={BarChart3}
        heading="Chatbot Dashboard"
        description="ANALYTICS OVERVIEW"
        breadcrumbs={[{ label: "Analytics" }]}
        specialButtons={
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Button variant="outline" className="text-sm">
              Last 30 Days
            </Button>
            <Button size="sm">Export Report</Button>
          </div>
        }
      />

      <div className="space-y-5">
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {[
            { label: "Total Chats",      value: "1,284",  delta: "+12%", up: true  },
            { label: "Question Count",   value: "856",    delta: "+5%",  up: true  },
            { label: "Navigation Count", value: "428",    delta: "-2%",  up: false },
            { label: "Avg. Session",     value: "2m 45s", delta: "+10%", up: true  },
            { label: "Satisfaction",     value: "88%",    delta: "+3%",  up: true  },
          ].map((kpi) => (
            <Card key={kpi.label}>
              <CardHeader>
                <CardDescription>{kpi.label}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{kpi.value}</div>
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                  {kpi.up ? (
                    <TrendingUp className="h-3 w-3 text-green-500" />
                  ) : (
                    <TrendingDown className="h-3 w-3 text-red-500" />
                  )}
                  <span className={kpi.up ? "text-green-500" : "text-red-500"}>
                    {kpi.delta}
                  </span>
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle>Chatbot Activity</CardTitle>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm">Hours</Button>
                <Button variant="ghost" size="sm">Days</Button>
                <Button variant="ghost" size="sm">Months</Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={chartConfig}
              className="h-[200px] sm:h-[250px] w-full"
            >
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="day" tickLine={false} axisLine={false} className="text-xs" />
                <YAxis tickLine={false} axisLine={false} className="text-xs" />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line
                  type="monotone"
                  dataKey="chats"
                  stroke="#ff6b35"
                  strokeWidth={2}
                  dot={{ fill: "#ff6b35", r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Root export
//
// A config is only considered "active" when BOTH conditions hold:
//   1. endpoint_configs has a row with status = "active"  AND
//   2. that row has at least one scraped_endpoints child row
//
// This dual guard means:
//   • After deleteAllScrapedEndpoints() removes the config rows  → false
//   • After deleteScrapedEndpoint() removes the last child       → false
//   • Even if a stale config row survives somehow               → false
// ─────────────────────────────────────────────────────────────────────────────
export default function UserDashboard() {
  const [hasActiveConfig, setHasActiveConfig] = useState<boolean | null>(null);

  const checkConfig = useCallback(async () => {
    try {
      const response = await getAllEndpointConfigs();

      const configs: ActiveConfig[] =
        response.success && Array.isArray(response.data) ? response.data : [];

      // Dual guard:
      //   Guard 1 — configs array must be non-empty (action already filters status="active")
      //   Guard 2 — at least one config must have ≥1 scraped_endpoint child
      //             (handles the case where config row exists but all children deleted)
      const hasActive = configs.some(
        (c) =>
          typeof c.full_url === "string" &&
          c.full_url.trim().length > 0 &&
          Array.isArray(c.scraped_endpoints) &&
          c.scraped_endpoints.length > 0
      );

      setHasActiveConfig(hasActive);
    } catch {
      setHasActiveConfig(false);
    }
  }, []);

  useEffect(() => {
    checkConfig();
  }, [checkConfig]);

  if (hasActiveConfig === null) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return hasActiveConfig ? <AnalyticsDashboard /> : <InstructionsDashboard />;
}