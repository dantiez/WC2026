import ExcelJS from "exceljs";
import type { Shop, ShopJersey, TeamPick, TeamSession } from "../types";

interface ExportInput {
  team: TeamSession;
  picks: TeamPick[];
  jerseyMap: Map<string, ShopJersey>;
  shopMap: Map<string, Shop>;
}

interface FetchedImage {
  buffer: ArrayBuffer;
  extension: "png" | "jpeg" | "gif";
}

const imageCache = new Map<string, FetchedImage | null>();

function extensionFromContentType(ct: string | null): FetchedImage["extension"] {
  if (!ct) return "jpeg";
  if (ct.includes("png")) return "png";
  if (ct.includes("gif")) return "gif";
  return "jpeg";
}

async function fetchImage(url: string): Promise<FetchedImage | null> {
  if (imageCache.has(url)) return imageCache.get(url) ?? null;
  try {
    const res = await fetch(url, { mode: "cors" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const buffer = await res.arrayBuffer();
    const extension = extensionFromContentType(res.headers.get("Content-Type"));
    const result: FetchedImage = { buffer, extension };
    imageCache.set(url, result);
    return result;
  } catch (err) {
    console.warn(`[excelExport] failed to fetch image ${url}:`, err);
    imageCache.set(url, null);
    return null;
  }
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function exportPicksToExcel({
  team,
  picks,
  jerseyMap,
  shopMap,
}: ExportInput): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "WC2026 Jersey Customizer";
  workbook.created = new Date();

  const picksSheet = workbook.addWorksheet("DanhSachInAo", {
    views: [{ state: "frozen", ySplit: 1 }],
  });

  picksSheet.columns = [
    { header: "STT", key: "stt", width: 6 },
    { header: "Ảnh", key: "image", width: 14 },
    { header: "Tên", key: "name", width: 24 },
    { header: "Size", key: "size", width: 8 },
    { header: "Số áo", key: "number", width: 10 },
    { header: "Nickname", key: "nickname", width: 18 },
    { header: "Mẫu áo", key: "jersey", width: 28 },
    { header: "Shop", key: "shop", width: 18 },
  ];

  const headerRow = picksSheet.getRow(1);
  headerRow.font = { bold: true };
  headerRow.alignment = { vertical: "middle", horizontal: "center" };
  headerRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFFFD700" },
  };
  headerRow.height = 22;

  const uniqueImages = Array.from(
    new Set(
      picks
        .map((p) => (p.jerseyId ? jerseyMap.get(p.jerseyId)?.imageUrl : undefined))
        .filter((u): u is string => Boolean(u)),
    ),
  );
  const fetched = await Promise.all(
    uniqueImages.map(async (url) => [url, await fetchImage(url)] as const),
  );
  const imageByUrl = new Map(fetched);

  picks.forEach((pick, idx) => {
    const jersey = pick.jerseyId ? jerseyMap.get(pick.jerseyId) : undefined;
    const shop = jersey ? shopMap.get(jersey.shopId) : undefined;
    const row = picksSheet.addRow({
      stt: idx + 1,
      image: "",
      name: pick.memberName,
      size: pick.size,
      number: pick.jerseyNumber ?? "",
      nickname: pick.nickname ?? "",
      jersey: jersey?.name ?? (pick.jerseyId ?? "Chờ voting"),
      shop: shop?.name ?? "",
    });
    row.height = 72;
    row.alignment = { vertical: "middle" };

    const rowNumber = row.number;
    const img = jersey ? imageByUrl.get(jersey.imageUrl) : null;
    if (img) {
      const imageId = workbook.addImage({
        buffer: img.buffer,
        extension: img.extension,
      });
      picksSheet.addImage(imageId, {
        tl: { col: 1.1, row: rowNumber - 1 + 0.1 },
        ext: { width: 70, height: 88 },
        editAs: "oneCell",
      });
    }
  });

  picksSheet.getColumn("stt").alignment = {
    horizontal: "center",
    vertical: "middle",
  };
  picksSheet.getColumn("size").alignment = {
    horizontal: "center",
    vertical: "middle",
  };
  picksSheet.getColumn("number").alignment = {
    horizontal: "center",
    vertical: "middle",
  };

  // ── Summary sheet: jersey -> quantity ─────────────────────────────────────
  const summarySheet = workbook.addWorksheet("Summary");
  summarySheet.columns = [
    { header: "Mẫu áo", key: "jersey", width: 32 },
    { header: "Shop", key: "shop", width: 20 },
    { header: "Số lượng", key: "qty", width: 12 },
  ];
  const summaryHeader = summarySheet.getRow(1);
  summaryHeader.font = { bold: true };
  summaryHeader.alignment = { vertical: "middle", horizontal: "center" };
  summaryHeader.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFFFD700" },
  };

  const counts = new Map<string, number>();
  for (const pick of picks) {
    const key = pick.jerseyId ?? "__pending__";
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  const summaryRows = Array.from(counts.entries())
    .map(([jerseyId, qty]) => {
      const jersey = jerseyMap.get(jerseyId);
      const shop = jersey ? shopMap.get(jersey.shopId) : undefined;
      return {
        jersey:
          jerseyId === "__pending__"
            ? "Chờ voting chốt"
            : (jersey?.name ?? jerseyId),
        shop: shop?.name ?? "",
        qty,
      };
    })
    .sort((a, b) => b.qty - a.qty);

  for (const r of summaryRows) summarySheet.addRow(r);
  summarySheet.getColumn("qty").alignment = {
    horizontal: "center",
    vertical: "middle",
  };

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const safeName = team.name.replace(/[^\p{L}\p{N}_-]+/gu, "_");
  triggerDownload(blob, `${safeName}_picks.xlsx`);
}
