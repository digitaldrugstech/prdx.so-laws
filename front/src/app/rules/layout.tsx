import { getLawsNavigation } from "@/data/laws"
import { Metadata } from "next"
import { ReactNode } from "react"
import LawsSidebar from "./_components/laws-sidebar"
import LawsMobileNav from "./_components/laws-mobile-nav"

export const revalidate = 3600

export const metadata: Metadata = {
    title: {
        default: "Правила",
        template: "%s | Правила",
    },
    description: "Законодательство и правовые документы сервера prdx.so",
}

export default async function RulesLayout({ children }: { children: ReactNode }) {
    const navigation = await getLawsNavigation()

    return (
        <div className="flex justify-center w-full">
            <div className="flex gap-8 w-full max-w-[1440px] px-12 py-10 max-lg:px-4 max-lg:py-6">
                <LawsSidebar navigation={navigation} />
                {children}
                <LawsMobileNav navigation={navigation} />
            </div>
        </div>
    )
}
