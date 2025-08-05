import type { Editor } from "@tiptap/vue-3";
import { ref, computed } from "vue";

export type LinkType = {
  text: string;
  value: string | null;
  prefix: string[];
  placeholder: string;
  hidePrefix?: boolean;
  noTarget?: boolean;
  newTabDefault?: boolean;
};

interface FileSelection {
  id: string;
  title?: string;
  filename?: string;
  type?: string;
  filesize?: number;
}

export const linkTypes: LinkType[] = [
  {
    text: "External Link",
    value: "external_link",
    prefix: ["http://", "https://"],
    placeholder: "https://",
    newTabDefault: true,
  },
  {
    text: "Internal Link",
    value: "internal_link",
    prefix: ["/"],
    placeholder: "/",
    newTabDefault: false,
  },
  {
    text: "Email",
    value: "email",
    prefix: ["mailto:"],
    placeholder: "mail@example.com",
    hidePrefix: true,
    noTarget: true,
  },
  {
    text: "Phone",
    value: "tel",
    prefix: ["tel:"],
    placeholder: "+1234567890",
    hidePrefix: true,
    noTarget: true,
  },
  {
    text: "File",
    value: "file",
    prefix: [],
    placeholder: "",
    hidePrefix: true,
    noTarget: false,
  },
  {
    text: "Other",
    value: null,
    prefix: [],
    placeholder: "",
  },
];

export function useLink(editor: Editor) {
  const linkHref = ref("");
  const linkTarget = ref("_self");
  const linkRel = ref("");
  const linkTitle = ref("");
  const linkAriaLabel = ref("");
  const linkType = ref("external_link");
  const linkFileSelection = ref<FileSelection | null>(null);

  const linkDrawerOpen = ref(false);

  const selectedLinkType = computed(
    () => linkTypes.find((t) => t.value === linkType.value) ?? linkTypes[0]
  );

  function openLinkDialog() {
    const attrs = editor?.getAttributes("link") ?? {};
    linkHref.value = attrs.href || "";
    linkTarget.value = attrs.target || "_self";
    linkRel.value = attrs.rel || "";
    linkTitle.value = attrs.title || "";
    linkAriaLabel.value = attrs.ariaLabel || "";
    linkType.value = attrs.type || "external_link";

    if (attrs.type === "file" && attrs.href?.startsWith("/assets/")) {
      const fileId = attrs.href.replace("/assets/", "");
      linkFileSelection.value = {
        id: fileId,
        filename: attrs.title || fileId,
      };
    } else {
      linkFileSelection.value = null;
    }

    linkDrawerOpen.value = true;
  }

  function linkSelect(file: Record<string, any>) {
    linkFileSelection.value = {
      id: file.id,
      title: file.title,
      filename: file.filename_download,
      type: file.type,
      filesize: file.filesize,
    };

    // Construct the href from file ID
    linkHref.value = `/assets/${file.id}`;
  }

  function applyLink() {
    const href =
      linkType.value === "file" && linkFileSelection.value?.id
        ? `/assets/${linkFileSelection.value.id}`
        : linkHref.value;
    editor
      ?.chain()
      .focus()
      .extendMarkRange("link")
      .setLink({
        href,
        target: selectedLinkType.value?.noTarget ? null : linkTarget.value,
        rel: linkRel.value,
        title: linkTitle.value,
        ariaLabel: linkAriaLabel.value,
        type: linkType.value,
      })
      .run();

    linkDrawerOpen.value = false;
  }

  function removeLink() {
    editor?.chain().focus().extendMarkRange("link").unsetLink().run();
  }

  return {
    linkHref,
    linkTarget,
    linkRel,
    linkTitle,
    linkAriaLabel,
    linkType,
    linkTypes,
    selectedLinkType,
    linkFileSelection,
    linkDrawerOpen,
    openLinkDialog,
    applyLink,
    removeLink,
    linkSelect,
  };
}
