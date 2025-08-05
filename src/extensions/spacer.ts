import { Node, mergeAttributes } from "@tiptap/core";
import type { ExtensionMeta } from "./index";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    spacer: {
      insertSpacer: (variant: SpacerVariant) => ReturnType;
    };
  }
}

export type SpacerVariant =
  | "xs"
  | "sm"
  | "md"
  | "lg"
  | "xl"
  | "2xl"
  | "3xl"
  | "4xl"
  | "5xl"
  | "6xl"
  | "7xl";

export const Spacer = Node.create({
  name: "spacer",

  group: "block",

  atom: true,

  selectable: true,

  addAttributes() {
    return {
      variant: {
        default: "md",
        parseHTML: (element) => element.getAttribute("data-variant") || "md",
        renderHTML: ({ variant }) => ({
          "data-variant": variant,
          class: `spacer spacer-${variant}`,
        }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="spacer"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes({ "data-type": "spacer" }, HTMLAttributes)];
  },

  addCommands() {
    return {
      insertSpacer:
        (variant: SpacerVariant) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: { variant },
          });
        },
    };
  },
});

const extension: ExtensionMeta = {
  name: "spacer",
  title: "Spacer",
  package: "custom/spacer",
  group: "node",
  defaults: {},
  options: [],
  load() {
    return Spacer;
  },
};

export default extension;
