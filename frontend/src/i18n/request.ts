import { getRequestConfig } from "next-intl/server";
import { cookies, headers } from "next/headers";
import { defaultLocale, isLocale, locales } from "./config";

// Cookie-based locale (no locale prefix in the URL). Falls back to the
// Accept-Language header, then the default. Mirrors the backend X-Locale scheme.
export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get("NEXT_LOCALE")?.value;

  let locale = isLocale(cookieLocale) ? cookieLocale : undefined;
  if (!locale) {
    const h = await headers();
    const accept = (h.get("accept-language") || "").toLowerCase();
    locale = locales.find((l) => accept.startsWith(l)) ?? defaultLocale;
  }

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
