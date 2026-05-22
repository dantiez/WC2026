/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Product } from "../../types";

interface JerseyCardProps {
  product: Product;
  onSelect: (productId: string) => void;
  key?: string | number;
}

export default function JerseyCard({ product, onSelect }: JerseyCardProps) {
  // Format price helper
  const formattedPrice = product.price.toLocaleString("vi-VN") + " ₫";
  
  // Custom tag styling for Jersey selection
  const isHome = product.jerseyType === "home";

  return (
    <div className="relative group flex flex-col justify-between overflow-hidden bg-[#111118] border border-[#1e1e2d] hover:border-yellow-500/40 rounded-2xl transition-all duration-300 shadow-xl hover:shadow-2xl hover:shadow-yellow-500/5">
      {/* Absolute Badges on Image */}
      <div className="absolute top-3 left-3 z-10 flex flex-col gap-1.5 items-start">
        <span className={`px-2.5 py-0.5 text-[10px] font-extrabold uppercase rounded-full ${
          isHome 
            ? "bg-red-500/10 text-red-500 border border-red-500/20" 
            : "bg-blue-500/10 text-blue-500 border border-blue-500/20"
        }`}>
          {isHome ? "Sân Nhà (Home)" : "Sân Khách (Away)"}
        </span>
        
        {product.stock <= 5 && product.stock > 0 && (
          <span className="bg-amber-600/20 border border-amber-600/40 text-amber-500 text-[9px] font-black uppercase px-2 py-0.5 rounded-full">
            Còn ít áo ({product.stock})
          </span>
        )}
        {product.stock === 0 && (
          <span className="bg-zinc-800 text-zinc-500 text-[9px] font-black uppercase px-2 py-0.5 rounded-full border border-zinc-700">
            Hết hàng
          </span>
        )}
      </div>

      <div className="relative w-full aspect-[4/5] overflow-hidden bg-gradient-to-br from-zinc-900 to-zinc-950">
        <img
          src={product.imageUrl}
          alt={product.name}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        {/* Hover Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0f] via-transparent to-transparent opacity-60 pointer-events-none" />
      </div>

      <div className="p-4 flex flex-col justify-between flex-grow">
        <div>
          <span className="text-[11px] font-bold text-gray-500 uppercase tracking-widest block mb-1">
            {product.teamCountry}
          </span>
          <h3 className="text-[#F8F8FF] font-sans font-bold text-sm sm:text-base tracking-tight mb-2 line-clamp-1 group-hover:text-yellow-400 transition-colors">
            {product.name}
          </h3>
        </div>

        <div className="mt-4">
          <div className="flex justify-between items-baseline mb-3">
            <span className="text-yellow-400 font-mono font-black text-sm sm:text-base">
              {formattedPrice}
            </span>
            <span className="text-[10px] text-gray-500">
              Kho: {product.stock} áo
            </span>
          </div>

          <button
            id={`btn-customize-${product.id}`}
            onClick={() => onSelect(product.id)}
            disabled={product.stock === 0}
            className="w-full bg-[#1e1e2e] active:bg-yellow-500 active:text-black group-hover:bg-yellow-500 group-hover:text-black hover:bg-yellow-400 text-[#F8F8FF] text-xs font-extrabold py-2.5 px-4 rounded-xl transition-all cursor-pointer disabled:bg-zinc-800 disabled:text-zinc-600 disabled:cursor-not-allowed uppercase tracking-wider"
          >
            {product.stock === 0 ? "Hết Hàng" : "Tùy Biến 2.5D"}
          </button>
        </div>
      </div>
    </div>
  );
}
