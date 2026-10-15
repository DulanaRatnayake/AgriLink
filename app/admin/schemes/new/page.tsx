import { Suspense } from "react";
import SchemeForm from "@/components/admin/SchemeForm";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <SchemeForm />
    </Suspense>
  );
}
