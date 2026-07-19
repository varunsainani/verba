import { NextIntlClientProvider } from "next-intl";
import { getLocale } from "next-intl/server";
import { AppLocale, isLocale } from "@/i18n/config";
import { loadMessages } from "@/i18n/messages-loader";
import { WidgetChat } from "@/components/WidgetChat";

export const metadata = {
  title: "Verba widget",
  robots: { index: false },
};

export default async function WidgetPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ lang?: string }>;
}) {
  const { token } = await params;
  const sp = await searchParams;
  const rootLocale = (await getLocale()) as AppLocale;
  const locale: AppLocale = isLocale(sp.lang) ? sp.lang : rootLocale;
  const messages = await loadMessages(locale);

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <div className="h-screen w-screen overflow-hidden">
        <WidgetChat token={token} locale={locale} />
      </div>
    </NextIntlClientProvider>
  );
}
