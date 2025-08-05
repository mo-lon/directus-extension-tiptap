import type { ExtensionMeta } from "./index";
import { TextStyle } from "@tiptap/extension-text-style";

const extension: ExtensionMeta = {
  name: "textStyle",
  title: "Text Style",
  package: "@tiptap/extension-text-style",
  group: "mark",
  options: [],
  defaults: {},
  load() {
    return TextStyle.configure({});
  },
};

export default extension;
