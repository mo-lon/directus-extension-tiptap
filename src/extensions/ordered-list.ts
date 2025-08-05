import { OrderedList } from "@tiptap/extension-ordered-list";
import { mergeAttributes } from "@tiptap/core";
import type { ExtensionMeta } from "./index";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    ordered_list_variant: {
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
