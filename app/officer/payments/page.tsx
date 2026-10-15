import { Suspense } from "react";
import OfficerPayments from "@/components/officer/OfficerPayments";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <OfficerPayments />
    </Suspense>
  );
}
