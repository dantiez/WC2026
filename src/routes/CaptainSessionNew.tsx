import { FormEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, ArrowLeft } from "lucide-react";
import { api } from "../lib/api";
import type { Product } from "../types";

export default function CaptainSessionNew() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [deadlineAt, setDeadlineAt] = useState("");
  const [defaultProductId, setDefaultProductId] = useState<string>("");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.products
      .list()
      .then(setProducts)
      .catch((err) => setError(err instanceof Error ? err.message : "Lỗi tải sản phẩm"));
  }, []);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const team = await api.teams.create({
        name: name.trim(),
        defaultProductId: defaultProductId || null,
        deadlineAt: deadlineAt ? new Date(deadlineAt).toISOString() : null,
      });
      navigate(`/captain/teams/${team.id}`, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không tạo được team.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-surface-base px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <button
          type="button"
          onClick={() => navigate("/captain")}
          className="text-xs text-text-muted hover:text-text-primary flex items-center gap-1.5 mb-4"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Về dashboard
        </button>

        <form
          onSubmit={submit}
          className="bg-surface-2 border border-border-default rounded-2xl p-6 flex flex-col gap-5"
        >
          <header>
            <h1 className="text-lg font-black uppercase tracking-wide text-text-primary">
              Tạo đợt đặt áo mới
            </h1>
            <p className="text-xs text-text-muted">
              Sau khi tạo, bạn sẽ có một link share cho cả team.
            </p>
          </header>

          <label className="flex flex-col gap-1.5">
            <span className="text-[11px] uppercase font-bold tracking-wider text-text-muted">
              Tên team
            </span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="VD: GenBeta WC2026"
              className="bg-surface-3 border border-border-default rounded-lg px-3 py-2.5 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400"
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-[11px] uppercase font-bold tracking-wider text-text-muted">
              Hạn chốt đơn (tuỳ chọn)
            </span>
            <input
              type="datetime-local"
              value={deadlineAt}
              onChange={(e) => setDeadlineAt(e.target.value)}
              className="bg-surface-3 border border-border-default rounded-lg px-3 py-2.5 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400"
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-[11px] uppercase font-bold tracking-wider text-text-muted">
              Mẫu áo mặc định (tuỳ chọn)
            </span>
            <select
              value={defaultProductId}
              onChange={(e) => setDefaultProductId(e.target.value)}
              className="bg-surface-3 border border-border-default rounded-lg px-3 py-2.5 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400"
            >
              <option value="">— Để teammate tự chọn —</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>

          {error ? (
            <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
              {error}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            className="bg-yellow-500 hover:bg-yellow-400 disabled:opacity-60 text-black font-black uppercase text-sm rounded-lg py-3 flex items-center justify-center gap-2 transition-colors"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {loading ? "Đang tạo…" : "Tạo team"}
          </button>
        </form>
      </div>
    </main>
  );
}
