import Link from "next/link";
import { Sprout } from "lucide-react";
import LandingContent from "@/components/landing/LandingContent";

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2.5">
            <span className="agri-gradient flex h-9 w-9 items-center justify-center rounded-xl text-white">
              <Sprout size={20} />
            </span>
            <div className="leading-tight">
              <div className="text-base font-semibold text-slate-900">AgriLink</div>
              <div className="text-[10px] uppercase tracking-wider text-slate-500">
                Smart Agriculture Subsidy Platform
              </div>
            </div>
          </div>
          <Link
            href="/login"
            className="rounded-lg bg-green-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-green-800"
          >
            Sign in
          </Link>
        </div>
      </header>
      <LandingContent />
    </div>
  );
}
