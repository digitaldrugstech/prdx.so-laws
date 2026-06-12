import matter from "gray-matter"
import { cache } from "react"
import { z } from "zod"
import { env } from "@/env.mjs"

const REPO_OWNER = "digitaldrugstech"
const REPO_NAME = "prdx-wiki"
const BRANCH = "main"
const RAW_BASE = `https://raw.githubusercontent.com/${REPO_OWNER}/${REPO_NAME}/${BRANCH}`
const API_BASE = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}`

const LOCAL_PATH = env.WIKI_LOCAL_PATH
const isLocal = !!LOCAL_PATH

export const WIKI_ASSETS_BASE = isLocal ? "/api/wiki-assets" : `${RAW_BASE}/assets`

export type NavItem = {
    title: string,
    slug: string,
    order: number,
    children?: NavItem[],
}

const treeEntrySchema = z.object({
    path: z.string(),
    type: z.enum(["blob", "tree"]),
})
type TreeEntry = z.infer<typeof treeEntrySchema>

const treeResponseSchema = z.object({
    tree: z.array(treeEntrySchema),
})

function stripNumericPrefix(name: string): string {
    return name.replace(/^\d+-/, "")
}

function getOrder(name: string): number {
    const match = name.match(/^(\d+)-/)
    return match ? parseInt(match[1], 10) : 999
}

function githubHeaders(): HeadersInit {
    const headers: HeadersInit = { Accept: "application/vnd.github.v3+json" }
    if (env.GITHUB_TOKEN) {
        headers.Authorization = `Bearer ${env.GITHUB_TOKEN}`
    }
    return headers
}

// ─── Local filesystem helpers ───────────────────────────────────────────

async function localReadFile(filePath: string): Promise<string | null> {
    const fs = await import("fs/promises")
    const path = await import("path")
    const fullPath = path.resolve(LOCAL_PATH!, filePath)
    try {
        return await fs.readFile(fullPath, "utf-8")
    } catch {
        return null
    }
}

async function localReadDir(dirPath: string): Promise<{ name: string, isDir: boolean }[]> {
    const fs = await import("fs/promises")
    const path = await import("path")
    const fullPath = path.resolve(LOCAL_PATH!, dirPath)
    try {
        const entries = await fs.readdir(fullPath, { withFileTypes: true })
        return entries.map(e => ({ name: e.name, isDir: e.isDirectory() }))
    } catch {
        return []
    }
}

async function localFileExists(filePath: string): Promise<boolean> {
    const fs = await import("fs/promises")
    const path = await import("path")
    const fullPath = path.resolve(LOCAL_PATH!, filePath)
    try {
        await fs.stat(fullPath)
        return true
    } catch {
        return false
    }
}

async function localGetTitle(filePath: string): Promise<string | null> {
    const raw = await localReadFile(filePath)
    if (!raw) return null
    const { data } = matter(raw)
    return data.title || null
}

const getLocalNavigation = cache(async (): Promise<NavItem[]> => {
    const entries = await localReadDir("pages")
    const topDirs = entries
        .filter(e => e.isDir)
        .sort((a, b) => getOrder(a.name) - getOrder(b.name))

    const navItems: NavItem[] = []

    for (const dir of topDirs) {
        const slug = stripNumericPrefix(dir.name)
        const title = await localGetTitle(`pages/${dir.name}/index.mdx`) || stripNumericPrefix(dir.name)

        const children: NavItem[] = []
        const childEntries = await localReadDir(`pages/${dir.name}`)

        for (const child of childEntries) {
            if (child.name === "index.mdx") continue

            if (!child.isDir && child.name.endsWith(".mdx")) {
                const childName = child.name.replace(".mdx", "")
                const childTitle = await localGetTitle(`pages/${dir.name}/${child.name}`)
                children.push({
                    title: childTitle || stripNumericPrefix(childName),
                    slug: `${slug}/${stripNumericPrefix(childName)}`,
                    order: getOrder(childName),
                })
            }

            if (child.isDir) {
                const childSlug = `${slug}/${stripNumericPrefix(child.name)}`
                const childTitle = await localGetTitle(`pages/${dir.name}/${child.name}/index.mdx`)
                    || stripNumericPrefix(child.name)

                const subEntries = await localReadDir(`pages/${dir.name}/${child.name}`)
                const subChildren: NavItem[] = []

                for (const sub of subEntries) {
                    if (sub.name === "index.mdx" || sub.isDir || !sub.name.endsWith(".mdx")) continue
                    const subName = sub.name.replace(".mdx", "")
                    const subTitle = await localGetTitle(
                        `pages/${dir.name}/${child.name}/${sub.name}`
                    )
                    subChildren.push({
                        title: subTitle || stripNumericPrefix(subName),
                        slug: `${childSlug}/${stripNumericPrefix(subName)}`,
                        order: getOrder(subName),
                    })
                }

                subChildren.sort((a, b) => a.order - b.order)
                children.push({
                    title: childTitle,
                    slug: childSlug,
                    order: getOrder(child.name),
                    children: subChildren.length > 0 ? subChildren : undefined,
                })
            }
        }

        children.sort((a, b) => a.order - b.order)
        navItems.push({
            title,
            slug,
            order: getOrder(dir.name),
            children: children.length > 0 ? children : undefined,
        })
    }

    return navItems
})

async function localFindMdxFile(slug: string[]): Promise<string | null> {
    if (!slug || slug.length === 0) {
        return await localFileExists("pages/index.mdx") ? "pages/index.mdx" : null
    }

    let currentDir = "pages"
    for (let i = 0; i < slug.length; i++) {
        const part = slug[i]
        const isLast = i === slug.length - 1
        const entries = await localReadDir(currentDir)

        const match = entries.find(e => stripNumericPrefix(e.name.replace(".mdx", "")) === part)
        if (!match) return null

        if (isLast) {
            if (!match.isDir && match.name.endsWith(".mdx")) {
                return `${currentDir}/${match.name}`
            }
            if (match.isDir) {
                const indexPath = `${currentDir}/${match.name}/index.mdx`
                return await localFileExists(indexPath) ? indexPath : null
            }
        } else {
            if (match.isDir) {
                currentDir = `${currentDir}/${match.name}`
            } else {
                return null
            }
        }
    }
    return null
}

async function localGetWikiContent(slug: string[]): Promise<WikiPage | null> {
    const filePath = await localFindMdxFile(slug)
    if (!filePath) return null

    const raw = await localReadFile(filePath)
    if (!raw) return null

    const { data, content } = matter(raw)
    return {
        title: data.title || "",
        content,
        raw,
        filePath,
    }
}

// ─── GitHub (remote) helpers ────────────────────────────────────────────

const fetchGitHubTree = cache(async (): Promise<TreeEntry[]> => {
    try {
        const res = await fetch(`${API_BASE}/git/trees/${BRANCH}?recursive=1`, {
            next: { revalidate: 3600 },
            headers: githubHeaders(),
        })

        if (!res.ok) {
            console.error(`[wiki] GitHub tree API error: ${res.status}`)
            return []
        }

        const data = await res.json()
        const parsed = treeResponseSchema.safeParse(data)
        if (!parsed.success) {
            console.error("[wiki] GitHub tree response parse error:", parsed.error)
            return []
        }
        return parsed.data.tree
    } catch {
        console.error("[wiki] GitHub tree fetch failed")
        return []
    }
})

async function fetchTitlesForPaths(paths: string[]): Promise<Map<string, string>> {
    const titles = new Map<string, string>()

    await Promise.all(
        paths.map(async (path) => {
            try {
                const res = await fetch(`${RAW_BASE}/${path}`, {
                    next: { revalidate: 3600 },
                })
                if (!res.ok) return

                const raw = await res.text()
                const { data } = matter(raw)
                if (data.title) {
                    titles.set(path, data.title)
                }
            } catch {
                // skip
            }
        })
    )

    return titles
}

const getRemoteNavigation = cache(async (): Promise<NavItem[]> => {
    const tree = await fetchGitHubTree()
    const pageFiles = tree.filter(
        e => e.path.startsWith("pages/") && e.path.endsWith(".mdx")
    )

    // Fetch titles for ALL pages (not just index files)
    const allNonRootPages = pageFiles.filter(e => e.path !== "pages/index.mdx")
    const titles = await fetchTitlesForPaths(allNonRootPages.map(e => e.path))

    const topDirs = tree
        .filter(e =>
            e.type === "tree"
            && e.path.startsWith("pages/")
            && e.path.split("/").length === 2
        )
        .sort((a, b) => getOrder(a.path.split("/")[1]) - getOrder(b.path.split("/")[1]))

    const navItems: NavItem[] = []

    for (const dir of topDirs) {
        const dirName = dir.path.split("/")[1]
        const slug = stripNumericPrefix(dirName)
        const indexPath = `${dir.path}/index.mdx`
        const title = titles.get(indexPath) || stripNumericPrefix(dirName)

        const childFiles = pageFiles.filter(
            e =>
                e.path.startsWith(dir.path + "/")
                && !e.path.endsWith("/index.mdx")
                && e.path.split("/").length === 3
        )

        const childDirs = tree.filter(
            e =>
                e.type === "tree"
                && e.path.startsWith(dir.path + "/")
                && e.path.split("/").length === 3
        )

        const children: NavItem[] = []

        for (const child of childFiles) {
            const childName = child.path.split("/").pop()!.replace(".mdx", "")
            children.push({
                title: titles.get(child.path) || stripNumericPrefix(childName),
                slug: `${slug}/${stripNumericPrefix(childName)}`,
                order: getOrder(childName),
            })
        }

        for (const childDir of childDirs) {
            const childDirName = childDir.path.split("/").pop()!
            const childSlug = `${slug}/${stripNumericPrefix(childDirName)}`
            const childIndexPath = `${childDir.path}/index.mdx`
            const childTitle = titles.get(childIndexPath) || stripNumericPrefix(childDirName)

            const subFiles = pageFiles.filter(
                e =>
                    e.path.startsWith(childDir.path + "/")
                    && !e.path.endsWith("/index.mdx")
            )

            const subChildren = subFiles.map((sf) => {
                const sfName = sf.path.split("/").pop()!.replace(".mdx", "")
                return {
                    title: titles.get(sf.path) || stripNumericPrefix(sfName),
                    slug: `${childSlug}/${stripNumericPrefix(sfName)}`,
                    order: getOrder(sfName),
                }
            }).sort((a, b) => a.order - b.order)

            children.push({
                title: childTitle,
                slug: childSlug,
                order: getOrder(childDirName),
                children: subChildren.length > 0 ? subChildren : undefined,
            })
        }

        children.sort((a, b) => a.order - b.order)

        navItems.push({
            title,
            slug,
            order: getOrder(dirName),
            children: children.length > 0 ? children : undefined,
        })
    }

    return navItems
})

async function remoteFindMdxFile(slug: string[]): Promise<string | null> {
    if (!slug || slug.length === 0) {
        return "pages/index.mdx"
    }

    const tree = await fetchGitHubTree()
    const pageFiles = tree
        .filter(e => e.path.startsWith("pages/") && e.path.endsWith(".mdx"))
        .map(e => e.path)

    const basePath = `pages/${slug.join("/")}`

    if (pageFiles.includes(basePath + ".mdx")) {
        return basePath + ".mdx"
    }

    if (pageFiles.includes(basePath + "/index.mdx")) {
        return basePath + "/index.mdx"
    }

    const parts = slug
    let currentPath = "pages"

    for (let i = 0; i < parts.length; i++) {
        const part = parts[i]
        const isLast = i === parts.length - 1

        const candidates = tree
            .filter(e =>
                e.path.startsWith(currentPath + "/")
                && e.path.split("/").length === currentPath.split("/").length + 1
            )

        const match = candidates.find((c) => {
            const name = c.path.split("/").pop()!.replace(".mdx", "")
            return stripNumericPrefix(name) === part
        })

        if (!match) return null

        if (isLast) {
            if (match.type === "blob" && match.path.endsWith(".mdx")) {
                return match.path
            }
            if (match.type === "tree") {
                const indexPath = match.path + "/index.mdx"
                if (pageFiles.includes(indexPath)) {
                    return indexPath
                }
            }
        } else {
            if (match.type === "tree") {
                currentPath = match.path
            } else {
                return null
            }
        }
    }

    return null
}

async function remoteGetWikiContent(slug: string[]): Promise<WikiPage | null> {
    const filePath = await remoteFindMdxFile(slug)
    if (!filePath) return null

    try {
        const res = await fetch(`${RAW_BASE}/${filePath}`, {
            next: { revalidate: 3600 },
        })

        if (!res.ok) return null

        const raw = await res.text()
        const { data, content } = matter(raw)

        return {
            title: data.title || "",
            content,
            raw,
            filePath,
        }
    } catch {
        console.error(`[wiki] fetch failed for ${filePath}`)
        return null
    }
}

// ─── Public API (delegates to local or remote) ─────────────────────────

export type WikiPage = {
    title: string,
    content: string,
    raw: string,
    filePath: string,
}

export type FlatNavItem = {
    title: string,
    slug: string,
}

export const getWikiNavigation = cache(async (): Promise<NavItem[]> => {
    return isLocal ? getLocalNavigation() : getRemoteNavigation()
})

export function flattenNavigation(items: NavItem[]): FlatNavItem[] {
    const flat: FlatNavItem[] = []
    for (const item of items) {
        flat.push({ title: item.title, slug: item.slug })
        if (item.children) {
            flat.push(...flattenNavigation(item.children))
        }
    }
    return flat
}

export async function getAllWikiSlugs(): Promise<string[][]> {
    const nav = await getWikiNavigation()
    const flat = flattenNavigation(nav)
    return flat.map(item => item.slug.split("/"))
}

export async function getWikiContent(slug: string[]): Promise<WikiPage | null> {
    return isLocal ? localGetWikiContent(slug) : remoteGetWikiContent(slug)
}

export async function getLastModified(filePath: string): Promise<string | null> {
    if (isLocal) return null

    try {
        const res = await fetch(
            `${API_BASE}/commits?path=${encodeURIComponent(filePath)}&per_page=1`,
            {
                next: { revalidate: 3600 },
                headers: githubHeaders(),
            }
        )
        if (!res.ok) return null
        const commits = await res.json()
        if (!Array.isArray(commits) || commits.length === 0) return null
        return commits[0]?.commit?.committer?.date ?? null
    } catch {
        return null
    }
}

export function getGitHubEditUrl(filePath: string): string {
    return `https://github.com/${REPO_OWNER}/${REPO_NAME}/edit/${BRANCH}/${filePath}`
}

export function extractHeadings(content: string): { id: string, text: string, level: number }[] {
    const headingRegex = /^(#{2,3})\s+(.+)$/gm
    const headings: { id: string, text: string, level: number }[] = []
    let match

    while ((match = headingRegex.exec(content)) !== null) {
        const level = match[1].length
        const text = match[2].trim()
        const id = text
            .toLowerCase()
            .replace(/[^a-zA-Z0-9\u0400-\u04FF\s-]/g, "")
            .replace(/\s+/g, "-")

        headings.push({ id, text, level })
    }

    return headings
}
