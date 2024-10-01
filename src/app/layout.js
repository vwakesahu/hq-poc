import { Poppins } from "next/font/google";
import "./globals.css";
import PrivyWrapper from "@/privy/privyProvider";
import { Toaster } from "sonner";
import CustomLayout from "@/layout/custom-layout";
import { FHEWrapper } from "@/fhevm/fheWrapper";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
});

export const metadata = {
  title: "HQ POC",
  description: "",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={poppins.className}>
        <PrivyWrapper>
          <FHEWrapper>
            <CustomLayout>{children}</CustomLayout>
            <Toaster />
          </FHEWrapper>
        </PrivyWrapper>
      </body>
    </html>
  );
}
