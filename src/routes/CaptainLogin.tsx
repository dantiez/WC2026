import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ShieldAlert, Loader2 } from "lucide-react";
import { api } from "../lib/api";

interface Props {
  onLoggedIn: () => Promise<void> | void;
}

export default function CaptainLogin({ onLoggedIn }: Props) {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await api.auth.login(email.trim(), password);
      await onLoggedIn();
      navigate("/captain", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Đăng nhập thất bại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-surface-base px-4">
      <form
        onSubmit={submit}
        className="w-full max-w-md bg-surface-2 border border-border-default rounded-2xl p-8 shadow-2xl flex flex-col gap-5"
      >
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
            <ShieldAlert className="w-5 h-5 text-yellow-400" />
          </div>
          <div>
            <h1 className="text-lg font-black text-text-primary uppercase tracking-wide">
              Đăng nhập Captain
            </h1>
            <p className="text-xs text-text-muted">
              Tạo và quản lý đợt đặt áo cho team.
            </p>
          </div>
        </div>

        <label className="flex flex-col gap-1.5">
          <span className="text-[11px] uppercase font-bold tracking-wider text-text-muted">
            Email
          </span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoFocus
            className="bg-surface-3 border border-border-default rounded-lg px-3 py-2.5 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400"
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-[11px] uppercase font-bold tracking-wider text-text-muted">
            Mật khẩu
          </span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="bg-surface-3 border border-border-default rounded-lg px-3 py-2.5 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400"
          />
        </label>

        {error ? (
          <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
            {error}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={loading}
          className="bg-yellow-500 hover:bg-yellow-400 disabled:opacity-60 disabled:cursor-not-allowed text-black font-black uppercase tracking-wider text-sm rounded-lg py-3 flex items-center justify-center gap-2 transition-colors"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          {loading ? "Đang đăng nhập…" : "Đăng nhập"}
        </button>
      </form>
    </main>
  );
}
