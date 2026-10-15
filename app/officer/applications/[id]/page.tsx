import { Suspense } from "react";
import OfficerApplicationReview from "@/components/officer/OfficerApplicationReview";

export default async function Page({ params }: PageProps<"/officer/applications/[id]">) {
  const { id } = await params;
  return (
    <Suspense fallback={null}>
      <OfficerApplicationReview id={id} />
    </Suspense>
  );
}
