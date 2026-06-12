"use client"

import { cx } from "@/cva"
import { LawsNavItem } from "@/data/laws"
import { BookOpenIcon, MenuIcon, ScaleIcon, XIcon } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Fragment, useEffect, useState } from "react"

function NavItem({ item, onClose }: { item: LawsNavItem, onClose: () => void }) {
    const pathname = usePathname()
    const hasChildren = !!item.children?.length
    const isActive = !hasChildren && pathname === `/rules/${item.slug}`

    if (hasChildren) {
        return (
            <div>
                <span className={cx(
                    "block py-2 px-3 text-[12px] uppercase tracking-wider",
                    "text-foreground-500 font-medium mt-2"
                )}>
                    {item.title}
                </span>
                <div className="ml-3 pl-3 border-l border-white/[0.06]">
                    {item.children!.map(child => (
                        <NavItem key={child.slug} item={child} onClose={onClose} />
                    ))}
                </div>
            </div>
        )
    }

    return (
        <Link
            href={`/rules/${item.slug}`}
            onClick={onClose}
            className={cx(
                "flex items-center gap-2 py-2 px-3 rounded-lg text-[14px]",
                "transition-colors duration-150",
                isActive
                    ? "text-foreground-000 font-medium bg-context-500/[0.1]"
                    : item.variant === "reference"
                        ? "text-foreground-100 font-medium active:bg-white/[0.04]"
                        : "text-foreground-200 active:bg-white/[0.04]"
            )}
        >
            {item.variant === "reference" && (
                <BookOpenIcon
                    size={13}
                    className={cx("shrink-0", isActive ? "text-context-500" : "text-context-500/50")}
                />
            )}
            {item.title}
        </Link>
    )
}

function MobileSectionLabel({ label }: { label: string }) {
    return (
        <div className="mt-3 mb-1">
            <div className="h-px bg-white/[0.06] mb-2.5" />
            {label && (
                <p className="px-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-foreground-600 select-none">
                    {label}
                </p>
            )}
        </div>
    )
}

export default function LawsMobileNav({ navigation }: { navigation: LawsNavItem[] }) {
    const [open, setOpen] = useState(false)
    const pathname = usePathname()

    useEffect(() => {
        setOpen(false)
    }, [pathname])

    useEffect(() => {
        document.body.style.overflow = open ? "hidden" : ""
        return () => {
            document.body.style.overflow = ""
        }
    }, [open])

    return (
        <>
            <button
                onClick={() => setOpen(true)}
                className={cx(
                    "lg:hidden fixed bottom-5 right-5 z-40",
                    "flex items-center gap-2",
                    "bg-background-100 text-foreground-100",
                    "px-4 py-3 rounded-xl",
                    "ring-1 ring-white/[0.08]",
                    "shadow-lg shadow-black/30",
                    "active:scale-95 transition-transform duration-150"
                )}
            >
                <MenuIcon size={17} />
                <span className="text-[13px] font-medium">Навигация</span>
            </button>

            {open && (
                <div className="fixed inset-0 z-50 lg:hidden">
                    <div
                        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                        onClick={() => setOpen(false)}
                    />
                    <div className={cx(
                        "absolute inset-y-0 left-0",
                        "w-[300px] max-w-[85vw]",
                        "bg-background-000",
                        "border-r border-white/[0.06]",
                        "flex flex-col",
                        "animate-in slide-in-from-left duration-200"
                    )}>
                        <div className={cx(
                            "flex items-center justify-between",
                            "px-5 py-4",
                            "border-b border-white/[0.06]"
                        )}>
                            <Link
                                href="/rules"
                                onClick={() => setOpen(false)}
                                className="flex items-center gap-2 text-[15px] font-semibold text-foreground-000"
                            >
                                <ScaleIcon size={16} className="text-context-500" />
                                Законодательство
                            </Link>
                            <button
                                onClick={() => setOpen(false)}
                                className="p-1.5 rounded-lg text-foreground-500 hover:text-foreground-200 transition-colors"
                            >
                                <XIcon size={18} />
                            </button>
                        </div>
                        <nav className="flex-1 overflow-y-auto p-4 space-y-0.5">
                            {navigation.map(item => (
                                <Fragment key={item.slug}>
                                    {item.sectionLabel !== undefined && (
                                        <MobileSectionLabel label={item.sectionLabel} />
                                    )}
                                    <NavItem item={item} onClose={() => setOpen(false)} />
                                </Fragment>
                            ))}
                        </nav>
                    </div>
                </div>
            )}
        </>
    )
}
