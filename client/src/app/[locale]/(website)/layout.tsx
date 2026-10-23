
import { Suspense } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

type Props = {
  children: React.ReactNode;
};

export default function WebsiteLayout({
  children,
}: Props) {
  return (
    <>
      <Suspense fallback={null}>
        <Navbar />
      </Suspense>

      {children}

      <Suspense fallback={null}>
        <Footer />
      </Suspense>
    </>
  );
}
