import { Suspense } from "react";
import FarmerApplicationDetail from "@/components/farmer/FarmerApplicationDetail";

export default async function Page({ params }: PageProps<"/farmer/applications/[id]">) {
  const { id } = await params;
  return (
    <Suspense fallback={null}>
      <FarmerApplicationDetail id={id} />
    </Suspense>
  );
}
