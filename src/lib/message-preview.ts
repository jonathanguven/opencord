type MessagePreviewSource =
  | {
      body?: string | null;
      imageKey?: string | null;
    }
  | null
  | undefined;

export const getMessagePreview = (
  message: MessagePreviewSource,
  fallback = ""
) => {
  const body = message?.body?.trim();
  if (body) {
    return body;
  }

  if (message?.imageKey) {
    return "Sent an image";
  }

  return fallback;
};
