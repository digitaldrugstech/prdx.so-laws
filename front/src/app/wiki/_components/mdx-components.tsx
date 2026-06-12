import { cx } from "@/cva"
import { WIKI_ASSETS_BASE } from "@/data/wiki"
import {
    AlertTriangleIcon,
    ArrowRightIcon,
    ExternalLinkIcon,
    InfoIcon,
    ShieldAlertIcon,
} from "lucide-react"
import Link from "next/link"
import { ReactNode } from "react"
import { Collapse } from "./mdx-client"

function slugify(text: string): string {
    return text
        .toLowerCase()
        .replace(/[^a-zA-Z0-9\u0400-\u04FF\s-]/g, "")
        .replace(/\s+/g, "-")
}

const geistFont = { fontFamily: "var(--font-geist)" }

function extractText(node: React.ReactNode): string {
    if (typeof node === "string") return node
    if (typeof node === "number") return String(node)
    if (Array.isArray(node)) return node.map(extractText).join("")
    if (node && typeof node === "object" && "props" in node) {
        const el = node as React.ReactElement<{ children?: React.ReactNode }>
        return extractText(el.props.children)
    }
    return ""
}

// ---------------------------------------------------------------------------
// FatLink — prominent call-to-action button
// ---------------------------------------------------------------------------
function FatLink({ href, children }: { href: string, children: ReactNode }) {
    const isExternal = href.startsWith("http")
    const Comp = isExternal ? "a" : Link
    const Icon = isExternal ? ExternalLinkIcon : ArrowRightIcon

    return (
        <Comp
            href={href}
            {...(isExternal && { target: "_blank", rel: "noopener noreferrer" })}
            className={cx(
                "group inline-flex items-center gap-2.5 my-5",
                "text-[14px] font-semibold leading-none",
                "pl-5 pr-4 py-3.5 rounded-xl",
                "bg-context-500/[0.12] text-context-400",
                "ring-1 ring-context-500/20",
                "hover:bg-context-500/[0.18] hover:text-context-300",
                "hover:ring-context-500/30",
                "transition-all duration-200"
            )}
        >
            {children}
            <Icon
                size={14}
                className={cx(
                    "shrink-0 opacity-60",
                    "group-hover:opacity-100 group-hover:translate-x-0.5",
                    "transition-all duration-200"
                )}
            />
        </Comp>
    )
}

// ---------------------------------------------------------------------------
// CollapseBlock — container for multiple Collapse items
// ---------------------------------------------------------------------------
function CollapseBlock({ children }: { children: ReactNode }) {
    return (
        <div
            className={cx(
                "flex flex-col my-6 rounded-xl overflow-hidden",
                "ring-1 ring-white/[0.06]",
                "bg-white/[0.015]"
            )}
        >
            {children}
        </div>
    )
}

// ---------------------------------------------------------------------------
// CustomBlock — callout blocks (danger / warn / note)
// ---------------------------------------------------------------------------
const blockConfig = {
    danger: {
        icon: ShieldAlertIcon,
        accent: "text-red-400",
        ring: "ring-red-400/15",
        bg: "bg-red-500/[0.05]",
        iconBg: "bg-red-500/10",
    },
    warn: {
        icon: AlertTriangleIcon,
        accent: "text-amber-400",
        ring: "ring-amber-400/15",
        bg: "bg-amber-500/[0.04]",
        iconBg: "bg-amber-500/10",
    },
    note: {
        icon: InfoIcon,
        accent: "text-context-400",
        ring: "ring-context-400/15",
        bg: "bg-context-500/[0.05]",
        iconBg: "bg-context-500/10",
    },
} as const

function CustomBlock(
    { type, children }: { type: "danger" | "warn" | "note", children: ReactNode }
) {
    const cfg = blockConfig[type]
    const Icon = cfg.icon

    return (
        <div
            className={cx(
                "my-5 rounded-2xl overflow-hidden",
                "ring-1",
                cfg.ring, cfg.bg
            )}
        >
            <div className="flex gap-4 px-6 py-5">
                <div
                    className={cx(
                        "shrink-0 w-8 h-8 rounded-lg",
                        "flex items-center justify-center",
                        cfg.iconBg
                    )}
                >
                    <Icon size={16} className={cfg.accent} />
                </div>
                <div
                    className={cx(
                        "flex-1 min-w-0 pt-0.5",
                        "text-[14px] text-foreground-200 leading-relaxed",
                        "[&>div:first-child]:mt-0 [&>div:last-child]:mb-0",
                        "[&>h4]:mt-0 [&>h4]:mb-1",
                        "[&>h4]:border-0 [&>h4]:pl-0 [&>h4]:text-[14px]"
                    )}
                >
                    {children}
                </div>
            </div>
        </div>
    )
}

// ---------------------------------------------------------------------------
// Grid — 2-column image grid
// ---------------------------------------------------------------------------
function Grid({ children }: { children: ReactNode }) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 my-5">
            {children}
        </div>
    )
}

// ---------------------------------------------------------------------------
// WikiImage — resolves /assets/ paths to GitHub raw or local API
// ---------------------------------------------------------------------------
function WikiImage(
    { src, alt, ...props }: React.ImgHTMLAttributes<HTMLImageElement>
) {
    let resolvedSrc = typeof src === "string" ? src : ""

    if (resolvedSrc.startsWith("/assets/")) {
        resolvedSrc = `${WIKI_ASSETS_BASE}${resolvedSrc.replace("/assets", "")}`
    }

    return (
        <img // eslint-disable-line @next/next/no-img-element
            src={resolvedSrc}
            alt={alt || ""}
            className="rounded-lg max-w-full my-4 ring-1 ring-white/[0.06]"
            loading="lazy"
            {...props}
        />
    )
}

// ---------------------------------------------------------------------------
// WikiLink — internal Next.js Link or external anchor
// ---------------------------------------------------------------------------
const linkCls = cx(
    "text-context-400 hover:text-context-300 transition-colors",
    "underline underline-offset-[3px]",
    "decoration-context-500/25 hover:decoration-context-500/50"
)

function WikiLink(
    { href, children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>
) {
    if (!href) return <span {...props}>{children}</span>

    if (href.startsWith("http")) {
        return (
            <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className={linkCls}
                {...props}
            >
                {children}
            </a>
        )
    }

    return (
        <Link href={href} className={linkCls}>
            {children}
        </Link>
    )
}

// ---------------------------------------------------------------------------
// Headings — with anchor IDs for TOC linking
// ---------------------------------------------------------------------------
function Heading2(
    { children, ...props }: React.HTMLAttributes<HTMLHeadingElement>
) {
    const id = slugify(extractText(children))
    return (
        <h2
            id={id}
            className={cx(
                "text-[22px] font-semibold text-foreground-000",
                "tracking-[-0.01em] leading-snug",
                "mt-12 mb-4 scroll-mt-24 first:mt-0"
            )}
            style={geistFont}
            {...props}
        >
            {children}
        </h2>
    )
}

function Heading3(
    { children, ...props }: React.HTMLAttributes<HTMLHeadingElement>
) {
    const id = slugify(extractText(children))
    return (
        <h3
            id={id}
            className={cx(
                "text-[18px] font-semibold text-foreground-000",
                "tracking-[-0.01em] leading-snug",
                "mt-8 mb-3 scroll-mt-24"
            )}
            style={geistFont}
            {...props}
        >
            {children}
        </h3>
    )
}

// ---------------------------------------------------------------------------
// Kbd — keyboard key badge
// ---------------------------------------------------------------------------
function Kbd({ children }: { children: ReactNode }) {
    return (
        <kbd
            className={cx(
                "inline-flex items-center px-[7px] py-[2px] mx-[2px]",
                "text-[12px] font-medium leading-tight",
                "text-foreground-100 bg-white/[0.06]",
                "rounded-[5px] ring-1 ring-white/[0.1]",
                "shadow-[0_1px_0_rgba(255,255,255,0.04)]",
                "whitespace-nowrap align-baseline"
            )}
        >
            {children}
        </kbd>
    )
}

// ---------------------------------------------------------------------------
// Component map exported for MDXRemote
// ---------------------------------------------------------------------------
export const wikiComponents = {
    FatLink,
    Collapse,
    CollapseBlock,
    CustomBlock,
    Grid,
    kbd: Kbd,
    h1: () => null,
    h2: Heading2,
    h3: Heading3,
    h4: ({ children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
        <h4
            className={cx(
                "text-[16px] font-semibold text-foreground-000",
                "mt-6 mb-2",
                "pl-3.5 border-l-[3px] border-context-500/40"
            )}
            style={geistFont}
            {...props}
        >
            {children}
        </h4>
    ),
    p: ({ children, ...props }: React.HTMLAttributes<HTMLParagraphElement>) => (
        <div
            className="text-[15px] text-foreground-200/80 leading-[1.8] mb-3"
            {...(props as React.HTMLAttributes<HTMLDivElement>)}
        >
            {children}
        </div>
    ),
    a: WikiLink,
    img: WikiImage,
    ul: ({ children, ...props }: React.HTMLAttributes<HTMLUListElement>) => (
        <ul
            className={cx(
                "text-[15px] text-foreground-200/80 leading-[1.8]",
                "space-y-1 mb-4 ml-5",
                "list-disc list-outside",
                "marker:text-foreground-500/60"
            )}
            {...props}
        >
            {children}
        </ul>
    ),
    ol: ({ children, ...props }: React.HTMLAttributes<HTMLOListElement>) => (
        <ol
            className={cx(
                "text-[15px] text-foreground-200/80 leading-[1.8]",
                "space-y-1 mb-4 ml-5",
                "list-decimal list-outside",
                "marker:text-foreground-500/60"
            )}
            {...props}
        >
            {children}
        </ol>
    ),
    pre: ({ children, ...props }: React.HTMLAttributes<HTMLPreElement>) => (
        <pre
            className={cx(
                "bg-white/[0.03] rounded-xl p-5 my-5",
                "overflow-x-auto text-[13px] leading-relaxed",
                "ring-1 ring-white/[0.06]",
                "text-foreground-200"
            )}
            {...props}
        >
            {children}
        </pre>
    ),
    code: ({ children, ...props }: React.HTMLAttributes<HTMLElement>) => (
        <code
            className={cx(
                "bg-white/[0.06] px-1.5 py-0.5 rounded",
                "text-[13px] text-context-400/90 font-medium"
            )}
            {...props}
        >
            {children}
        </code>
    ),
    hr: () => (
        <hr
            className={cx(
                "border-0 h-px my-10",
                "bg-gradient-to-r from-transparent via-white/[0.08] to-transparent"
            )}
        />
    ),
    blockquote: (
        { children, ...props }: React.HTMLAttributes<HTMLQuoteElement>
    ) => (
        <blockquote
            className={cx(
                "border-l-[3px] border-white/[0.1] pl-5 my-5",
                "text-foreground-200/60 italic text-[15px] leading-[1.8]"
            )}
            {...props}
        >
            {children}
        </blockquote>
    ),
    strong: ({ children, ...props }: React.HTMLAttributes<HTMLElement>) => (
        <strong className="font-semibold text-foreground-000" {...props}>
            {children}
        </strong>
    ),
    table: ({ children, ...props }: React.HTMLAttributes<HTMLTableElement>) => (
        <div className="overflow-x-auto my-6">
            <table
                className="w-full text-[14px] border-collapse"
                {...props}
            >
                {children}
            </table>
        </div>
    ),
    thead: ({ children, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) => (
        <thead className="border-b border-white/[0.08]" {...props}>
            {children}
        </thead>
    ),
    tbody: ({ children, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) => (
        <tbody {...props}>{children}</tbody>
    ),
    tr: ({ children, ...props }: React.HTMLAttributes<HTMLTableRowElement>) => (
        <tr
            className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors"
            {...props}
        >
            {children}
        </tr>
    ),
    th: ({ children, ...props }: React.HTMLAttributes<HTMLTableCellElement>) => (
        <th
            className={cx(
                "text-left py-2.5 px-4 text-[12px] uppercase tracking-wider",
                "text-foreground-500 font-medium"
            )}
            {...(props as React.ThHTMLAttributes<HTMLTableCellElement>)}
        >
            {children}
        </th>
    ),
    td: ({ children, ...props }: React.HTMLAttributes<HTMLTableCellElement>) => (
        <td
            className="py-3 px-4 text-foreground-200 leading-snug align-top"
            {...(props as React.TdHTMLAttributes<HTMLTableCellElement>)}
        >
            {children}
        </td>
    ),
    figure: ({ children }: { children: ReactNode }) => (
        <figure className="my-5">{children}</figure>
    ),
    figcaption: ({ children }: { children: ReactNode }) => (
        <figcaption
            className={cx(
                "text-[13px] text-foreground-500 mt-2 text-center italic"
            )}
        >
            {children}
        </figcaption>
    ),
}
