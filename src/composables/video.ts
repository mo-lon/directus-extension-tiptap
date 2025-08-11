import type { Editor } from "@tiptap/vue-3";
import { ref } from "vue";

export interface VideoAttributes {
  id?: string;
  src?: string;
  filename?: string;
  controls?: boolean;
  autoplay?: boolean;
  loop?: boolean;
  muted?: boolean;
  captionsSrc?: string;
  captionsLang?: string;
  captionsLabel?: string;
  captionsDefault?: boolean;
}

export function useVideo(editor: Editor) {
  const videoDrawerOpen = ref(false);
  const videoSelection = ref<VideoAttributes | null>(null);

  function videoOpen() {
    if (editor.isActive("video")) {
      videoSelection.value = editor.getAttributes("video") as VideoAttributes;
    } else {
      videoSelection.value = null;
    }
    videoDrawerOpen.value = true;
  }

  function videoClose() {
    videoDrawerOpen.value = false;
    videoSelection.value = null;
  }

  function videoSave() {
    if (videoSelection.value) {
      editor
        .chain()
        .focus()
        .setVideo(videoSelection.value as any)
        .run();
    }
    videoClose();
  }

  function videoSelect(file: any) {
    videoSelection.value = {
      id: file.id,
      src: `/assets/${file.id}`,
      filename: file.filename_download,
      controls: true,
      autoplay: false,
      loop: false,
      muted: false,
    };
  }

  function captionsSelect(file: any) {
    videoSelection.value = {
      ...videoSelection.value,
      captionsSrc: `/assets/${file.id}`,
      captionsLang: "en",
      captionsLabel: "English",
      captionsDefault: true,
    };
  }

  return {
    videoDrawerOpen,
    videoSelection,
    videoSelect,
    captionsSelect,
    videoOpen,
    videoClose,
    videoSave,
  };
}
