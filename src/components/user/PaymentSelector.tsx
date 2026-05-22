/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { CreditCard, Wallet, Landmark, HandCoins } from "lucide-react";
import { PaymentMethod } from "../../types";
import { useTranslation } from "../../i18n/LanguageContext";

interface PaymentSelectorProps {
  selectedMethod: PaymentMethod;
  onChange: (method: PaymentMethod) => void;
}

export default function PaymentSelector({ selectedMethod, onChange }: PaymentSelectorProps) {
  const { t } = useTranslation();

  const methods = [
    {
      id: "cod" as PaymentMethod,
      title: t("payment.codTitle"),
      description: t("payment.codDesc"),
      icon: HandCoins,
      color: "border-gray-500/30 text-gray-400",
    },
    {
      id: "bank_transfer" as PaymentMethod,
      title: t("payment.bankTitle"),
      description: t("payment.bankDesc"),
      icon: Landmark,
      color: "border-blue-500/30 text-blue-400",
    },
    {
      id: "momo" as PaymentMethod,
      title: t("payment.momoTitle"),
      description: t("payment.momoDesc"),
      icon: Wallet,
      color: "border-pink-500/30 text-pink-400",
    },
    {
      id: "vnpay" as PaymentMethod,
      title: t("payment.vnpayTitle"),
      description: t("payment.vnpayDesc"),
      icon: CreditCard,
      color: "border-emerald-500/30 text-emerald-400",
    },
  ];

  return (
    <div className="flex flex-col gap-3">
      {methods.map((m) => {
        const IconComponent = m.icon;
        const isSelected = selectedMethod === m.id;

        return (
          <label
            key={m.id}
            onClick={() => onChange(m.id)}
            className={`flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
              isSelected
                ? "bg-gradient-to-r from-yellow-500/5 to-amber-500/5 border-yellow-500 shadow-md shadow-yellow-500/10"
                : "bg-surface-3/60 border-border-default hover:border-border-strong"
            }`}
          >
            <div className={`mt-0.5 p-2 rounded-lg border ${m.color} bg-surface-base/40`}>
              <IconComponent className="w-5 h-5" />
            </div>

            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className={`text-sm font-bold ${isSelected ? "text-yellow-400" : "text-text-primary"}`}>
                  {m.title}
                </span>
                <input
                  type="radio"
                  name="paymentMethod"
                  value={m.id}
                  checked={isSelected}
                  onChange={() => {}}
                  className="w-4 h-4 accent-yellow-500 pointer-events-none"
                />
              </div>
              <p className="text-text-muted text-xs mt-1 leading-normal">
                {m.description}
              </p>
            </div>
          </label>
        );
      })}
    </div>
  );
}
