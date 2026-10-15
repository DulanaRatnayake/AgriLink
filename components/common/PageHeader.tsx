"use client";

import { Breadcrumb, Typography } from "antd";
import Link from "next/link";
import type { ReactNode } from "react";

export interface Crumb {
  title: string;
  href?: string;
}

export default function PageHeader({
  title,
  subtitle,
  crumbs,
  extra,
}: {
  title: string;
  subtitle?: string;
  crumbs?: Crumb[];
  extra?: ReactNode;
}) {
  return (
    <div className="mb-6">
      {crumbs && crumbs.length > 0 && (
        <Breadcrumb
          className="mb-2"
          items={crumbs.map((c) => ({
            title: c.href ? <Link href={c.href}>{c.title}</Link> : c.title,
          }))}
        />
      )}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Typography.Title level={3} style={{ margin: 0 }}>
            {title}
          </Typography.Title>
          {subtitle && (
            <Typography.Text type="secondary" className="block mt-1">
              {subtitle}
            </Typography.Text>
          )}
        </div>
        {extra && <div className="flex items-center gap-2">{extra}</div>}
      </div>
    </div>
  );
}
