import { useEffect } from "react";
import { Ruler, X } from "lucide-react";

interface Props {
  onClose: () => void;
}

interface SizeRow {
  size: string;
  chest: string; // vòng ngực (cm)
  length: string; // dài áo (cm)
  fit: string; // chiều cao / cân nặng tham khảo
}

// Bảng size áo bóng đá người lớn — số đo THAM KHẢO, có thể chênh 2–3cm tuỳ xưởng in.
const SIZE_GUIDE: SizeRow[] = [
  { size: "S", chest: "88–92", length: "66", fit: "1m55–1m62 · 45–52kg" },
  { size: "M", chest: "92–96", length: "68", fit: "1m62–1m68 · 52–60kg" },
  { size: "L", chest: "96–100", length: "70", fit: "1m68–1m72 · 60–68kg" },
  { size: "XL", chest: "100–106", length: "72", fit: "1m72–1m76 · 68–76kg" },
  { size: "XXL", chest: "106–112", length: "74", fit: "1m76–1m80 · 76–85kg" },
  { size: "XXXL", chest: "112–118", length: "76", fit: "1m80+ · 85–95kg" },
];

export default function SizeGuideModal({ onClose }: Props) {
  // Close on Escape for keyboard users.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4 py-6"
      role="dialog"
      aria-modal="true"
      aria-label="Bảng size áo"
      onClick={onClose}
    >
      <div
        className="bg-surface-2 border border-border-default rounded-2xl w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="px-4 py-3 border-b border-border-default flex items-center justify-between gap-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-text-primary flex items-center gap-2">
            <Ruler className="w-4 h-4 text-yellow-400" />
            Bảng size áo
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            className="text-text-muted hover:text-text-primary"
          >
            <X className="w-4 h-4" />
          </button>
        </header>

        <div className="overflow-y-auto">
          <table className="w-full text-xs">
            <thead className="bg-surface-3 text-text-muted uppercase font-semibold tracking-wider text-[10px]">
              <tr>
                <th className="px-3 py-2 text-left w-14">Size</th>
                <th className="px-3 py-2 text-left">Ngực (cm)</th>
                <th className="px-3 py-2 text-left">Dài áo</th>
                <th className="px-3 py-2 text-left">Cao · Nặng</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-default">
              {SIZE_GUIDE.map((r) => (
                <tr key={r.size} className="hover:bg-surface-3/40">
                  <td className="px-3 py-2 font-black text-text-primary">{r.size}</td>
                  <td className="px-3 py-2 font-mono text-text-secondary">{r.chest}</td>
                  <td className="px-3 py-2 font-mono text-text-secondary">{r.length}</td>
                  <td className="px-3 py-2 text-text-muted">{r.fit}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="px-4 py-3 text-[11px] text-text-muted border-t border-border-default italic">
          Số đo chỉ mang tính tham khảo, có thể chênh 2–3cm tuỳ xưởng in. Nếu ở giữa 2 size,
          chọn size lớn hơn cho thoải mái.
        </p>
      </div>
    </div>
  );
}
