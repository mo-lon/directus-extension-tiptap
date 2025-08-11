import { Node, mergeAttributes } from "@tiptap/core";
import type { ExtensionMeta } from "./index";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    layoutColumn: {
      setColumnJustify: (value: string) => ReturnType;
      setColumnAlign: (value: string) => ReturnType;
    };
  }
}

export const LayoutColumn = Node.create({
  name: "layoutColumn",
  group: "block",
  content: "block+",
  defining: true,
  isolating: true,

  addAttributes() {
    return {
      justifyContent: {
        default: "flex-start",
        renderHTML: (attributes) => {
          return {
            style: `justify-content: ${attributes.justifyContent || "flex-start"};`,
          };
        },
      },
      alignItems: {
        default: "stretch",
        renderHTML: (attributes) => {
          return {
            style: `align-items: ${attributes.alignItems || "stretch"};`,
          };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="layout-column"]',
        getAttrs: (el) => {
          const style = (el as HTMLElement).style;
          return {
            justifyContent: style.justifyContent || "flex-start",
            alignItems: style.alignItems || "stretch",
          };
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, {
        "data-type": "layout-column",
        class: "layout-column",
      }),
      0,
    ];
  },

  addCommands() {
    return {
      setColumnJustify:
        (value) =>
        ({ commands }) => {
          return commands.updateAttributes(this.name, {
            justifyContent: value,
          });
        },
      setColumnAlign:
        (value) =>
        ({ commands }) => {
          return commands.updateAttributes(this.name, { alignItems: value });
        },
    };
  },
});

const extension: ExtensionMeta = {
  name: "layoutColumn",
  title: "Layout Column",
  package: "custom/layout-column",
  group: "node",
  defaults: {},
  options: [],
  load() {
    return LayoutColumn;
  },
};
export default extension;
