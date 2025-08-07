import { Node, mergeAttributes } from "@tiptap/core";
import type { ExtensionMeta } from "./index";

export const LayoutColumn = Node.create({
  name: "layoutColumn",
  group: "block",
  content: "block+",
  defining: true,
  isolating: true,

  parseHTML() {
    return [
      {
        tag: 'div[data-type="layout-column"]',
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
