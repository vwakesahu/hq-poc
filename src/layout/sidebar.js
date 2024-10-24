import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ChevronDown,
  Home,
  ArrowUpRight,
  FileText,
  RefreshCcw,
  Link as LinkIcon,
  BarChart2,
  Wallet,
  Coins,
  Diamond,
  CoinsIcon,
  Download,
  User,
} from "lucide-react";
import { Contract } from "ethers";
import {
  ENCRYPTEDERC20CONTRACTABI,
  ENCRYPTEDERC20CONTRACTADDRESS,
  ERC20CONTRACTABI,
  ERC20CONTRACTADDRESS,
} from "@/utils/contracts";
import { useWalletContext } from "@/privy/walletContext";

const MenuItem = ({ href, icon: Icon, children }) => {
  const router = useRouter();
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <Link href={href} passHref>
      <div
        className={`flex items-center text-sm rounded-lg px-4 py-2 cursor-pointer ${
          isActive
            ? "bg-[#F1F1EF] font-semibold text-black"
            : "hover:bg-[#F1F1EF]"
        }`}
      >
        <Icon size={18} className="mr-2" />
        <span>{children}</span>
      </div>
    </Link>
  );
};

const MenuSection = ({ title, children }) => (
  <div className="mb-4">
    <span className="px-4 py-2 text-xs font-semibold text-gray-500">
      {title}
    </span>
    <div className="mt-2 grid gap-0.5">{children}</div>
  </div>
);

export default function Sidebar() {
  const [mintLoading, setMintLoading] = useState(false);
  const { address, signer } = useWalletContext();
  // const authorize = async () => {
  //   const encryptedErc20Contract = new Contract(
  //     ENCRYPTEDERC20CONTRACTADDRESS,
  //     ENCRYPTEDERC20CONTRACTABI,
  //     signer
  //   );

  //   const response = await encryptedErc20Contract.giveAuthorization(address, {
  //     gasLimit: 1000000,
  //   });
  //   const receipt = await response.getTransaction();
  //   await receipt.wait();
  // };
  return (
    <div className="flex flex-col h-full w-56 text-gray-800 px-4">
      <div className="flex w-full gap-2 items-center">
        <div className="w-full p-2.5 rounded-md bg-gray-900 text-white">
          <div className="flex items-center justify-between">
            <div className="grid">
              <span className="font-bold text-sm">Safe</span>
              <span className="text-xs mr-2">
                {address?.slice(0, 5) + "..."}
              </span>
            </div>
            <div
              className="flex items-center justify-center w-6 h-6 rounded-lg bg-white text-black cursor-pointer"
              // onClick={authorize}
            >
              <User size={16} />
            </div>
          </div>
        </div>
        {/* <div className="rounded-md text-white">
          <div
            className="flex items-center justify-center w-8 h-8 rounded-lg bg-gray-900 text-white"
            onClick={mintTokens}
          >
            <CoinsIcon
              size={16}
              className={`${mintLoading ? "animate-spin" : ""}`}
            />
          </div>
        </div> */}
      </div>

      <div className="flex-grow overflow-y-auto">
        {/* <div className="my-6 px-2">
          <MenuItem href="/dashboard" icon={Home}>
            Dashboard
          </MenuItem>
        </div> */}
        <div className="my-6 px-2">
          <MenuSection title="PAYMENTS">
            <MenuItem href="/transfer" icon={Wallet}>
              EOA Transfer
            </MenuItem>
            <MenuItem href="/transfer-safe" icon={ArrowUpRight}>
              Safe Transfer
            </MenuItem>
            <MenuItem href="/deploy-safe" icon={Download}>
              Deploy Safe
            </MenuItem>
            {/* <MenuItem href="/transactions" icon={BarChart2}>
              Transactions
            </MenuItem> */}
            {/* <MenuItem href="/invoices" icon={FileText}>
            Invoices
          </MenuItem>
          <MenuItem href="/swap" icon={RefreshCcw}>
            Swap
          </MenuItem>
          <MenuItem href="/payment-links" icon={LinkIcon}>
            Payment Links
          </MenuItem> */}
          </MenuSection>
        </div>

        {/* <MenuSection title="REPORTING">
          <MenuItem href="/transactions" icon={BarChart2}>
            Transactions
          </MenuItem>
          <MenuItem href="/wallets" icon={Wallet}>
            Wallets
          </MenuItem>
          <MenuItem href="/tokens" icon={Coins}>
            Tokens
          </MenuItem>
          <MenuItem href="/nfts" icon={Diamond}>
            NFTs
          </MenuItem>
        </MenuSection> */}
      </div>
    </div>
  );
}
