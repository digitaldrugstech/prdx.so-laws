"use client"

import { cx } from "@/cva"
import { ChevronRightIcon } from "lucide-react"
import { ReactNode, useState } from "react"

export function Collapse(
    { summary, children }: { summary: string, children: ReactNode }
) {
    const [open, setOpen] = useState(false)

    return (
        <div className="border-b border-white/[0.06] last:border-b-0">
            <button
                className={cx(
                    "w-full flex items-center text-left gap-3",
                    "py-3.5 px-5",
                    "transition-colors duration-150",
                    open
                        ? "text-foreground-000"
                        : "text-foreground-200 hover:text-foreground-000 hover:bg-white/[0.015]"
                )}
                onClick={() => setOpen(o => !o)}
            >
                <ChevronRightIcon
                    size={14}
                    className={cx(
                        "shrink-0 text-foreground-500",
                        "transition-transform duration-200",
                        open && "rotate-90"
                    )}
                />
                <span className="text-[14px] font-medium leading-snug">
                    {summary}
                </span>
            </button>
            <div
                className={cx(
                    "overflow-hidden transition-all duration-300 ease-out",
                    open ? "max-h-[5000px]" : "max-h-0"
                )}
            >
                <div className="px-5 pb-5 pl-11">
                    {children}
                </div>
            </div>
        </div>
    )
}
