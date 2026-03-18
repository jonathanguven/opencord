const HANDLE_PATTERN = /^[a-z0-9_]{3,24}$/i;

export const HANDLE_ERROR_MESSAGE =
  "Handles must be 3-24 characters and only include letters, numbers, or underscores.";

export const normalizeHandleInput = (value: string) =>
  value
    .trim()
    .replaceAll(/\s+/g, "")
    .replaceAll(/[^a-z0-9_]/gi, "");

export const validateHandle = (value: string) => {
  if (!HANDLE_PATTERN.test(value)) {
    return HANDLE_ERROR_MESSAGE;
  }

  return null;
};
