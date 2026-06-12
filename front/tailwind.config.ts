import type { Config } from "tailwindcss"

const config: Config = {
    content: [
        "./src/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            spacing: {
                4.5: "1.125rem",
                5.5: "1.375rem",
            },
            fontSize: {
                "button-small": ["0.875rem", "1.125rem"],
                "button-small-semibold": ["0.875rem", "1.5rem"],
                "button-base": ["1rem", "1.625rem"],

                "xs": ["13px", {
                    lineHeight: "1.375rem",
                    letterSpacing: "-.1px",
                }],
                "sm": ["0.875rem", "1.5625rem"],
                "base": ["1rem", "1.75rem"],
                "lg": ["1.125rem", "1.875rem"],
                "xl": ["1.25rem", "1.625rem"],
                "2xl": ["1.625rem", "2.125rem"],
                "2.5xl": ["1.75rem", "2.625rem"],
                "3xl": ["2rem", "3rem"],
                "3.5xl": ["2.25rem", "3rem"],
                "4xl": ["2.625rem", "3.5rem"],
            },
            colors: {
                "context-500": "var(--color-context-500)",
                "context-600": "var(--color-context-600)",
                "context-700": "var(--color-context-700)",
                "context-background": "var(--color-context-background)",

                "foreground-000": "var(--color-foreground-000)",
                "foreground-200": "var(--color-foreground-200)",
                "foreground-300": "var(--color-foreground-300)",
                "foreground-500": "var(--color-foreground-500)",
                "foreground-600": "var(--color-foreground-600)",
                "foreground-700": "var(--color-foreground-700)",
                "foreground-900": "var(--color-foreground-900)",

                "background-000": "var(--color-background-000)",
                "background-100": "var(--color-background-100)",
                "background-200": "var(--color-background-200)",
                "background-300": "var(--color-background-300)",
                "background-800": "var(--color-background-800)",
                "background-900": "var(--color-background-900)",

                "red-500": "var(--color-red-500)",
                "red-background": "var(--color-red-background)",

                "yellow-500": "var(--color-yellow-500)",
                "yellow-background": "var(--color-yellow-background)",

                "green-500": "var(--color-green-500)",
                "green-background": "var(--color-green-background)",

                "orange-500": "var(--color-orange-500)",
            },
        },
    },
    plugins: [require("tailwindcss-animate")],
}
export default config
