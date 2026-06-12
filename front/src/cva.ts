import { defineConfig } from "cva"
import { extendTailwindMerge } from "tailwind-merge"

export type { VariantProps } from "cva"

const twMerge = extendTailwindMerge({
    extend: {
        classGroups: {
            "font-size": ["text-button-small", "text-button-small-semibold", "text-button-base"],
        },
    },
})

export const { cva, cx, compose } = defineConfig({
    hooks: {
        onComplete: className => twMerge(className),
    },
})
