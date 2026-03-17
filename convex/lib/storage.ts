const requiredEnv = (name: string) => {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
};

const hasR2Config = () =>
  Boolean(
    process.env.CLOUDFLARE_R2_ACCOUNT_ID &&
      process.env.CLOUDFLARE_R2_ACCESS_KEY_ID &&
      process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY &&
      process.env.CLOUDFLARE_R2_BUCKET,
  );

export const getStorageStatus = () => ({
  enabled: hasR2Config(),
  publicBaseUrl: process.env.CLOUDFLARE_R2_PUBLIC_BASE_URL ?? null,
});

export const createUploadUrl = async (key: string) => {
  if (!hasR2Config()) {
    throw new Error("R2 uploads are not configured yet.");
  }

  requiredEnv("CLOUDFLARE_R2_ACCOUNT_ID");
  requiredEnv("CLOUDFLARE_R2_BUCKET");
  return {
    method: "PUT" as const,
    key,
    uploadUrl: "",
    expiresAt: Date.now() + 5 * 60 * 1000,
  };
};

export const createDownloadUrl = async (key: string) => {
  if (!hasR2Config()) {
    throw new Error("R2 downloads are not configured yet.");
  }

  const publicBaseUrl = requiredEnv("CLOUDFLARE_R2_PUBLIC_BASE_URL");
  return {
    key,
    downloadUrl: `${publicBaseUrl.replace(/\/$/, "")}/${key}`,
  };
};
