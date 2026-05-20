import { promisify } from "node:util";
import { randomBytes, scrypt as scryptCb, timingSafeEqual } from "node:crypto";
import { getEnv } from "./config";
import { AppError } from "./errors";

const scrypt = promisify(scryptCb) as (
  password: string | Buffer,
  salt: Buffer,
  keylen: number,
) => Promise<Buffer>;

export type Role = "operator" | "member";
const ROLES: ReadonlyArray<Role> = ["operator", "member"];
const COOKIE_PREFIX = "mr_auth_";
const KEY_LEN = 64;
const SALT_LEN = 16;

export function cookieName(slug: string): string {
  return `${COOKIE_PREFIX}${slug}`;
}

/** scrypt 해시: "s$<saltHex>$<hashHex>" 포맷. */
export async function hashPasscode(passcode: string): Promise<string> {
  const salt = randomBytes(SALT_LEN);
  const hash = await scrypt(passcode, salt, KEY_LEN);
  return `s$${salt.toString("hex")}$${hash.toString("hex")}`;
}

/** 타이밍 세이프 패스코드 검증. null/잘못된 포맷은 false. */
export async function verifyPasscode(
  passcode: string,
  stored: string | null,
): Promise<boolean> {
  if (!stored) return false;
  const parts = stored.split("$");
  if (parts.length !== 3 || parts[0] !== "s") return false;
  let salt: Buffer;
  let expected: Buffer;
  try {
    salt = Buffer.from(parts[1], "hex");
    expected = Buffer.from(parts[2], "hex");
  } catch {
    return false;
  }
  if (expected.length !== KEY_LEN) return false;
  const actual = await scrypt(passcode, salt, KEY_LEN);
  return timingSafeEqual(actual, expected);
}

/** HMAC-SHA256 hex. Web Crypto로 Node·edge 양쪽에서 동작. */
async function hmacHex(data: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(data),
  );
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function safeEqualString(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/** 쿠키 값 생성: "<role>.<sigHex>" */
export async function signSession(slug: string, role: Role): Promise<string> {
  const sig = await hmacHex(`${slug}.${role}`, getEnv().AUTH_SECRET);
  return `${role}.${sig}`;
}

/** 쿠키 검증. 유효하면 role, 아니면 null. */
export async function verifySession(
  cookieValue: string | undefined,
  slug: string,
  secret: string = getEnv().AUTH_SECRET,
): Promise<Role | null> {
  if (!cookieValue) return null;
  const dot = cookieValue.indexOf(".");
  if (dot < 0) return null;
  const role = cookieValue.slice(0, dot);
  const sig = cookieValue.slice(dot + 1);
  if (!ROLES.includes(role as Role)) return null;
  const expected = await hmacHex(`${slug}.${role}`, secret);
  if (!safeEqualString(sig, expected)) return null;
  return role as Role;
}

/** Set-Cookie 헤더 문자열. */
export function buildCookieHeader(
  slug: string,
  value: string,
  maxAgeSec = 60 * 60 * 24 * 30,
): string {
  const flags = [
    `${cookieName(slug)}=${value}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${maxAgeSec}`,
  ];
  if (process.env.NODE_ENV === "production") flags.push("Secure");
  return flags.join("; ");
}

/** Request의 Cookie 헤더에서 팀 슬러그용 세션 쿠키 값 추출. */
export function readSessionCookie(req: Request, slug: string): string | undefined {
  const header = req.headers.get("cookie");
  if (!header) return undefined;
  const target = cookieName(slug);
  for (const part of header.split(";")) {
    const trimmed = part.trim();
    const eq = trimmed.indexOf("=");
    if (eq < 0) continue;
    if (trimmed.slice(0, eq) === target) return trimmed.slice(eq + 1);
  }
  return undefined;
}

/** 라우트에서 호출. 인증/권한 검증, 통과한 역할을 반환한다. operator는 member 권한을 포함한다. */
export async function requireRole(
  req: Request,
  slug: string,
  required: Role,
): Promise<Role> {
  const value = readSessionCookie(req, slug);
  const role = await verifySession(value, slug);
  if (!role) throw new AppError(401, "로그인이 필요합니다.");
  if (required === "member" || role === "operator") return role;
  throw new AppError(403, "운영진 권한이 필요합니다.");
}
