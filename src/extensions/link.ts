import { Mark, mergeAttributes } from "@tiptap/core";
import type { ExtensionMeta } from "./index";

declare module "@tiptap/core" {
  interface LinkOptions {
    autolink: boolean;
    openOnClick: boolean;
    linkOnPaste: boolean;
  }

  interface Commands<ReturnType> {
    link: {
      setLink: (attributes: Record<string, any>) => ReturnType;
      unsetLink: () => ReturnType;
    };
  }
}

const CustomLink = Mark.create({
  name: "link",

  inclusive: false,

  addAttributes() {
    return {
      href: {
        default: null,
      },
      target: {
        default: null,
      },
      rel: {
        default: null,
      },
      title: {
        default: null,
      },
      ariaLabel: {
        default: null,
      },
      type: {
        default: "external_link",
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: "a[href]",
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ["a", mergeAttributes(HTMLAttributes), 0];
  },

  addCommands() {
    return {
      setLink:
        (attrs) =>
        ({ chain }) =>
          chain().setMark(this.name, attrs).run(),

      unsetLink:
        () =>
        ({ chain }) =>
          chain().unsetMark(this.name).run(),
    };
  },

  addKeyboardShortcuts() {
    return {
      "Mod-k": () => this.editor.commands.setLink({ href: "" }),
    };
  },
});

const extension: ExtensionMeta = {
  name: "link",
  title: "Link",
  package: "custom/link",
  group: "mark",
  defaults: {},
  options: [],
  load() {
    return CustomLink;
  },
};

export default extension;
