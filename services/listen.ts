import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent
} from "expo-speech-recognition";

// Thin wrapper around expo-speech-recognition so the rest of the app does not
// depend on the module directly. The same native module backs iOS
// (SFSpeechRecognizer), Android (SpeechRecognizer) and Web (Web Speech API),
// so this works live in the browser today and on device once a dev build is
// generated.

export { useSpeechRecognitionEvent };

export const ensureListenPermissions = async () => {
  const result = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
  return result.granted;
};

export const startListening = (language: string) => {
  ExpoSpeechRecognitionModule.start({
    lang: language,
    interimResults: true,
    continuous: true
  });
};

export const stopListening = () => {
  ExpoSpeechRecognitionModule.stop();
};

export const abortListening = () => {
  ExpoSpeechRecognitionModule.abort();
};
