import * as DocumentPicker from "expo-document-picker";
import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";

import type { ExportPayload } from "@/types";

export const shareBackupFile = async (payload: ExportPayload) => {
  const fileName = `speakeasy-backup-${Date.now()}.json`;
  const file = new File(Paths.cache, fileName);

  file.create();
  file.write(JSON.stringify(payload, null, 2));

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(file.uri, {
      dialogTitle: "Export SpeakEasy phrases",
      mimeType: "application/json",
      UTI: "public.json"
    });
  }

  return file.uri;
};

export const pickBackupFile = async () => {
  const result = await DocumentPicker.getDocumentAsync({
    type: "application/json",
    copyToCacheDirectory: true,
    multiple: false
  });

  if (result.canceled || !result.assets?.[0]) {
    return null;
  }

  const file = new File(result.assets[0].uri);
  return JSON.parse(file.textSync()) as ExportPayload;
};
