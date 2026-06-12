import { visit } from "unist-util-visit"

// Transforms :kbd[text] directive into <kbd>text</kbd>
export function remarkKbd() {
    return (tree: any) => {
        visit(tree, (node: any) => {
            if (node.type === "textDirective" && node.name === "kbd") {
                const data = node.data || (node.data = {})
                data.hName = "kbd"
            }
        })
    }
}
