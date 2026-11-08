import { cn } from "@/lib/utils";

const toneMap: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  confirmed: "bg-green-50 text-green-700 border-green-200",
  processing: "bg-blue-50 text-blue-700 border-blue-200",
  shipped: "bg-indigo-50 text-indigo-700 border-indigo-200",
  delivered: "bg-green-50 text-green-700 border-green-200",
  approved: "bg-green-50 text-green-700 border-green-200",
  active: "bg-green-50 text-green-700 border-green-200",
  visible: "bg-green-50 text-green-700 border-green-200",
  paid: "bg-green-50 text-green-700 border-green-200",
  cancelled: "bg-red-50 text-red-700 border-red-200",
  rejected: "bg-red-50 text-red-700 border-red-200",
  hidden: "bg-red-50 text-red-700 border-red-200",
  suspended: "bg-red-50 text-red-700 border-red-200",
  disabled: "bg-gray-100 text-gray-600 border-gray-200",
  archived: "bg-gray-100 text-gray-600 border-gray-200",
  draft: "bg-gray-100 text-gray-600 border-gray-200",
  unpaid: "bg-amber-50 text-amber-700 border-amber-200",
  refunded: "bg-gray-100 text-gray-600 border-gray-200",
  default: "bg-gray-100 text-gray-600 border-gray-200",
};

export function Badge({
  children,
  tone,
  className,
}: {
  children: React.ReactNode;
  tone?: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center border px-2.5 py-0.5 text-xs font-medium rounded-full",
        toneMap[tone ?? "default"] ?? toneMap.default,
        className,
      )}
    >
      {children}
    </span>
  );
}
