import { BulletList } from "@tiptap/extension-bullet-list";
import { mergeAttributes } from "@tiptap/core";
import type { ExtensionMeta } from "./index";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    bullet_list_variant: {
      setListVariant: (variant: string | null) => ReturnType;
      toggleBulletList: () => ReturnType;
    };
  }
}

const CustomBulletList = BulletList.extend({
  name: "bulletList",
  addAttributes() {
    return {
      variant: {
        default: "default",
        parseHTML: (element) =>
          element.getAttribute("data-variant") || "default",
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
      toggleBulletList:
        () =>
        ({ commands }) => {
          return commands.toggleList("bulletList", "listItem");
        },
      setListVariant:
        (variant: string | null) =>
        ({ commands }) => {
          return commands.updateAttributes("bulletList", { variant });
        },
    };
  },
});

const extension: ExtensionMeta = {
  name: "bulletList",
  title: "Bullet List",
  package: "custom/bullet-list",
  group: "node",
  defaults: {},
  options: [],
  load() {
    return CustomBulletList;
  },
};
export default extension;
