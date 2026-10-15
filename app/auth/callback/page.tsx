import { connection } from "next/server";
import { Suspense } from "react";
import CallbackContent from "@/components/auth/CallbackContent";

export default async function AuthCallbackPage() {
  // Fully client-driven, interactive-only route. Opt out of static prerender.
  await connection();
  return (
    <Suspense fallback={null}>
      <CallbackContent />
    </Suspense>
  );
}
