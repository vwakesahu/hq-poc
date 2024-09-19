import { useWalletContext } from "@/privy/walletContext";
import { usePrivy } from "@privy-io/react-auth";
import { LogOut } from "lucide-react";
import React, { useState } from "react";
const getShortAddress = (address) => {
  if (address.length > 10) {
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  }
  return address;
};
const Navbar = () => {
  const [isHovered, setIsHovered] = useState(false);
  const { signer, w0, address, isLoading, error } = useWalletContext();

  const { logout } = usePrivy();
  return (
    <nav className="flex items-center justify-between pl-4 pr-6 py-3">
      <div className="flex items-center">
        <svg
          width="28"
          height="28"
          viewBox="0 0 28 28"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="mr-2"
        >
          <path
            d="M13.9998 27.3333C21.3636 27.3333 27.3332 21.3638 27.3332 14C27.3332 6.63621 21.3636 0.666672 13.9998 0.666672C6.63604 0.666672 0.666504 6.63621 0.666504 14C0.666504 21.3638 6.63604 27.3333 13.9998 27.3333Z"
            fill="#FF4F64"
          />
          <path
            d="M22.9798 8.38667L16.2465 15.12L13.9998 12.8733L11.7532 15.12L5.01984 8.38667C7.35317 5.60667 10.5065 3.83334 13.9998 3.83334C17.4932 3.83334 20.6465 5.60667 22.9798 8.38667Z"
            fill="white"
          />
        </svg>
        <span className="font-semibold text-lg">HQ POC</span>
      </div>
      <div className="flex items-center space-x-4">
        <div className="flex items-center">
          <img
            src="https://upload.wikimedia.org/wikipedia/commons/thumb/4/48/Flag_of_Singapore.svg/383px-Flag_of_Singapore.svg.png"
            alt="Singapore Flag"
            className="mr-1 w-5 h-3"
          />
          <div className="h-6 w-px bg-gray-300 mx-2"></div>
          <span className="">SGD</span>
        </div>
        <div
          className="max-h-full flex items-center bg-white p-1.5 px-2.5 border rounded-lg cursor-pointer w-[8.5rem]"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onClick={isHovered ? logout : undefined}
        >
          {isHovered ? (
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
