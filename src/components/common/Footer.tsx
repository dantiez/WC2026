import { Heart } from "lucide-react";

const YEAR = new Date().getFullYear();

export default function Footer() {
  return (
    <footer className="border-t border-border-default bg-surface-2 py-5 px-4 mt-8">
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-text-muted">
        <p className="flex items-center gap-1.5 uppercase tracking-wider font-bold">
          © {YEAR} Dan Nguyen Tien
          <span className="text-yellow-400">·</span>
          <span className="text-text-secondary">All rights reserved</span>
        </p>
        <p className="flex items-center gap-1.5">
          <span>Made with</span>
          <Heart className="w-3 h-3 fill-red-500 text-red-500" />
          <span>for WC2026 team orders</span>
        </p>
      </div>
    </footer>
  );
}
