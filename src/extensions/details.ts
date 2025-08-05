import Details from "@tiptap/extension-details";
import type { ExtensionMeta } from "./index";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    custom_details: {
      toggleDetails: () => ReturnType;
    };
  }
}

const CustomDetails = Details.extend({
  name: "details",

  addCommands() {
    return {
      ...this.parent?.(),
      toggleDetails:
        () =>
        ({ commands }) => {
          const isActive = this.options?.HTMLAttributes?.open;
          return isActive ? commands.unsetDetails() : commands.setDetails();
        },
    };
  },
});

const extension: ExtensionMeta = {
  name: "details",
  title: "Details",
  package: "@tiptap/extension-details",
  group: "node",
  defaults: {},
  options: [],
  load() {
    return CustomDetails;
  },
};

export default extension;
