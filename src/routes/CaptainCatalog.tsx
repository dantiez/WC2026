import { FormEvent, useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  Loader2,
  Plus,
  Pencil,
  Trash2,
  Check,
  X,
  Store,
  Shirt,
} from "lucide-react";
import { api, ApiError } from "../lib/api";
import type { Shop, ShopJersey } from "../types";
import ImageInput from "../components/admin/ImageInput";
import JerseyImage from "../components/common/JerseyImage";

interface JerseyDraft {
  id?: string;
  name: string;
  imageUrl: string;
  isActive: boolean;
}

const EMPTY_JERSEY_DRAFT: JerseyDraft = {
  name: "",
  imageUrl: "",
  isActive: true,
};

export default function CaptainCatalog() {
  const [shops, setShops] = useState<Shop[]>([]);
  const [jerseys, setJerseys] = useState<ShopJersey[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeShopId, setActiveShopId] = useState<string | null>(null);

  const [newShopName, setNewShopName] = useState("");
  const [creatingShop, setCreatingShop] = useState(false);
  const [editingShopId, setEditingShopId] = useState<string | null>(null);
  const [editingShopName, setEditingShopName] = useState("");
  const [shopBusyId, setShopBusyId] = useState<string | null>(null);

  const [jerseyForm, setJerseyForm] = useState<JerseyDraft>(EMPTY_JERSEY_DRAFT);
  const [jerseyFormError, setJerseyFormError] = useState<string | null>(null);
  const [jerseyBusy, setJerseyBusy] = useState(false);
  const [editingJerseyId, setEditingJerseyId] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const [shopList, jerseyList] = await Promise.all([
        api.shops.list(),
        api.jerseys.list({ isAdmin: true }),
      ]);
      setShops(shopList);
      setJerseys(jerseyList);
      setError(null);
      setActiveShopId((prev) => {
        if (prev && shopList.some((s) => s.id === prev)) return prev;
        return shopList[0]?.id ?? null;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lỗi tải danh sách.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const visibleJerseys = activeShopId
    ? jerseys.filter((j) => j.shopId === activeShopId)
    : [];

  const createShop = async (e: FormEvent) => {
    e.preventDefault();
    const name = newShopName.trim();
    if (!name) return;
    setCreatingShop(true);
    try {
      const created = await api.shops.create(name);
      setShops((prev) => [...prev, created]);
      setActiveShopId(created.id);
      setNewShopName("");
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "Tạo shop thất bại.");
    } finally {
      setCreatingShop(false);
    }
  };

  const startEditShop = (shop: Shop) => {
    setEditingShopId(shop.id);
    setEditingShopName(shop.name);
  };

  const saveShopEdit = async () => {
    if (!editingShopId) return;
    const name = editingShopName.trim();
    if (!name) return;
    setShopBusyId(editingShopId);
    try {
      const updated = await api.shops.update(editingShopId, name);
      setShops((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
      setEditingShopId(null);
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "Lưu shop thất bại.");
    } finally {
      setShopBusyId(null);
    }
  };

  const removeShop = async (shop: Shop) => {
    if (!window.confirm(`Xoá shop "${shop.name}"?`)) return;
    setShopBusyId(shop.id);
    try {
      await api.shops.remove(shop.id);
      setShops((prev) => prev.filter((s) => s.id !== shop.id));
      if (activeShopId === shop.id) {
        setActiveShopId(shops.find((s) => s.id !== shop.id)?.id ?? null);
      }
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "Xoá shop thất bại.");
    } finally {
      setShopBusyId(null);
    }
  };

  const startNewJersey = () => {
    setEditingJerseyId(null);
    setJerseyForm(EMPTY_JERSEY_DRAFT);
    setJerseyFormError(null);
  };

  const startEditJersey = (jersey: ShopJersey) => {
    setEditingJerseyId(jersey.id);
    setJerseyForm({
      id: jersey.id,
      name: jersey.name,
      imageUrl: jersey.imageUrl,
      isActive: jersey.isActive,
    });
    setJerseyFormError(null);
  };

  const cancelJerseyForm = () => {
    setEditingJerseyId(null);
    setJerseyForm(EMPTY_JERSEY_DRAFT);
    setJerseyFormError(null);
  };

  const submitJersey = async (e: FormEvent) => {
    e.preventDefault();
    if (!activeShopId) return;
    const name = jerseyForm.name.trim();
    const imageUrl = jerseyForm.imageUrl.trim();
    if (!name) {
      setJerseyFormError("Cần nhập tên áo.");
      return;
    }
    if (!imageUrl) {
      setJerseyFormError("Cần ảnh áo (upload hoặc dán URL).");
      return;
    }
    setJerseyFormError(null);
    setJerseyBusy(true);
    try {
      if (editingJerseyId) {
        const updated = await api.jerseys.update(editingJerseyId, {
          name,
          imageUrl,
          isActive: jerseyForm.isActive,
        });
        setJerseys((prev) =>
          prev.map((j) => (j.id === updated.id ? updated : j)),
        );
      } else {
        const created = await api.jerseys.create({
          shopId: activeShopId,
          name,
          imageUrl,
          isActive: jerseyForm.isActive,
        });
        setJerseys((prev) => [...prev, created]);
      }
      cancelJerseyForm();
    } catch (err) {
      if (err instanceof ApiError) {
        setJerseyFormError(err.message);
      } else {
        setJerseyFormError(err instanceof Error ? err.message : "Lưu áo thất bại.");
      }
    } finally {
      setJerseyBusy(false);
    }
  };

  const removeJersey = async (jersey: ShopJersey) => {
    if (
      !window.confirm(
        `Xoá áo "${jersey.name}"? Nếu áo đã có người pick, sẽ tự động ẩn thay vì xoá hẳn.`,
      )
    ) {
      return;
    }
    try {
      const result = await api.jerseys.remove(jersey.id);
      if (result.softDeleted && result.jersey) {
        setJerseys((prev) =>
          prev.map((j) => (j.id === result.jersey!.id ? result.jersey! : j)),
        );
        window.alert("Áo đã có pick → tự động ẩn (is_active=false).");
      } else {
        setJerseys((prev) => prev.filter((j) => j.id !== jersey.id));
      }
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "Xoá áo thất bại.");
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-surface-base text-text-muted">
        <Loader2 className="w-5 h-5 animate-spin" />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-surface-base px-4 py-8">
      <div className="max-w-5xl mx-auto flex flex-col gap-6">
        <Link
          to="/captain"
          className="text-xs text-text-muted hover:text-text-primary flex items-center gap-1.5 w-fit"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Dashboard
        </Link>

        <header>
          <h1 className="text-xl font-black uppercase tracking-wide text-text-primary">
            Quản lý catalog
          </h1>
          <p className="text-xs text-text-muted">
            Shop chứa các mẫu áo. Mỗi mẫu áo có ảnh — teammate sẽ click chọn từ
            link team.
          </p>
        </header>

        {error ? (
          <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
            {error}
          </div>
        ) : null}

        <section className="bg-surface-2 border border-border-default rounded-2xl p-4 flex flex-col gap-3">
          <h2 className="text-xs uppercase font-black tracking-wider text-text-muted flex items-center gap-2">
            <Store className="w-3.5 h-3.5" /> Shops
          </h2>

          <form onSubmit={createShop} className="flex gap-2">
            <input
              value={newShopName}
              onChange={(e) => setNewShopName(e.target.value)}
              placeholder="Tên shop mới (VD: Huy Sport)"
              className="flex-1 bg-surface-3 border border-border-default rounded-lg px-3 py-2 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400"
            />
            <button
              type="submit"
              disabled={creatingShop || !newShopName.trim()}
              className="bg-yellow-500 hover:bg-yellow-400 disabled:opacity-60 text-black font-black uppercase text-xs rounded-lg px-3 py-2 flex items-center gap-1.5"
            >
              {creatingShop ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Plus className="w-3.5 h-3.5" />
              )}
              Tạo shop
            </button>
          </form>

          {shops.length === 0 ? (
            <p className="text-xs text-text-muted py-2">
              Chưa có shop. Tạo shop đầu tiên để thêm áo.
            </p>
          ) : (
            <ul className="flex flex-wrap gap-2">
              {shops.map((shop) => {
                const count = jerseys.filter((j) => j.shopId === shop.id).length;
                const isActive = shop.id === activeShopId;
                const isEditing = editingShopId === shop.id;
                const isBusy = shopBusyId === shop.id;
                if (isEditing) {
                  return (
                    <li
                      key={shop.id}
                      className="flex items-center gap-1.5 bg-surface-3 border border-yellow-500/40 rounded-lg pl-2 pr-1 py-1"
                    >
                      <input
                        value={editingShopName}
                        onChange={(e) => setEditingShopName(e.target.value)}
                        className="bg-transparent text-sm text-text-primary focus:outline-none w-32"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={saveShopEdit}
                        disabled={isBusy}
                        aria-label="Lưu"
                        className="p-1 text-green-400 hover:bg-green-500/20 rounded"
                      >
                        {isBusy ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Check className="w-3.5 h-3.5" />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingShopId(null)}
                        aria-label="Huỷ"
                        className="p-1 text-text-muted hover:text-text-primary rounded"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </li>
                  );
                }
                return (
                  <li key={shop.id} className="flex items-stretch">
                    <button
                      type="button"
                      onClick={() => setActiveShopId(shop.id)}
                      className={`px-3 py-1.5 rounded-l-lg text-xs font-black uppercase border ${
                        isActive
                          ? "bg-yellow-500 text-black border-yellow-500"
                          : "bg-surface-3 text-text-secondary border-border-default hover:bg-surface-2"
                      }`}
                    >
                      {shop.name}{" "}
                      <span className="opacity-60 font-mono">({count})</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => startEditShop(shop)}
                      aria-label={`Sửa shop ${shop.name}`}
                      className="px-1.5 border-y border-border-default bg-surface-3 text-text-muted hover:text-yellow-400"
                    >
                      <Pencil className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeShop(shop)}
                      disabled={isBusy}
                      aria-label={`Xoá shop ${shop.name}`}
                      className="px-1.5 rounded-r-lg border border-border-default bg-surface-3 text-text-muted hover:text-red-400"
                    >
                      {isBusy ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Trash2 className="w-3 h-3" />
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {activeShopId ? (
          <section className="bg-surface-2 border border-border-default rounded-2xl p-4 flex flex-col gap-4">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <h2 className="text-xs uppercase font-black tracking-wider text-text-muted flex items-center gap-2">
                <Shirt className="w-3.5 h-3.5" />
                Áo của shop {shops.find((s) => s.id === activeShopId)?.name}
              </h2>
              {!editingJerseyId ? (
                <button
                  type="button"
                  onClick={startNewJersey}
                  className="text-[11px] uppercase font-black px-3 py-1.5 rounded-lg bg-yellow-500/10 text-yellow-400 border border-yellow-500/30 hover:bg-yellow-500/20 flex items-center gap-1.5"
                >
                  <Plus className="w-3 h-3" /> Thêm áo
                </button>
              ) : null}
            </div>

            <form
              onSubmit={submitJersey}
              className="bg-surface-3 border border-border-default rounded-xl p-4 flex flex-col gap-3"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-[11px] uppercase font-bold tracking-wider text-yellow-400">
                  {editingJerseyId ? "Sửa áo" : "Áo mới"}
                </p>
                {editingJerseyId ? (
                  <button
                    type="button"
                    onClick={cancelJerseyForm}
                    aria-label="Huỷ"
                    className="text-text-muted hover:text-text-primary"
                  >
                    <X className="w-4 h-4" />
                  </button>
                ) : null}
              </div>

              <div className="grid md:grid-cols-[180px_1fr] gap-4">
                <ImageInput
                  value={jerseyForm.imageUrl}
                  onChange={(url) =>
                    setJerseyForm((prev) => ({ ...prev, imageUrl: url }))
                  }
                  disabled={jerseyBusy}
                />

                <div className="flex flex-col gap-3">
                  <label className="flex flex-col gap-1.5">
                    <span className="text-[11px] uppercase font-bold tracking-wider text-text-muted">
                      Tên áo <span className="text-red-400">*</span>
                    </span>
                    <input
                      value={jerseyForm.name}
                      onChange={(e) =>
                        setJerseyForm((prev) => ({ ...prev, name: e.target.value }))
                      }
                      placeholder="VD: Việt Nam Home 2026"
                      className="bg-surface-base border border-border-default rounded-lg px-3 py-2 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400"
                    />
                  </label>
                  <label className="flex items-center gap-2 text-xs text-text-secondary">
                    <input
                      type="checkbox"
                      checked={jerseyForm.isActive}
                      onChange={(e) =>
                        setJerseyForm((prev) => ({
                          ...prev,
                          isActive: e.target.checked,
                        }))
                      }
                      className="accent-yellow-500"
                    />
                    Hiển thị trong gallery (is_active)
                  </label>

                  {jerseyFormError ? (
                    <p className="text-[11px] text-red-400 bg-red-500/10 border border-red-500/20 rounded-md px-2 py-1.5">
                      {jerseyFormError}
                    </p>
                  ) : null}

                  <button
                    type="submit"
                    disabled={jerseyBusy}
                    className="bg-yellow-500 hover:bg-yellow-400 disabled:opacity-60 text-black font-black uppercase text-sm rounded-lg py-2.5 flex items-center justify-center gap-2"
                  >
                    {jerseyBusy ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Check className="w-4 h-4" />
                    )}
                    {editingJerseyId ? "Lưu thay đổi" : "Thêm áo"}
                  </button>
                </div>
              </div>
            </form>

            {visibleJerseys.length === 0 ? (
              <p className="text-xs text-text-muted py-2 text-center">
                Shop này chưa có áo nào.
              </p>
            ) : (
              <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {visibleJerseys.map((jersey) => (
                  <li
                    key={jersey.id}
                    className={`bg-surface-3 border rounded-xl overflow-hidden flex flex-col ${
                      jersey.isActive
                        ? "border-border-default"
                        : "border-red-500/30 opacity-60"
                    }`}
                  >
                    <div className="aspect-[4/5] bg-surface-base relative">
                      <JerseyImage
                        src={jersey.imageUrl}
                        alt={jersey.name}
                        imgClassName="w-full h-full object-cover"
                        wrapperClassName="block w-full h-full"
                      />
                    </div>
                    <div className="px-3 py-2 flex-1 flex flex-col gap-1">
                      <p className="text-sm font-black text-text-primary truncate">
                        {jersey.name}
                      </p>
                      {!jersey.isActive ? (
                        <p className="text-[10px] uppercase font-bold text-red-400">
                          Đang ẩn
                        </p>
                      ) : null}
                    </div>
                    <div className="flex border-t border-border-default">
                      <button
                        type="button"
                        onClick={() => startEditJersey(jersey)}
                        className="flex-1 py-2 text-[11px] uppercase font-black text-yellow-400 hover:bg-yellow-500/10 flex items-center justify-center gap-1"
                      >
                        <Pencil className="w-3 h-3" /> Sửa
                      </button>
                      <button
                        type="button"
                        onClick={() => removeJersey(jersey)}
                        className="flex-1 py-2 text-[11px] uppercase font-black text-red-400 hover:bg-red-500/10 flex items-center justify-center gap-1 border-l border-border-default"
                      >
                        <Trash2 className="w-3 h-3" /> Xoá
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        ) : null}
      </div>
    </main>
  );
}
