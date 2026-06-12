"use client"

import { cx } from "@/cva"
import { LawsNavItem } from "@/data/laws"
import { BookOpenIcon, ChevronRightIcon, ScaleIcon } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Fragment, useEffect, useState } from "react"

function isDescendantActive(item: LawsNavItem, pathname: string): boolean {
    if (!item.children) return false
    return item.children.some(
        c => pathname === `/rules/${c.slug}` || isDescendantActive(c, pathname)
    )
}

function SidebarItem({ item, depth = 0 }: { item: LawsNavItem, depth?: number }) {
    const pathname = usePathname()
    const hasChildren = !!item.children?.length
    const isActive = !hasChildren && pathname === `/rules/${item.slug}`
    const childActive = hasChildren && isDescendantActive(item, pathname)
    const [open, setOpen] = useState(childActive || depth === 0)

    useEffect(() => {
        if (childActive) setOpen(true)
    }, [pathname, childActive])

    return (
        <div>
            <div className="flex items-center">
                {hasChildren ? (
                    <button
                        onClick={() => setOpen(o => !o)}
                        className={cx(
                            "flex-1 flex items-center gap-1 py-1.5 px-2.5 rounded-lg text-left w-full",
                            "text-[13px] transition-all duration-200 leading-snug",
                            depth === 0 && "font-medium text-[14px]",
                            childActive
                                ? "text-foreground-100"
                                : "text-foreground-400 hover:text-foreground-200"
                        )}
                    >
                        <ChevronRightIcon
                            size={13}
                            className={cx(
                                "shrink-0 transition-transform duration-200",
                                open && "rotate-90"
                            )}
                        />
                        {item.title}
                    </button>
                ) : (
                    <Link
                        href={`/rules/${item.slug}`}
                        className={cx(
                            "flex-1 flex items-center gap-1.5 py-1.5 px-2.5 rounded-lg text-[13px] transition-all duration-200 leading-snug",
                            isActive
                                ? "text-foreground-000 font-medium bg-context-500/[0.12]"
                                : item.variant === "reference"
                                    ? "text-foreground-100 font-medium hover:text-foreground-000 hover:bg-white/[0.04]"
                                    : "text-foreground-200 hover:text-foreground-000 hover:bg-white/[0.04]"
                        )}
                    >
                        {item.variant === "reference" && (
                            <BookOpenIcon
                                size={11}
                                className={cx("shrink-0", isActive ? "text-context-500" : "text-context-500/50")}
                            />
                        )}
                        {item.title}
                    </Link>
                )}
            </div>
            {hasChildren && open && (
                <div className={cx(
                    "flex flex-col mt-0.5 ml-2.5 pl-2",
                    "border-l border-white/[0.06]"
                )}>
                    {item.children!.map(child => (
                        <SidebarItem key={child.slug} item={child} depth={depth + 1} />
                    ))}
                </div>
            )}
        </div>
    )
}

function SectionLabel({ label }: { label: string }) {
    return (
        <div className="mt-3 mb-1">
            <div className="h-px bg-white/[0.06] mb-2.5" />
            {label && (
                <p className="px-2.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-foreground-600 select-none">
                    {label}
                </p>
            )}
        </div>
    )
}

export default function LawsSidebar({ navigation }: { navigation: LawsNavItem[] }) {
    const pathname = usePathname()
    const isHome = pathname === "/rules"

    return (
        <aside className={cx(
            "w-[220px] shrink-0 max-lg:hidden",
            "sticky top-20 self-start",
            "max-h-[calc(100vh-5rem-2rem)] overflow-y-auto",
            "wiki-sidebar-scroll"
        )}>
            <nav className="flex flex-col gap-0.5 pb-4">
                <Link
                    href="/rules"
                    className={cx(
                        "flex items-center gap-2 text-[14px] font-medium",
                        "py-2 px-2.5 rounded-lg mb-2 transition-all duration-200",
                        isHome
                            ? "text-foreground-000 bg-context-500/[0.12]"
                            : "text-foreground-200 hover:text-foreground-000 hover:bg-white/[0.04]"
                    )}
                >
                    <ScaleIcon size={15} className="text-context-500 shrink-0" />
                    Законодательство
                </Link>
                <div className="h-px bg-white/[0.06] mb-2" />
                {navigation.map(item => (
                    <Fragment key={item.slug}>
                        {item.sectionLabel !== undefined && (
                            <SectionLabel label={item.sectionLabel} />
                        )}
                        <SidebarItem item={item} />
                    </Fragment>
                ))}
            </nav>
        </aside>
    )
}
