"use client";

import React, { useState } from "react";
import Header from "@/components/header";
import { Settings, Eye, Copy, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function UserConfigure() {
  const [method, setMethod] = useState("GET");
  const [endpointUrl, setEndpointUrl] = useState("");

  const activeEndpoints = [
    {  endpoint: "/users/profile", status: "Active" },
    { endpoint: "/auth/login", status: "Active" },
    {  endpoint: "/users/:id/update", status: "Active" },
    { endpoint: "/posts/:slug", status: "Disabled" },
  ];


  const embedCode = `<iframe
  src="https://api.manager.io/embed/dashboard?key=7x2aBqz"
  width="100%"
  height="500"
  frameborder="0"
></iframe>`;

  return (
    <div >
      <Header
        icon={Settings}
        heading="Endpoint Configuration"
        description="Design and manage your public API interface"
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Configure" },
        ]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Add New Endpoint */}
          <Card>
            <CardHeader>
              <CardTitle>Add New Endpoint</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-3">
                <div className="flex-1">
                  <Label htmlFor="endpoint" className="text-xs">ENDPOINT URL</Label>
                  <Input
                    id="endpoint"
                    value={endpointUrl}
                    onChange={(e) => setEndpointUrl(e.target.value)}
                    placeholder="https://api.example.com/v1/resource"
                    className="mt-1"
                  />
                </div>
                <div className="flex items-end gap-2">
                  <Button variant="default">
                    <Eye className="h-4 w-4 mr-2" />
                    Preview
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Active Endpoints */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Active Endpoints</CardTitle>
                <span className="text-xs text-muted-foreground">
                  Total: {activeEndpoints.length} Active
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    {/* <TableHead className="text-xs">METHOD</TableHead> */}
                    <TableHead className="text-xs">ENDPOINT</TableHead>
                    <TableHead className="text-xs">STATUS</TableHead>
                    <TableHead className="text-xs">ACTIONS</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activeEndpoints.map((endpoint, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-mono text-sm">
                        {endpoint.endpoint}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div
                            className={`h-2 w-2 rounded-full ${
                              endpoint.status === "Active"
                                ? "bg-green-500"
                                : "bg-gray-400"
                            }`}
                          />
                          <span className="text-sm">{endpoint.status}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <span className="text-xl">⋮</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>Edit</DropdownMenuItem>
                            <DropdownMenuItem>Duplicate</DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive">
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Embed Iframe */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                <CardTitle className="text-base">Embed Iframe</CardTitle>
              </div>
              <CardDescription className="text-xs">
                Integrate your API dashboard directly into your existing internal
                tools or public documentation pages.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-slate-950 text-slate-50 p-4 rounded-lg font-mono text-xs overflow-x-auto">
                <pre>{embedCode}</pre>
              </div>
              <Button className="w-full" variant="default">
                <Copy className="h-4 w-4 mr-2" />
                Copy Snippet
              </Button>
            </CardContent>
          </Card>

          {/* Need Help */}
          <Alert>
            <AlertDescription>
              <div className="space-y-3">
                <h3 className="font-semibold">Need help?</h3>
                <p className="text-xs text-muted-foreground">
                  Check out our developer guides or chat with our automated
                  assistant for quick integration tips.
                </p>
                <Button variant="link" className="h-auto p-0 text-xs">
                  Go to Help Center →
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        </div>
      </div>
    </div>
  );
}