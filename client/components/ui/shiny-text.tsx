import { CSSProperties, FC } from "react";
import { cn } from "@/lib/utils";

interface ShinyTextProps {
    text: string;
    disabled?: boolean;
    speed?: number;
    className?: string;
}

export const ShinyText: FC<ShinyTextProps> = ({
    text,
    disabled = false,
    speed = 5,
    className,
}) => {
    return (
        <span
            className={cn(
                "inline-block bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent",
                disabled && "opacity-50",
                className
            )}
            style={{
                backgroundSize: "200% auto",
                animation: `shimmer ${speed}s linear infinite`,
            }}
        >
            {text}
            <style jsx>{`
        @keyframes shimmer {
          0% {
            background-position: 0% center;
          }
          100% {
            background-position: 200% center;
          }
        }
      `}</style>
        </span>
    );
};

export default ShinyText;
