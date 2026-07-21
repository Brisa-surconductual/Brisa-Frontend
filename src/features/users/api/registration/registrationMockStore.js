const PREEXISTING_EMAILS = new Set([
  'registrado@brisa.co',
]);

const provisionalAccounts = new Map();

export function getProvisionalAccount(userId) {
  return provisionalAccounts.get(userId) ?? null;
}

export function setProvisionalAccount(
  userId,
  account,
) {
  provisionalAccounts.set(userId, account);
}

export function deleteStoredProvisionalAccount(
  userId,
) {
  provisionalAccounts.delete(userId);
}

export function emailExists(email) {
  if (PREEXISTING_EMAILS.has(email)) {
    return true;
  }

  return Array.from(
    provisionalAccounts.values(),
  ).some((account) => account.email === email);
}