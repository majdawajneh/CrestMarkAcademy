
import { Suspense, type ReactNode } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

type Props = {
  children: ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function WebsiteLayout({
  children,
  params,
}: Props) {
  const { locale } = await params;

  const currentLocale = locale === "ar" ? "ar" : "en";

  return (
    <>
      <Suspense fallback={null}>
        <Navbar />
      </Suspense>

      {children}

      <Footer locale={currentLocale} />
    </>
  );
}
