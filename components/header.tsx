"use client";

import React from "react";
import { LucideIcon, Home } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import Link from "next/link";

export interface BreadcrumbItemType {
  label: string;
  href?: string;
}

interface HeaderProps {
  icon?: LucideIcon;
  heading: string;
  description?: string;
  breadcrumbs?: BreadcrumbItemType[];
  className?: string;
  specialButtons?: React.ReactNode;
}

export default function Header({
  icon: Icon,
  heading,
  description,
  breadcrumbs,
  className,
  specialButtons,
}: HeaderProps) {

  return (
    <div className={cn("flex flex-col", className)}>

      {/* Header Content */}
      <div className="flex items-center justify-between gap-3 border-b pb-3">
        <div className="flex items-center gap-3">
          {Icon && (
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
              <Icon className="h-5 w-5 text-current" />
            </div>
          )}
          <div className="flex flex-col">
            <h1 className="text-xl font-semibold tracking-tight">{heading}</h1>
            {description && (
              <p className="text-xs text-muted-foreground">{description}</p>
            )}
          </div>
        </div>
        <div className="flex-1 flex justify-end">
          {specialButtons}
        </div>
      </div>

      {/* Breadcrumb */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <Breadcrumb className="my-3 mx-2">
          <BreadcrumbList className="text-xs">
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/dashboard" className="text-xs hover:text-foreground">
                  <Home className="h-3.5 w-3.5" />
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            {breadcrumbs.map((item, index) => {
              const isLast = index === breadcrumbs.length - 1;
              return (
                <React.Fragment key={index}>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    {isLast || !item.href ? (
                      <BreadcrumbPage className="text-xs text-gray-500">{item.label}</BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink asChild>
                        <Link href={item.href} className="text-xs hover:text-foreground">
                          {item.label}
                        </Link>
                      </BreadcrumbLink>
                    )}
                  </BreadcrumbItem>
                </React.Fragment>
              );
            })}
          </BreadcrumbList>
        </Breadcrumb>
      )}

    </div>
  );
}

