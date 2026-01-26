export type CheckoutContact = {
  email: string;
  firstName: string;
  lastName: string;
};

const CONTACT_KEY = "checkout_contact";
const CART_ID_KEY = "checkout_cart_id";

const normalizeContact = (input: CheckoutContact): CheckoutContact => ({
  email: input.email.trim().toLowerCase(),
  firstName: input.firstName.trim(),
  lastName: input.lastName.trim(),
});

const generateId = () => {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
};

export const getStoredContact = (): CheckoutContact | null => {
  try {
    const raw = localStorage.getItem(CONTACT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<CheckoutContact>;
    if (!parsed?.email || !parsed?.firstName || !parsed?.lastName) return null;
    return normalizeContact(parsed as CheckoutContact);
  } catch {
    return null;
  }
};

export const setStoredContact = (contact: CheckoutContact) => {
  const normalized = normalizeContact(contact);
  localStorage.setItem(CONTACT_KEY, JSON.stringify(normalized));
  return normalized;
};

export const clearStoredContact = () => {
  localStorage.removeItem(CONTACT_KEY);
};

export const getCartId = () => {
  const existing = localStorage.getItem(CART_ID_KEY);
  if (existing) return existing;
  const next = generateId();
  localStorage.setItem(CART_ID_KEY, next);
  return next;
};

export const setCartId = (cartId: string) => {
  if (!cartId) return;
  localStorage.setItem(CART_ID_KEY, cartId);
};

export const resetCartId = () => {
  const next = generateId();
  localStorage.setItem(CART_ID_KEY, next);
  return next;
};
