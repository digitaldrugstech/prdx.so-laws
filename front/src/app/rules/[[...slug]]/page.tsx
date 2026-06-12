import { findNavItem, flattenLaws, getLawsContent, getLawsNavigation } from "@/data/laws"
import { cx } from "@/cva"
import { wikiComponents } from "@/app/wiki/_components/mdx-components"
import { ArrowLeftIcon, ArrowRightIcon } from "lucide-react"
import { Metadata } from "next"
import { MDXRemote } from "next-mdx-remote/rsc"
import Link from "next/link"
import { notFound } from "next/navigation"
import remarkGfm from "remark-gfm"

type Props = {
    params: Promise<{ slug?: string[] }>,
}

export async function generateStaticParams() {
    try {
        const nav = await getLawsNavigation()
        const flat = flattenLaws(nav)
        return flat.map(item => ({ slug: item.slug.split("/") }))
    } catch {
        return []
    }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug } = await params
    if (!slug) return { title: "Правила" }
    const page = await getLawsContent(slug)
    if (!page) return { title: "Не найдено" }
    return { title: page.title }
}

export default async function RulesPage({ params }: Props) {
    const { slug } = await params
    const navigation = await getLawsNavigation()

    if (!slug || slug.length === 0) {
        return (
            <main className="flex-1 min-w-0">
                <h1
                    className={cx(
                        "text-[30px] font-semibold text-foreground-000 tracking-[-0.02em]",
                        "leading-tight mb-8 max-lg:text-2xl max-lg:mb-5"
                    )}
                >
                    Правила сервера
                </h1>
                <div className="flex flex-col gap-6">
                    {navigation.map(section => (
                        <div key={section.slug}>
                            <h2 className="text-[17px] font-semibold text-foreground-100 mb-2">
                                {section.title}
                            </h2>
                            {section.children ? (
                                <ul className="flex flex-col gap-1 ml-1">
                                    {section.children.map(child => (
                                        child.children ? (
                                            <li key={child.slug}>
                                                <span className="text-[13px] text-foreground-400 font-medium">
                                                    {child.title}
                                                </span>
                                                <ul className="flex flex-col gap-0.5 ml-3 mt-0.5">
                                                    {child.children.map(sub => (
                                                        <li key={sub.slug}>
                                                            <Link
                                                                href={`/rules/${sub.slug}`}
                                                                className="text-[13px] text-foreground-300 hover:text-context-500 transition-colors"
                                                            >
                                                                {sub.title}
                                                            </Link>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </li>
                                        ) : (
                                            <li key={child.slug}>
                                                <Link
                                                    href={`/rules/${child.slug}`}
                                                    className="text-[14px] text-foreground-300 hover:text-context-500 transition-colors"
                                                >
                                                    {child.title}
                                                </Link>
                                            </li>
                                        )
                                    ))}
                                </ul>
                            ) : (
                                <Link
                                    href={`/rules/${section.slug}`}
                                    className="text-[14px] text-foreground-300 hover:text-context-500 transition-colors"
                                >
                                    {section.title}
                                </Link>
                            )}
                        </div>
                    ))}
                </div>
            </main>
        )
    }

    const page = await getLawsContent(slug)

    if (!page) {
        const currentSlug = slug.map(s => decodeURIComponent(s)).join("/")
        const folder = findNavItem(navigation, currentSlug)
        if (!folder?.children) notFound()

        return (
            <main className="flex-1 min-w-0 max-w-[720px]">
                <nav className="flex items-center gap-1.5 mb-5 text-[12px] text-foreground-500">
                    <Link href="/rules" className="hover:text-foreground-200 transition-colors">
                        Правила
                    </Link>
                    <span className="text-foreground-300">/</span>
                    <span className="text-foreground-200 truncate">{folder.title}</span>
                </nav>
                <h1 className={cx(
                    "text-[30px] font-semibold text-foreground-000 tracking-[-0.02em]",
                    "leading-tight mb-8 max-lg:text-2xl max-lg:mb-5"
                )}>
                    {folder.title}
                </h1>
                <div className="flex flex-col gap-1">
                    {folder.children.map(child => (
                        child.children ? (
                            <div key={child.slug} className="mb-4">
                                <p className="text-[13px] font-medium text-foreground-400 mb-1.5 px-1">
                                    {child.title}
                                </p>
                                <div className="flex flex-col gap-0.5 ml-2 pl-3 border-l border-white/[0.06]">
                                    {child.children.map(sub => (
                                        <Link
                                            key={sub.slug}
                                            href={`/rules/${sub.slug}`}
                                            className={cx(
                                                "py-2 px-3 rounded-lg text-[14px]",
                                                "text-foreground-200 hover:text-foreground-000 hover:bg-white/[0.04]",
                                                "transition-all duration-150"
                                            )}
                                        >
                                            {sub.title}
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <Link
                                key={child.slug}
                                href={`/rules/${child.slug}`}
                                className={cx(
                                    "py-2 px-3 rounded-lg text-[14px]",
                                    "text-foreground-200 hover:text-foreground-000 hover:bg-white/[0.04]",
                                    "transition-all duration-150"
                                )}
                            >
                                {child.title}
                            </Link>
                        )
                    ))}
                </div>
            </main>
        )
    }

    const flat = flattenLaws(navigation)
    const currentSlug = slug.join("/")
    const currentIndex = flat.findIndex(item => item.slug === currentSlug)
    const prev = currentIndex > 0 ? flat[currentIndex - 1] : null
    const next = currentIndex < flat.length - 1 ? flat[currentIndex + 1] : null

    return (
        <main className="flex-1 min-w-0 max-w-[720px]">
            <nav className="flex items-center gap-1.5 mb-5 text-[12px] text-foreground-500">
                <Link href="/rules" className="hover:text-foreground-200 transition-colors">
                    Правила
                </Link>
                <span className="text-foreground-300">/</span>
                <span className="text-foreground-200 truncate">{page.title}</span>
            </nav>

            <h1
                className={cx(
                    "text-[30px] font-semibold text-foreground-000 tracking-[-0.02em]",
                    "leading-tight mb-8 max-lg:text-2xl max-lg:mb-5"
                )}
            >
                {page.title}
            </h1>

            <article className="wiki-content">
                <MDXRemote
                    source={page.content}
                    components={wikiComponents}
                    options={{ mdxOptions: { remarkPlugins: [remarkGfm] } }}
                />
            </article>

            {(prev || next) && (
                <div
                    className={cx(
                        "grid gap-3 mt-12 pt-5 border-t border-white/[0.06]",
                        prev && next ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1"
                    )}
                >
                    {prev && (
                        <Link
                            href={`/rules/${prev.slug}`}
                            className={cx(
                                "flex items-center gap-3 px-5 py-4 rounded-xl",
                                "border border-white/[0.06]",
                                "hover:border-context-500/30 hover:bg-context-500/[0.03]",
                                "transition-all duration-200 group"
                            )}
                        >
                            <ArrowLeftIcon
                                size={15}
                                className="text-foreground-500 shrink-0 group-hover:text-context-500 transition-colors duration-200"
                            />
                            <div className="flex flex-col min-w-0">
                                <span className="text-[11px] text-foreground-500 uppercase tracking-wider">
                                    Назад
                                </span>
                                <span className="text-[14px] text-foreground-200 truncate group-hover:text-foreground-000 transition-colors duration-200">
                                    {prev.title}
                                </span>
                            </div>
                        </Link>
                    )}
                    {next && (
                        <Link
                            href={`/rules/${next.slug}`}
                            className={cx(
                                "flex items-center gap-3 px-5 py-4 rounded-xl",
                                "border border-white/[0.06]",
                                "hover:border-context-500/30 hover:bg-context-500/[0.03]",
                                "transition-all duration-200 group",
                                !prev && "col-start-2"
                            )}
                        >
                            <div className="flex flex-col min-w-0 flex-1 items-end">
                                <span className="text-[11px] text-foreground-500 uppercase tracking-wider">
                                    Далее
                                </span>
                                <span className="text-[14px] text-foreground-200 truncate group-hover:text-foreground-000 transition-colors duration-200">
                                    {next.title}
                                </span>
                            </div>
                            <ArrowRightIcon
                                size={15}
                                className="text-foreground-500 shrink-0 group-hover:text-context-500 transition-colors duration-200"
                            />
                        </Link>
                    )}
                </div>
            )}
        </main>
    )
}
