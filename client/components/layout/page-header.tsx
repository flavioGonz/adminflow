"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

type Crumb = {
  label: string;
  href?: string;
  icon?: React.ReactNode;
};

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  breadcrumbs?: Crumb[];
  backHref?: string;
  actions?: React.ReactNode;
  leadingIcon?: React.ReactNode;
  breadcrumbAction?: React.ReactNode;
}

export function PageHeader({ title, subtitle, breadcrumbs = [], backHref, actions, leadingIcon, breadcrumbAction }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            {leadingIcon ? <span className="text-slate-800">{leadingIcon}</span> : null}
            <h1 className="text-2xl font-semibold text-slate-900">{title}</h1>
          </div>
          {subtitle ? (
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          ) : null}
        </div>
        {actions ? (
          <div className="flex flex-wrap items-center gap-2">{actions}</div>
        ) : null}
      </div>
      {backHref || breadcrumbs.length > 0 ? (
        <div className="flex items-center justify-between gap-2 text-sm text-slate-600">
          <div className="flex items-center gap-2">
            {backHref ? (
              <Link href={backHref}>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-700">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
            ) : null}
            {breadcrumbs.map((crumb, index) => {
              const isLast = index === breadcrumbs.length - 1;
              return (
                <div key={`${crumb.label}-${index}`} className="flex items-center gap-2">
                  {index > 0 && <span>/</span>}
                  {crumb.href && !isLast ? (
                    <Link href={crumb.href} className="flex items-center gap-1 hover:underline">
                      <span className="text-slate-400 animate-pulse">{crumb.icon ?? "•"}</span>
                      {crumb.label}
                    </Link>
                  ) : (
                    <span className={`flex items-center gap-1 ${isLast ? "font-semibold text-slate-800" : ""}`}>
                      <span className="text-slate-400 animate-pulse">{crumb.icon ?? "•"}</span>
                      {crumb.label}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
          {breadcrumbAction}
        </div>
      ) : null}
    </div>
  );
}
