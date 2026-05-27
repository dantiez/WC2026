import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Plus,
  LogOut,
  Loader2,
  Clock,
  Lock,
  Unlock,
  Trash2,
  Store,
} from "lucide-react";
import { api } from "../lib/api";
import type { TeamSession } from "../types";

interface Props {
  captainEmail: string;
  onLogout: () => Promise<void>;
}

export default function CaptainDashboard({ captainEmail, onLogout }: Props) {
  const navigate = useNavigate();
  const [teams, setTeams] = useState<TeamSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const selectAllRef = useRef<HTMLInputElement | null>(null);

  const allSelected = teams.length > 0 && selectedIds.size === teams.length;
  const someSelected = selectedIds.size > 0 && !allSelected;

  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = someSelected;
    }
  }, [someSelected]);

  const toggleOne = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    setSelectedIds((prev) =>
      prev.size === teams.length ? new Set() : new Set(teams.map((t) => t.id)),
    );
  };

  const bulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (
      !window.confirm(
        `Xoá ${selectedIds.size} team đã chọn? Tất cả pick + voting trong các team này cũng sẽ bị xoá. Không thể hoàn tác.`,
      )
    ) {
      return;
    }
    setBulkDeleting(true);
    const ids = Array.from(selectedIds);
    const results = await Promise.allSettled(
      ids.map((id) => api.teams.remove(id)),
    );
    const successful = new Set(
      ids.filter((_, i) => results[i].status === "fulfilled"),
    );
    setTeams((prev) => prev.filter((t) => !successful.has(t.id)));
    setSelectedIds(new Set());
    const failed = ids.length - successful.size;
    if (failed > 0) {
      window.alert(
        `Xoá ${successful.size}/${ids.length} team thành công. ${failed} team gặp lỗi.`,
      );
    }
    setBulkDeleting(false);
  };

  // Prune stale ids if teams change (e.g. after single-delete)
  useMemo(() => {
    setSelectedIds((prev) => {
      const valid = new Set(teams.map((t) => t.id));
      const next = new Set<string>();
      prev.forEach((id) => {
        if (valid.has(id)) next.add(id);
      });
      return next.size === prev.size ? prev : next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teams]);

  useEffect(() => {
    api.teams
      .listMine()
      .then((data) => {
        setTeams(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Lỗi tải danh sách team.");
        setLoading(false);
      });
  }, []);

  const handleDelete = async (e: React.MouseEvent, team: TeamSession) => {
    e.preventDefault();
    e.stopPropagation();
    if (
      !window.confirm(
        `Xoá team "${team.name}"? Tất cả pick của thành viên trong team này cũng sẽ bị xoá. Không thể hoàn tác.`,
      )
    ) {
      return;
    }
    setDeletingId(team.id);
    try {
      await api.teams.remove(team.id);
      setTeams((prev) => prev.filter((t) => t.id !== team.id));
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "Không xoá được team.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <main className="min-h-screen bg-surface-base px-4 py-8">
      <div className="max-w-4xl mx-auto flex flex-col gap-6">
        <header className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-xl font-black uppercase tracking-wide text-text-primary">
              Captain Dashboard
            </h1>
            <p className="text-xs text-text-muted">{captainEmail}</p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/captain/catalog"
              className="bg-surface-2 hover:bg-surface-3 border border-border-default text-text-secondary hover:text-text-primary font-black uppercase text-xs rounded-lg px-3.5 py-2 flex items-center gap-1.5 transition-colors"
            >
              <Store className="w-3.5 h-3.5" /> Catalog
            </Link>
            <Link
              to="/captain/teams/new"
              className="bg-yellow-500 hover:bg-yellow-400 text-black font-black uppercase text-xs rounded-lg px-3.5 py-2 flex items-center gap-1.5 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> Tạo team
            </Link>
            <button
              type="button"
              onClick={async () => {
                await onLogout();
                navigate("/captain/login", { replace: true });
              }}
              aria-label="Đăng xuất"
              className="p-2 min-w-11 min-h-11 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-lg transition-colors border border-red-500/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        {loading ? (
          <div className="flex items-center gap-2 text-text-muted text-sm">
            <Loader2 className="w-4 h-4 animate-spin" /> Đang tải…
          </div>
        ) : error ? (
          <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
            {error}
          </div>
        ) : teams.length === 0 ? (
          <div className="bg-surface-2 border border-dashed border-border-default rounded-2xl p-8 text-center">
            <p className="text-sm text-text-muted">
              Chưa có team nào. Tạo team đầu tiên để bắt đầu thu pick.
            </p>
          </div>
        ) : (
          <>
            <div className="bg-surface-2 border border-border-default rounded-xl px-3 py-2 flex items-center justify-between gap-3 flex-wrap">
              <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-text-secondary">
                <input
                  ref={selectAllRef}
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleAll}
                  className="w-4 h-4 accent-yellow-400 cursor-pointer"
                />
                <span className="font-bold uppercase tracking-wider">
                  Chọn tất cả ({selectedIds.size}/{teams.length})
                </span>
              </label>
              <button
                type="button"
                onClick={bulkDelete}
                disabled={selectedIds.size === 0 || bulkDeleting}
                className="text-[11px] uppercase font-black px-3 py-1.5 rounded-md flex items-center gap-1.5 bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-red-500/10 disabled:hover:text-red-400 transition-colors"
              >
                {bulkDeleting ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Trash2 className="w-3 h-3" />
                )}
                Xoá đã chọn{selectedIds.size > 0 ? ` (${selectedIds.size})` : ""}
              </button>
            </div>

            <ul className="flex flex-col gap-3">
              {teams.map((t) => {
                const isChecked = selectedIds.has(t.id);
                return (
                  <li key={t.id} className="relative flex items-stretch gap-2">
                    <label
                      className="flex items-center px-2 cursor-pointer select-none"
                      aria-label={`Chọn team ${t.name}`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleOne(t.id)}
                        className="w-4 h-4 accent-yellow-400 cursor-pointer"
                      />
                    </label>
                    <div className="relative flex-1">
                      <Link
                        to={`/captain/teams/${t.id}`}
                        className={`block bg-surface-2 hover:bg-surface-3 border rounded-2xl p-4 pr-14 transition-colors ${
                          isChecked
                            ? "border-yellow-400/60 ring-1 ring-yellow-400/30"
                            : "border-border-default"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3 flex-wrap">
                          <div>
                            <h2 className="font-black text-text-primary text-base">
                              {t.name}
                            </h2>
                            <p className="text-[11px] text-text-muted font-mono">
                              /t/{t.shareToken}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 text-[11px]">
                            {t.status === "locked" ? (
                              <span className="bg-red-500/10 text-red-400 border border-red-500/30 rounded-full px-2 py-0.5 flex items-center gap-1 font-bold uppercase">
                                <Lock className="w-3 h-3" /> Đã chốt
                              </span>
                            ) : (
                              <span className="bg-green-500/10 text-green-400 border border-green-500/30 rounded-full px-2 py-0.5 flex items-center gap-1 font-bold uppercase">
                                <Unlock className="w-3 h-3" /> Đang mở
                              </span>
                            )}
                            {t.deadlineAt ? (
                              <span className="text-text-muted flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {new Date(t.deadlineAt).toLocaleString("vi-VN")}
                              </span>
                            ) : null}
                          </div>
                        </div>
                      </Link>
                      <button
                        type="button"
                        onClick={(e) => handleDelete(e, t)}
                        disabled={deletingId === t.id}
                        aria-label={`Xoá team ${t.name}`}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-2 min-w-9 min-h-9 text-red-400 hover:text-white hover:bg-red-500 rounded-lg transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
                      >
                        {deletingId === t.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </>
        )}

      </div>
    </main>
  );
}
