import { useLocalSearchParams, useRouter } from "expo-router";

import { PhraseForm } from "@/components/PhraseForm";
import { useAppData } from "@/context/AppDataContext";
import { alertDialog } from "@/services/dialog";
import type { PhraseInput } from "@/types";

const firstParam = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

export default function NewPhraseScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ categoryId?: string; text?: string }>();
  const { addPhrase } = useAppData();
  const categoryId = firstParam(params.categoryId);
  const text = firstParam(params.text);

  const handleSubmit = async (input: PhraseInput) => {
    try {
      await addPhrase(input);
      router.back();
    } catch (error) {
      alertDialog("Could not save phrase", error instanceof Error ? error.message : String(error));
    }
  };

  return (
    <PhraseForm
      initial={{ categoryId: categoryId ?? null, text: text ?? "" }}
      onSubmit={handleSubmit}
      submitLabel="Save phrase"
    />
  );
}
