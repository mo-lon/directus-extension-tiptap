import { Table, type TableOptions } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import { Extension } from "@tiptap/core";
import type { ExtensionMeta } from "./index";

// Wrapper for all Table extensions
const TableKit = Extension.create<TableOptions>({
  name: "tableKit",

  addExtensions() {
    return [Table.configure(this.options), TableRow, TableCell, TableHeader];
  },
});

type Options = Pick<TableOptions, "resizable">;

const defaults: Options = {
  resizable: false,
};

export type TableProps = {
  tableResizable?: Options["resizable"];
};

const extension: ExtensionMeta<Options, TableProps> = {
  name: "table",
  title: "Table",
  package: "@tiptap/extension-table",
  group: "node",
  defaults,
  options: [
    {
      field: "tableResizable",
      name: "Table resizable",
      type: "boolean",
      meta: {
        interface: "boolean",
        width: "half",
      },
      schema: {
        default_value: defaults.resizable,
      },
    },
  ],
  load(props) {
    return TableKit.configure({
      resizable: props.tableResizable ?? defaults.resizable,
    });
  },
};

export default extension;
