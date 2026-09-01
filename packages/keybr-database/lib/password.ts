import {
  randomBytes,
  scrypt as scryptCallback,
  timingSafeEqual,
} from "node:crypto";

const keyLength = 64;
const cost = 16_384;
const blockSize = 8;
const parallelization = 1;

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const hash = await derive(password, salt);
  return [
    "scrypt",
    cost,
    blockSize,
    parallelization,
    salt.toString("hex"),
    hash.toString("hex"),
  ].join("$");
}

export async function verifyPassword(
  password: string,
  encoded: string,
): Promise<boolean> {
  const [
    algorithm,
    costValue,
    blockSizeValue,
    parallelizationValue,
    saltValue,
    hashValue,
  ] = encoded.split("$");
  if (
    algorithm !== "scrypt" ||
    costValue !== String(cost) ||
    blockSizeValue !== String(blockSize) ||
    parallelizationValue !== String(parallelization) ||
    saltValue == null ||
    hashValue == null
  ) {
    return false;
  }
  try {
    const expected = Buffer.from(hashValue, "hex");
    const actual = await derive(password, Buffer.from(saltValue, "hex"));
    return (
      expected.length === actual.length && timingSafeEqual(expected, actual)
    );
  } catch {
    return false;
  }
}

async function derive(password: string, salt: Buffer): Promise<Buffer> {
  return await new Promise((resolve, reject) => {
    scryptCallback(
      password,
      salt,
      keyLength,
      {
        N: cost,
        r: blockSize,
        p: parallelization,
        maxmem: 32 * 1024 * 1024,
      },
      (error, derivedKey) => {
        if (error != null) {
          reject(error);
        } else {
          resolve(derivedKey);
        }
      },
    );
  });
}
