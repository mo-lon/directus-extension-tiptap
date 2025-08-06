import { OrderedList } from "@tiptap/extension-ordered-list";
import { mergeAttributes } from "@tiptap/core";
import type { ExtensionMeta } from "./index";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    ordered_list_variant: {
      toggleOrderedList: () => ReturnType;
      setListVariant: (variant: string | null) => ReturnType;
    };
  }
}

export const CustomOrderedList = OrderedList.extend({
  name: "orderedList",
  addAttributes() {
    return {
      variant: {
        default: "decimal",
        parseHTML: (element) =>
          element.getAttribute("data-variant") || "decimal",
        renderHTML: (attributes) => {
          return mergeAttributes(attributes, {
            "data-variant": attributes.variant,
            class: `list-variant-${attributes.variant}`,
          });
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
      toggleOrderedList:
        () =>
        ({ commands }) => {
          return commands.toggleList("orderedList", "listItem");
        },
      setListVariant:
        (variant: string | null) =>
        ({ commands }) => {
          return commands.updateAttributes("orderedList", { variant });
        },
    };
  },
});

const extension: ExtensionMeta = {
  name: "orderedList",
  title: "Ordered List",
  package: "custom/ordered-list",
  group: "node",
  defaults: {},
  options: [],
  load() {
    return CustomOrderedList;
  },
};
export default extension;
