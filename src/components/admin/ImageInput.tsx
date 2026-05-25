import { useRef, useState } from "react";
import { Loader2, Upload, X, Link2 } from "lucide-react";
import { cloudinaryConfigured, uploadToCloudinary } from "../../lib/cloudinary";

interface Props {
  value: string;
  onChange: (url: string) => void;
  disabled?: boolean;
}

export default function ImageInput({ value, onChange, disabled }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pasting, setPasting] = useState(false);
  const cloudinaryReady = cloudinaryConfigured();

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    setError(null);
    setUploading(true);
    try {
      const url = await uploadToCloudinary(file);
      onChange(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload thất bại.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="flex flex-col gap-2">
      {value ? (
        <div className="relative w-full aspect-[4/5] max-w-[180px] rounded-lg overflow-hidden bg-surface-3 border border-border-default">
          <img
            src={value}
            alt="Ảnh áo"
            className="w-full h-full object-cover"
            loading="lazy"
            decoding="async"
          />
          {!disabled ? (
            <button
              type="button"
              onClick={() => onChange("")}
              aria-label="Xoá ảnh"
              className="absolute top-1 right-1 p-1.5 rounded-md bg-black/70 text-white hover:bg-red-500"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : null}
        </div>
      ) : (
        <div className="flex items-center justify-center w-full aspect-[4/5] max-w-[180px] rounded-lg border-2 border-dashed border-border-default text-text-muted text-[11px] uppercase font-bold tracking-wider">
          Chưa có ảnh
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {cloudinaryReady ? (
          <>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => onFile(e.target.files?.[0])}
              disabled={disabled || uploading}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled || uploading}
              className="text-[11px] uppercase font-black px-3 py-2 rounded-lg bg-yellow-500 hover:bg-yellow-400 text-black flex items-center gap-1.5 disabled:opacity-60"
            >
              {uploading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Upload className="w-3.5 h-3.5" />
              )}
              {uploading ? "Đang upload…" : "Upload ảnh"}
            </button>
          </>
        ) : null}

        <button
          type="button"
          onClick={() => setPasting((p) => !p)}
          disabled={disabled}
          className="text-[11px] uppercase font-black px-3 py-2 rounded-lg bg-surface-3 hover:bg-surface-2 border border-border-default text-text-secondary flex items-center gap-1.5"
        >
          <Link2 className="w-3.5 h-3.5" />
          {pasting ? "Đóng" : "Dán URL"}
        </button>
      </div>

      {pasting ? (
        <input
          type="url"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://…"
          disabled={disabled}
          className="bg-surface-3 border border-border-default rounded-lg px-3 py-2 text-sm text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400"
        />
      ) : null}

      {!cloudinaryReady ? (
        <p className="text-[10px] text-text-muted">
          Cloudinary chưa cấu hình. Dán URL ảnh thủ công, hoặc set{" "}
          <code className="font-mono">VITE_CLOUDINARY_CLOUD_NAME</code> +{" "}
          <code className="font-mono">VITE_CLOUDINARY_UPLOAD_PRESET</code> trong env.
        </p>
      ) : null}

      {error ? (
        <p className="text-[11px] text-red-400 bg-red-500/10 border border-red-500/20 rounded-md px-2 py-1.5">
          {error}
        </p>
      ) : null}
    </div>
  );
}
