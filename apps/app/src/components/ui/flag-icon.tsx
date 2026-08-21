import { cn } from "@/lib/utils";

interface FlagIconProps {
  countryCode: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function FlagIcon({ countryCode, className, size = "md" }: FlagIconProps) {
  const sizeClasses = {
    sm: "w-4 h-3",
    md: "w-6 h-4", 
    lg: "w-8 h-6"
  };

  // Use flagcdn.com for reliable flag images
  const flagUrl = `https://flagcdn.com/w20/${countryCode.toLowerCase()}.png`;

  return (
    <div className={cn("inline-block", className)}>
      <img
        src={flagUrl}
        alt={`${countryCode} flag`}
        className={cn(
          "rounded-sm border border-gray-200 object-cover",
          sizeClasses[size]
        )}
        onError={(e) => {
          // Fallback to a simple badge if image fails to load
          const target = e.target as HTMLImageElement;
          target.style.display = 'none';
          const fallback = target.nextElementSibling as HTMLElement;
          if (fallback) {
            fallback.style.display = 'flex';
          }
        }}
      />
      <div
        className={cn(
          "hidden items-center justify-center rounded-sm text-xs font-medium border border-gray-300 bg-gradient-to-br from-blue-500 to-red-500 text-white",
          sizeClasses[size]
        )}
      >
        <span className="text-[8px] font-bold">{countryCode}</span>
      </div>
    </div>
  );
}