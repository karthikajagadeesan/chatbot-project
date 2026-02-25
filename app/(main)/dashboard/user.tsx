"use client";

import React from "react";
import { BarChart3, TrendingUp } from "lucide-react";
import Header from "@/components/header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Line, LineChart, CartesianGrid, XAxis, YAxis } from "recharts";

const chartData = [
  { day: "Day 1", chats: 250 },
  { day: "Day 5", chats: 350 },
  { day: "Day 10", chats: 1000 },
  { day: "Day 15", chats: 1400 },
  { day: "Day 20", chats: 850 },
  { day: "Day 25", chats: 1500 },
  { day: "Day 30", chats: 1650 },
];

const chartConfig = {
  chats: {
    label: "Chats",
    color: "#ff6b35", 
  },
};

export default function UserDashboard() {
  return (
    <div className="space-y-1">
      <Header
        icon={BarChart3}
        heading="Chatbot Dashboard"
        description="ANALYTICS OVERVIEW"
        breadcrumbs={[
          { label: "Analytics" },
        ]}
        specialButtons={
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Button variant="outline" className="text-sm">
              Last 30 Days
            </Button>   
            <Button size="sm">
              Export Report
            </Button>
          </div>
        }
      />

<div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader>
            <CardDescription>Total Chats</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,284</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
              <TrendingUp className="h-3 w-3 text-green-500" />
              <span className="text-green-500">+12%</span>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardDescription>Question Count</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">856</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
              <TrendingUp className="h-3 w-3 text-green-500" />
              <span className="text-green-500">+5%</span>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardDescription>Navigation Count</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">428</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
              <span className="text-red-500">-2%</span>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardDescription>Avg. Session</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2m 45s</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
              <TrendingUp className="h-3 w-3 text-green-500" />
              <span className="text-green-500">+10%</span>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardDescription>Satisfaction</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">88%</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
              <TrendingUp className="h-3 w-3 text-green-500" />
              <span className="text-green-500">+3%</span>
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Chatbot Activity</CardTitle>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm">Hours</Button>
              <Button variant="ghost" size="sm">Days</Button>
              <Button variant="ghost" size="sm">Months</Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[200px] sm:h-[250px] w-full">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="day"
                tickLine={false}
                axisLine={false}
                className="text-xs"
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                className="text-xs"
              />
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