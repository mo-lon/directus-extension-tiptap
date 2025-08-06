import Paragraph from "@tiptap/extension-paragraph";
import type { ExtensionMeta } from "./index";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    paragraph_variant: {
      setParagraphVariant: (variant: string | null) => ReturnType;
    };
  }
}

export const ParagraphVariant = Paragraph.extend({
  name: "paragraph",

  addAttributes() {
    return {
      ...this.parent?.(),
      variant: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-variant"),
        renderHTML: (attributes) => {
          const { variant } = attributes;
          return {
            ...(variant && {
              class: `paragraph-${variant}`,
              "data-variant": variant,
            }),
          };
        },
      },
      spaceAfter: {
        default: null,
        parseHTML: (el) => el.getAttribute("data-space-after"),
        renderHTML: (attrs) =>
          attrs.spaceAfter ? { "data-space-after": attrs.spaceAfter } : {},
      },
      spaceBefore: {
        default: null,
        parseHTML: (el) => el.getAttribute("data-space-before"),
        renderHTML: (attrs) =>
          attrs.spaceBefore ? { "data-space-before": attrs.spaceBefore } : {},
      },
    };
  },

  addCommands() {
    return {
      setParagraphVariant:
        (variant: string | null) =>
        ({ commands }) => {
          return commands.updateAttributes("paragraph", { variant });
        },
    };
  },
});

const extension: ExtensionMeta = {
  name: "paragraph",
  title: "Paragraph",
  package: "custom/paragraph-variant",
  group: "node",
  defaults: {},
  options: [],
  load() {
    return ParagraphVariant;
  },
};

export default extension;
