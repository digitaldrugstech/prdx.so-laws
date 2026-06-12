import { visit } from "unist-util-visit"

// Transforms ::figcaption[text] directive into <figcaption>text</figcaption>
export function remarkFigcaption() {
    return (tree: any) => {
        visit(tree, (node: any) => {
            if (node.type === "leafDirective" && node.name === "figcaption") {
                const data = node.data || (node.data = {})
                data.hName = "figcaption"
            }
        })
    }
}
