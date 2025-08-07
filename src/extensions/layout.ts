import { Node, findParentNode, mergeAttributes } from "@tiptap/core";
import type { ExtensionMeta } from "./index";
import { NodeSelection } from "@tiptap/pm/state";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    layout: {
      insertLayout: (columns: number) => ReturnType;
      setLayout: (columns: number) => ReturnType;
      unsetLayout: () => ReturnType;
    };
  }
}

export const Layout = Node.create({
  name: "layout",
  group: "block",
  content: "layoutColumn+",
  defining: true,
  isolating: true,

  addAttributes() {
    return {
      columns: {
        default: 2,
        parseHTML: (el) => Number(el.getAttribute("data-columns")) || 2,
        renderHTML: (attrs) => ({ "data-columns": attrs.columns }),
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="layout-block"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, {
        "data-type": "layout-block",
        class: "layout-block",
      }),
      0,
    ];
  },

  addCommands() {
    return {
      insertLayout:
        (columns = 2) =>
        ({ commands }) => {
          const content = Array.from({ length: columns }, () => ({
            type: "layoutColumn",
            content: [{ type: "paragraph" }],
          }));

          return commands.insertContent({
            type: this.name,
            attrs: { columns },
            content,
          });
        },

      unsetLayout:
        () =>
        ({ state, tr, dispatch }) => {
          const { layout } = state.schema.nodes;

          const parent = findParentNode((node) => node.type === layout)(
            state.selection
          );

          if (!parent) return false;

          tr.delete(parent.pos, parent.pos + parent.node.nodeSize);

          if (dispatch) dispatch(tr);

          return true;
        },

      setLayout:
        (columns: number) =>
        ({ state, commands }) => {
          const { $from } = state.selection;
          const node = $from.node(-1);
          if (node.type.name !== "layout") {
            return false;
          }
          return commands.updateAttributes("layout", { columns });
        },
    };
  },
});

const extension: ExtensionMeta = {
  name: "layout",
  title: "Layout",
  package: "custom/layout",
  group: "node",
  defaults: {},
  options: [],
  load() {
    return Layout;
  },
};
export default extension;
