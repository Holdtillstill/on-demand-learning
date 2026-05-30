export const LOCAL_LEARNER_ID_KEY = "platform-academy-learner-id";

const LEARNER_ID_PREFIX = "guest-";
const RECOVERABLE_LEARNER_ID_PATTERN = /^guest-[a-z0-9]{12}$/i;
const RANDOM_BYTE_COUNT = 6;

function randomIdPart() {
  const cryptoApi = globalThis.crypto;

  if (cryptoApi?.randomUUID) {
    return cryptoApi.randomUUID().replace(/-/g, "").slice(0, 12);
  }

  if (cryptoApi?.getRandomValues) {
    const bytes = new Uint8Array(RANDOM_BYTE_COUNT);
    cryptoApi.getRandomValues(bytes);
    return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
  }

  return Math.random().toString(36).slice(2, 14).padEnd(12, "0").slice(0, 12);
}

export function createLocalLearnerId() {
  return `${LEARNER_ID_PREFIX}${randomIdPart()}`;
}

function readStoredLocalLearnerId() {
  try {
    return globalThis.localStorage?.getItem(LOCAL_LEARNER_ID_KEY)?.trim() ?? "";
  } catch {
    return "";
  }
}

function storeLocalLearnerId(learnerId: string) {
  try {
    globalThis.localStorage?.setItem(LOCAL_LEARNER_ID_KEY, learnerId);
  } catch {
    // Private browsing or locked-down storage should not block an anonymous session.
  }
}

export function getOrCreateLocalLearnerId() {
  const storedLearnerId = readStoredLocalLearnerId();
  if (storedLearnerId) return storedLearnerId;
  return resetLocalLearnerId();
}

export function resetLocalLearnerId() {
  const learnerId = createLocalLearnerId();
  storeLocalLearnerId(learnerId);
  return learnerId;
}

export function normalizeLocalLearnerId(learnerId: string) {
  return learnerId.trim().toLowerCase();
}

export function isRecoverableLocalLearnerId(learnerId: string) {
  return RECOVERABLE_LEARNER_ID_PATTERN.test(normalizeLocalLearnerId(learnerId));
}

export function restoreLocalLearnerId(learnerId: string) {
  const normalizedLearnerId = normalizeLocalLearnerId(learnerId);
  if (!isRecoverableLocalLearnerId(normalizedLearnerId)) return "";
  storeLocalLearnerId(normalizedLearnerId);
  return normalizedLearnerId;
}
