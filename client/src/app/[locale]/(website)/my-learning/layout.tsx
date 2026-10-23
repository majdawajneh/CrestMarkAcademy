
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Learning",
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
};

export default function MyLearningLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
