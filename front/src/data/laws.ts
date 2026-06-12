import fs from "fs/promises"
import path from "path"
import matter from "gray-matter"
import { cache } from "react"

const LAWS_PATH = path.join(process.cwd(), "laws")
const SKIP_DIRS = new Set(["Идеи"])

export type LawsNavItem = {
    title: string,
    slug: string,
    children?: LawsNavItem[],
    sectionLabel?: string,
    variant?: "reference",
}

export type LawsPage = {
    title: string,
    content: string,
}

export type FlatLawsItem = {
    title: string,
    slug: string,
}

const TOP_LEVEL_SECTIONS: { label: string, items: string[] }[] = [
    {
        label: "",
        items: [
            "Памятка по действующему законодательству prdx.so",
            "Памятка по налогам и сборам",
        ],
    },
    {
        label: "Кодексы",
        items: [
            "Конституция",
            "Уголовно-Административный Кодекс",
            "Процессуальный Кодекс",
            "Судебный Кодекс",
        ],
    },
    {
        label: "Федеральные законы",
        items: [
            "ФЗ Парламенте prdx.so, МКО и Совете Общин",
            "ФЗ О Президенте, Правительстве prdx.so и порядке формирования органов исполнительной власти",
            "ФЗ О федеральных министерствах prdx.so",
            "ФЗ О выборах и референдуме prdx.so",
            "ФЗ Об адвокатуре и адвокатской деятельности prdx.so",
        ],
    },
]

function topLevelPosition(name: string): [sectionIndex: number, itemIndex: number] {
    for (let si = 0; si < TOP_LEVEL_SECTIONS.length; si++) {
        const ii = TOP_LEVEL_SECTIONS[si].items.indexOf(name)
        if (ii !== -1) return [si, ii]
    }
    return [TOP_LEVEL_SECTIONS.length, 0]
}

async function readNavFromDir(dir: string, slugPrefix: string, topLevel = false): Promise<LawsNavItem[]> {
    let entries
    try {
        entries = await fs.readdir(dir, { withFileTypes: true })
    } catch {
        return []
    }

    const items: LawsNavItem[] = []
    const sorted = entries
        .filter(e => !e.name.startsWith("."))
        .sort((a, b) => a.name.localeCompare(b.name, "ru", { numeric: true }))

    for (const entry of sorted) {
        if (entry.isDirectory()) {
            if (SKIP_DIRS.has(entry.name)) continue
            const slug = slugPrefix ? `${slugPrefix}/${entry.name}` : entry.name
            const children = await readNavFromDir(path.join(dir, entry.name), slug)
            items.push({ title: entry.name, slug, children: children.length ? children : undefined })
        } else if (entry.name.endsWith(".md")) {
            const name = entry.name.slice(0, -3)
            const slug = slugPrefix ? `${slugPrefix}/${name}` : name
            items.push({ title: name, slug })
        }
    }

    if (!topLevel) return items

    items.sort((a, b) => {
        const [asi, aii] = topLevelPosition(a.title)
        const [bsi, bii] = topLevelPosition(b.title)
        return asi !== bsi ? asi - bsi : aii - bii
    })

    let lastSection = -1
    for (const item of items) {
        const [si] = topLevelPosition(item.title)
        if (si !== lastSection) {
            lastSection = si
            if (si > 0 && si < TOP_LEVEL_SECTIONS.length) {
                item.sectionLabel = TOP_LEVEL_SECTIONS[si].label
            }
        }
        if (si === 0) item.variant = "reference"
    }

    return items
}

export const getLawsNavigation = cache(async (): Promise<LawsNavItem[]> => {
    return readNavFromDir(LAWS_PATH, "", true)
})

export function flattenLaws(items: LawsNavItem[]): FlatLawsItem[] {
    const flat: FlatLawsItem[] = []
    for (const item of items) {
        if (!item.children) {
            flat.push({ title: item.title, slug: item.slug })
        } else {
            flat.push(...flattenLaws(item.children))
        }
    }
    return flat
}

export function findNavItem(items: LawsNavItem[], slug: string): LawsNavItem | null {
    for (const item of items) {
        if (item.slug === slug) return item
        if (item.children) {
            const found = findNavItem(item.children, slug)
            if (found) return found
        }
    }
    return null
}

export async function getLawsContent(slug: string[]): Promise<LawsPage | null> {
    if (!slug || slug.length === 0) return null
    const decoded = slug.map(s => decodeURIComponent(s))
    const filePath = path.join(LAWS_PATH, ...decoded) + ".md"
    try {
        const raw = await fs.readFile(filePath, "utf-8")
        const { data, content } = matter(raw)
        const title = (data.title as string | undefined) || decoded[decoded.length - 1]
        return { title, content }
    } catch {
        return null
    }
}
