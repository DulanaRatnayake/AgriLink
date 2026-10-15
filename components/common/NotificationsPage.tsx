"use client";

import { Button, Card, Empty, List, Tag } from "antd";
import { Bell, BellOff } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";
import PageHeader from "@/components/common/PageHeader";
import { useAppStore } from "@/lib/state/app-store";
import type { NotificationType, Role } from "@/lib/domain/types";
import { formatDateTime } from "@/lib/utils/format";

const TYPE_COLORS: Record<NotificationType, string> = {
  submission: "blue",
  evidence_request: "orange",
  verification_outcome: "cyan",
  decision: "geekblue",
  payment: "green",
  appeal: "purple",
};

const TYPE_LABELS: Record<NotificationType, string> = {
  submission: "Submission",
  evidence_request: "Evidence request",
  verification_outcome: "Verification",
  decision: "Decision",
  payment: "Payment",
  appeal: "Appeal",
};

export default function NotificationsPage({ audience }: { audience: Role }) {
  const { notifications, markNotificationRead, markAllNotificationsRead } = useAppStore();
  const mine = useMemo(
    () =>
      notifications
        .filter((n) => n.audience === audience)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [notifications, audience],
  );
  const unread = mine.filter((n) => !n.read).length;
  const basePath = audience === "farmer" ? "/farmer/applications" : "/officer/applications";

  return (
    <div>
      <PageHeader
        title="Notifications"
        subtitle={unread > 0 ? `You have ${unread} unread notification${unread > 1 ? "s" : ""}.` : "You're all caught up."}
        crumbs={[{ title: audience === "farmer" ? "Farmer" : "Officer" }, { title: "Notifications" }]}
        extra={
          <Button
            icon={<BellOff size={15} />}
            disabled={unread === 0}
            onClick={() => markAllNotificationsRead(audience)}
          >
            Mark all read
          </Button>
        }
      />

      <Card className="agri-card-shadow">
        {mine.length === 0 ? (
          <Empty description="No notifications" />
        ) : (
          <List
            dataSource={mine}
            renderItem={(n) => (
              <List.Item
                className={n.read ? "" : "bg-green-50/50"}
                actions={[
                  !n.read ? (
                    <Button key="read" type="link" size="small" onClick={() => markNotificationRead(n.id)}>
                      Mark read
                    </Button>
                  ) : (
                    <span key="read" className="text-xs text-slate-400">
                      Read
                    </span>
                  ),
                ]}
              >
                <List.Item.Meta
                  avatar={
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                      <Bell size={16} />
                    </span>
                  }
                  title={
                    <span className="flex flex-wrap items-center gap-2">
                      {n.title}
                      <Tag color={TYPE_COLORS[n.type]}>{TYPE_LABELS[n.type]}</Tag>
                      {!n.read && <Tag color="green">New</Tag>}
                    </span>
                  }
                  description={
                    <div className="text-sm text-slate-600">
                      <div>{n.message}</div>
                      <div className="mt-0.5 text-xs text-slate-400">
                        {formatDateTime(n.createdAt)}
                        {n.applicationReference && (
                          <>
                            {" · "}
                            <Link href={basePath}>{n.applicationReference}</Link>
                          </>
                        )}
                      </div>
                    </div>
                  }
                />
              </List.Item>
            )}
          />
        )}
      </Card>
    </div>
  );
}
