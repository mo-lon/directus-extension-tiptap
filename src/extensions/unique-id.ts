import type { ExtensionMeta } from "./index";
import type { UniqueIDOptions } from "@tiptap/extension-unique-id";

type Options = Pick<UniqueIDOptions, "attributeName" | "types">;

const defaults: Options = {
  attributeName: "id",
  types: ["heading", "paragraph"],
};

export type UniqueIDProps = {
  uniqueIdAttributeName: UniqueIDOptions["attributeName"];
  uniqueIdTypes: UniqueIDOptions["types"];
};

const extension: ExtensionMeta<Options, UniqueIDProps> = {
  name: "uniqueId",
  title: "Unique ID",
  package: "@tiptap/extension-unique-id",
  group: "editor",
  defaults,
  options: [
    {
      field: "uniqueIdAttributeName",
      name: "Unique ID attribute name",
      type: "string",
      schema: {
        default_value: defaults.attributeName,
      },
      meta: {
        width: "half",
        interface: "input",
        note: "Name of the attribute that is attached to the HTML tag",
        options: {
          placeholder: "id, uid, data-id, ...",
        },
      },
    },
    {
      field: "uniqueIdTypes",
      name: "Unique ID types",
      type: "json",
      schema: {
        // @ts-ignore
        default_value: defaults.types,
      },
      meta: {
        width: "full",
        interface: "select-multiple-dropdown",
        note: "All types that should get a unique ID",
        options: {
          choices: [
            {
              value: "heading",
              text: "heading",
            },
            {
              value: "paragraph",
              text: "paragraph",
            },
          ],
          allowOther: true,
          previewThreshold: 5,
        },
      },
    },
  ],
  load: async (props) => {
    const { UniqueID } = await import("@tiptap/extension-unique-id");
    return UniqueID.configure({
      attributeName: props.uniqueIdAttributeName ?? defaults.attributeName,
      types: props.uniqueIdTypes ?? defaults.types,
    });
  },
};

export default extension;
