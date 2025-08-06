import Heading, { type Level } from "@tiptap/extension-heading";
import type { ExtensionMeta } from "./index";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    heading_variant: {
      setHeadingVariant: (variant: string | null) => ReturnType;
    };
  }
}

export const CustomHeading = Heading.extend({
  name: "heading",

  addOptions() {
    return {
      ...this.parent?.(),
      levels: [1, 2, 3, 4, 5, 6] as Level[],
    };
  },

  addAttributes() {
    return {
      ...this.parent?.(),
      variant: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-variant"),
        renderHTML: ({ variant, level }) => {
          return {
            ...(variant && {
              class: `heading${level}`,
              "data-variant": variant,
            }),
          };
        },
      },
      spaceBefore: {
        default: null,
        parseHTML: (el) => el.getAttribute("data-space-before"),
        renderHTML: (attrs) =>
          attrs.spaceBefore ? { "data-space-before": attrs.spaceBefore } : {},
      },
      spaceAfter: {
        default: null,
        parseHTML: (el) => el.getAttribute("data-space-after"),
        renderHTML: (attrs) =>
          attrs.spaceAfter ? { "data-space-after": attrs.spaceAfter } : {},
      },
    };
  },

  addCommands() {
    return {
      ...this.parent?.(),
      setHeadingVariant:
        (variant: string | null) =>
        ({ commands }) => {
          return commands.updateAttributes("heading", { variant });
        },
    };
  },
});

const extension: ExtensionMeta = {
  name: "heading",
  title: "Heading",
  package: "custom/heading",
  group: "node",
  defaults: {},
  options: [],
  load() {
    return CustomHeading.configure({
      levels: [1, 2, 3, 4, 5, 6],
    });
  },
};

export default extension;
