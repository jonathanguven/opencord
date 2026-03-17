import { execFileSync } from "node:child_process";
import { exportJWK, exportPKCS8, generateKeyPair } from "jose";

const requiredEnvNames = ["JWT_PRIVATE_KEY", "JWKS"];

const getConvexEnv = (name) => {
  try {
    return execFileSync("npx", ["convex", "env", "get", name], {
      cwd: process.cwd(),
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    }).trim();
  } catch {
    return undefined;
  }
};

const setConvexEnv = (name, value) => {
  execFileSync("npx", ["convex", "env", "set", "--", name, value], {
    cwd: process.cwd(),
    encoding: "utf8",
    stdio: "inherit",
  });
};

const ensureConvexAuthEnv = async () => {
  const existingValues = Object.fromEntries(
    requiredEnvNames.map((name) => [name, getConvexEnv(name)])
  );

  if (
    typeof existingValues.JWT_PRIVATE_KEY === "string" &&
    existingValues.JWT_PRIVATE_KEY.length > 0 &&
    typeof existingValues.JWKS === "string" &&
    existingValues.JWKS.length > 0
  ) {
    process.stdout.write(
      "Convex auth JWT env is already configured for this deployment.\n"
    );
    return;
  }

  const keys = await generateKeyPair("RS256");
  const privateKey = await exportPKCS8(keys.privateKey);
  const publicKey = await exportJWK(keys.publicKey);

  setConvexEnv("JWT_PRIVATE_KEY", privateKey.trimEnd().replaceAll("\n", " "));
  setConvexEnv(
    "JWKS",
    JSON.stringify({ keys: [{ use: "sig", ...publicKey }] })
  );

  process.stdout.write("Convex auth JWT env configured for this deployment.\n");
};

await ensureConvexAuthEnv();
