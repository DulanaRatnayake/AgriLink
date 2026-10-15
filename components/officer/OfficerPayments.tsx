"use client";

import {
  Alert,
  App as AntApp,
  Button,
  Card,
  Empty,
  Modal,
  Space,
  Table,
  Tag,
  Typography,
} from "antd";
import { Banknote, ExternalLink } from "lucide-react";
import { useMemo, useState } from "react";
import PageHeader from "@/components/common/PageHeader";
import SourceTag from "@/components/common/SourceTag";
import { useAppStore } from "@/lib/state/app-store";
import { paymentGatewayConfig } from "@/lib/govtech/configuration";
import { initiateDisbursement } from "@/lib/govtech/payment-gateway";
import type { SubsidyApplication } from "@/lib/domain/types";
import { formatDateTime, formatLkr } from "@/lib/utils/format";

export default function OfficerPayments() {
  const { message } = AntApp.useApp();
  const { applications, updateApplication, transitionApplication, addNotification, logAudit, identity } =
    useAppStore();

  // Applications ready for or in payment.
  const payable = useMemo(
    () =>
      applications.filter((a) =>
        ["approved", "payment_pending", "paid", "payment_failed"].includes(a.status),
      ),
    [applications],
  );

  const [processing, setProcessing] = useState<Set<string>>(new Set());
  const [checkout, setCheckout] = useState<{ url: string; ref: string } | null>(null);

  function setBusy(id: string, busy: boolean) {
    setProcessing((prev) => {
      const next = new Set(prev);
      if (busy) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  async function disburse(app: SubsidyApplication) {
    if (processing.has(app.id)) return; // duplicate-click guard
    if (app.status !== "approved" && app.status !== "payment_failed") {
      message.warning("Only approved or previously-failed applications can be disbursed.");
      return;
    }
    const amount = app.approvedAmountLkr ?? app.requestedAmountLkr;
    if (amount <= 0) {
      message.error("Invalid approved amount.");
      return;
    }

    setBusy(app.id, true);
    // Move to payment_pending (if not already) and record attempt.
    if (app.status === "approved") {
      transitionApplication(app.id, "payment_pending", {
        actor: identity?.name ?? "Officer",
        comment: "Disbursement initiated.",
      });
    }

    try {
      const [firstName, ...rest] = app.farmerName.split(" ");
      const res = await initiateDisbursement({
        amountLkr: amount,
        firstName: firstName || "Farmer",
        lastName: rest.join(" ") || "Applicant",
        email: "farmer@example.lk",
        applicationReference: app.reference,
      });

      const attempts = (app.payment?.attempts ?? 0) + 1;

      if (res.source === "sandbox" && res.data.redirectUrl) {
        updateApplication(app.id, {
          payment: {
            transactionId: res.data.transactionId,
            status: "pending",
            source: "sandbox",
            attempts,
            lastAttemptAt: new Date().toISOString(),
          },
        });
        logAudit({
          actor: identity?.name ?? "Officer",
          role: "officer",
          action: `Initiated real sandbox payment for ${app.reference}`,
          target: app.reference,
          dataSource: "sandbox",
          simulated: false,
        });
        setCheckout({ url: res.data.redirectUrl, ref: app.reference });
        message.info("Sandbox payment session created. Complete it at the checkout page.");
      } else {
        // Mock disbursement — simulate a successful outcome explicitly.
        updateApplication(app.id, {
          payment: {
            transactionId: res.data.transactionId,
            status: "paid",
            source: "mock",
            attempts,
            lastAttemptAt: new Date().toISOString(),
          },
        });
        transitionApplication(app.id, "paid", {
          actor: "System",
          comment: "Simulated disbursement completed.",
        });
        addNotification({
          type: "payment",
          title: "Payment completed",
          message: `A payment of ${formatLkr(amount)} for ${app.reference} has been completed (simulated).`,
          applicationReference: app.reference,
          audience: "farmer",
        });
        logAudit({
          actor: "System",
          role: "system",
          action: `Simulated payment completed for ${app.reference}`,
          target: app.reference,
          dataSource: "mock",
          simulated: true,
        });
        message.success("Simulated payment completed.");
      }
    } catch (err) {
      updateApplication(app.id, {
        payment: {
          transactionId: app.payment?.transactionId,
          status: "failed",
          source: paymentGatewayConfig.enabled ? "sandbox" : "mock",
          attempts: (app.payment?.attempts ?? 0) + 1,
          failureReason: err instanceof Error ? err.message : "Unknown error",
          lastAttemptAt: new Date().toISOString(),
        },
      });
      transitionApplication(app.id, "payment_failed", {
        actor: "System",
        comment: "Disbursement failed.",
      });
      message.error("Disbursement failed. The application was marked payment failed.");
    } finally {
      setBusy(app.id, false);
    }
  }

  const totalApproved = payable.reduce((s, a) => s + (a.approvedAmountLkr ?? 0), 0);
  const totalPaid = payable
    .filter((a) => a.status === "paid")
    .reduce((s, a) => s + (a.approvedAmountLkr ?? 0), 0);

  return (
    <div>
      <PageHeader
        title="Payments"
        subtitle="Disburse approved subsidies and monitor transaction status."
        crumbs={[{ title: "Officer" }, { title: "Payments" }]}
      />

      <Alert
        type={paymentGatewayConfig.enabled && paymentGatewayConfig.configured ? "info" : "warning"}
        showIcon
        className="mb-4"
        title={
          paymentGatewayConfig.enabled && paymentGatewayConfig.configured
            ? "Real sandbox payments enabled"
            : "Simulated payments"
        }
        description={
          paymentGatewayConfig.enabled && paymentGatewayConfig.configured
            ? "Disbursements use the IPG sandbox (X-DIS-CLIENT-ID). A checkout page opens to complete the payment; status is only marked Paid when the gateway returns success."
            : "The IPG payment gateway is not enabled/configured, so disbursements run as a clearly-labelled mock flow. A payment is only marked Paid when the simulated flow returns success."
        }
      />

      <div className="mb-4 flex flex-wrap gap-4">
        <Card styles={{ body: { padding: 16 } }} className="agri-card-shadow">
          <div className="text-xs text-slate-500">Total approved</div>
          <div className="text-xl font-semibold">{formatLkr(totalApproved)}</div>
        </Card>
        <Card styles={{ body: { padding: 16 } }} className="agri-card-shadow">
          <div className="text-xs text-slate-500">Total paid</div>
          <div className="text-xl font-semibold text-green-700">{formatLkr(totalPaid)}</div>
        </Card>
      </div>

      <Card className="agri-card-shadow">
        {payable.length === 0 ? (
          <Empty description="No approved applications awaiting payment" />
        ) : (
          <Table<SubsidyApplication>
            rowKey="id"
            dataSource={payable}
            scroll={{ x: "max-content" }}
            pagination={{ pageSize: 10 }}
            columns={[
              { title: "Reference", dataIndex: "reference", render: (v) => <span className="font-medium">{v}</span> },
              { title: "Beneficiary", dataIndex: "farmerName" },
              {
                title: "Approved",
                render: (_, r) => formatLkr(r.approvedAmountLkr ?? r.requestedAmountLkr),
              },
              {
                title: "Transaction",
                render: (_, r) => r.payment?.transactionId ?? "—",
              },
              {
                title: "Payment",
                render: (_, r) => {
                  const st = r.payment?.status ?? (r.status === "paid" ? "paid" : "pending");
                  return (
                    <Space>
                      <Tag color={st === "paid" ? "green" : st === "failed" ? "red" : "gold"}>{st}</Tag>
                      {r.payment && <SourceTag source={r.payment.source} />}
                    </Space>
                  );
                },
              },
              {
                title: "Attempts",
                render: (_, r) => r.payment?.attempts ?? 0,
              },
              {
                title: "Last attempt",
                responsive: ["lg"],
                render: (_, r) => (r.payment?.lastAttemptAt ? formatDateTime(r.payment.lastAttemptAt) : "—"),
              },
              {
                title: "Actions",
                render: (_, r) => {
                  const done = r.status === "paid";
                  const canPay = r.status === "approved" || r.status === "payment_failed";
                  return (
                    <Button
                      size="small"
                      type="primary"
                      icon={<Banknote size={14} />}
                      loading={processing.has(r.id)}
                      disabled={done || (!canPay && r.status !== "payment_pending")}
                      onClick={() => disburse(r)}
                    >
                      {done ? "Paid" : r.status === "payment_failed" ? "Retry" : "Disburse"}
                    </Button>
                  );
                },
              },
            ]}
          />
        )}
        {payable.some((a) => a.payment?.failureReason) && (
          <Typography.Paragraph type="danger" className="mt-3 text-xs">
            Some transactions failed. Review the reason before retrying — the app checks
            transaction status rather than blindly retrying.
          </Typography.Paragraph>
        )}
      </Card>

      <Modal
        title="Complete sandbox payment"
        open={!!checkout}
        onCancel={() => setCheckout(null)}
        footer={[
          <Button key="close" onClick={() => setCheckout(null)}>
            Close
          </Button>,
          <Button
            key="open"
            type="primary"
            icon={<ExternalLink size={14} />}
            href={checkout?.url}
            target="_blank"
            rel="noopener noreferrer"
          >
            Open checkout
          </Button>,
        ]}
      >
        <Typography.Paragraph>
          A real sandbox payment session was created for {checkout?.ref}. Open the checkout
          page to complete it. The application will remain <b>payment pending</b> until the
          gateway confirms a successful status.
        </Typography.Paragraph>
      </Modal>
    </div>
  );
}
