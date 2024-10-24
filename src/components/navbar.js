import { useWalletContext } from "@/privy/walletContext";
import { usePrivy } from "@privy-io/react-auth";
import { LogOut, X } from "lucide-react";
import React, { useState } from "react";
import MintTokensDialog from "./mint-token";
import { usePathname } from "next/navigation";
import Image from "next/image";
const getShortAddress = (address) => {
  if (address.length > 10) {
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  }
  return address;
};
const Navbar = () => {
  const [open, setOpen] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const { signer, w0, address, isLoading, error } = useWalletContext();
  const pathname = usePathname();

  const { logout } = usePrivy();
  return (
    <nav className="flex items-center justify-between pl-4 pr-6 py-3">
      <div className="flex items-center gap-2">
        <Image src={"hq.svg"} alt="HQ POC" width={45} height={45} />
        <X size={20} />
        <Image src={"inco.svg"} alt="HQ POC" width={30} height={30} />
        {/* <span className="font-semibold text-lg">HQ POC</span> */}
      </div>
      <div className="flex items-center space-x-4">
        <MintTokensDialog open={open} onOpenChange={setOpen} path={pathname} />
        {/* <div className="flex items-center">
          <img
            src="https://upload.wikimedia.org/wikipedia/commons/thumb/4/48/Flag_of_Singapore.svg/383px-Flag_of_Singapore.svg.png"
            alt="Singapore Flag"
            className="mr-1 w-5 h-3"
          />
          <div className="h-6 w-px bg-gray-300 mx-2"></div>
          <span className="">SGD</span>
        </div> */}
        <div
          className="max-h-full flex items-center bg-white p-1.5 px-2.5 border rounded-lg cursor-pointer w-[8.5rem]"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onClick={isHovered ? logout : undefined}
        >
          {isHovered || address === null || !address ? (
            <div className="flex items-center text-red-500 h-8">
              <LogOut size={16} className="mr-3" />
              <span className="text-sm font-medium">Logout</span>
            </div>
          ) : (
            <div className="h-8 flex items-center">
              <div className="w-7 h-7 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold mr-3 shadow-lg">
                {address?.slice(-2).toUpperCase()}
              </div>
              <div className="flex flex-col">
                <div className="text-sm font-medium text-gray-800">Wallet</div>
                <div className="text-xs text-gray-600">
                  {getShortAddress(address)}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
