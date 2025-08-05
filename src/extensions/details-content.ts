import DetailsContent from "@tiptap/extension-details-content";
import type { ExtensionMeta } from "./index";

const extension: ExtensionMeta = {
  name: "detailsContent",
  title: "Details Content",
  package: "@tiptap/extension-details-content",
  group: "node",
  defaults: {},
  options: [],
  load() {
    return DetailsContent;
  },
};

export default extension;
