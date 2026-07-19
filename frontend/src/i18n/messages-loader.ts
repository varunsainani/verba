import { AppLocale } from "./config";

// Load a specific locale's catalog. Used where a subtree needs a forced locale
// (the embeddable widget) rather than the request-resolved one.
export async function loadMessages(locale: AppLocale) {
  return (await import(`../messages/${locale}.json`)).default;
}
