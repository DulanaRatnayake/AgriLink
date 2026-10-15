import { Suspense } from "react";
import ApplicationWizard from "@/components/farmer/wizard/ApplicationWizard";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <ApplicationWizard />
    </Suspense>
  );
}
