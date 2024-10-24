"use client";
import React, { useEffect, useState } from "react";
import {
  ChevronRight,
  Gift,
  Lock,
  Plus,
  RefreshCw,
  Trash2,
  Unlock,
  ArrowRightLeft,
  Package,
  Loader2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useWalletContext } from "@/privy/walletContext";
import { useFhevm } from "@/fhevm/fhevm-context";
import { Wallet as WalletIcon, CreditCard } from "lucide-react";
import { useContractAddress } from "@/firebase/getContract";
import {
  ENCRYPTEDERC20CONTRACTABI,
  ENCRYPTEDERC20CONTRACTADDRESS,
  ERC20CONTRACTABI,
  ERC20CONTRACTADDRESS,
} from "@/utils/contracts";
import { AbiCoder, Contract } from "ethers";
import { toHexString } from "@/fhevm/fhe-functions";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { motion } from "framer-motion";
import { usePathname } from "next/navigation";
import TransferDialog from "@/components/transferDialouge";
import DistributeDialog from "@/components/distribute";
import { toast } from "sonner";
import Balance from "@/components/balance";

const Page = () => {
  const [activeBalance, setActiveBalance] = useState("usdc");
  const [isCUSDCLocked, setIsCUSDCLocked] = useState(true);
  const [balance, setBalance] = useState(null);
  const [balanceLoading, setBalanceLoading] = useState(false);
  const [usdcBalance, setUsdcBalance] = useState(null);
  const [usdcBalanceLoading, setUsdcBalanceLoading] = useState(false);
  const [claimLoading, setClaimLoading] = useState(false);

  const pathname = usePathname();
  const { instance: fhevmInstance } = useFhevm();
  const { signer, address } = useWalletContext();
  const { getContractAddress } = useContractAddress();

  const fadeIn = {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  };

  const getUSDCBalance = async () => {
    try {
      setUsdcBalanceLoading(true);
      const erc20Contract = new Contract(
        ERC20CONTRACTADDRESS,
        ERC20CONTRACTABI,
        signer
      );
      const balance = await erc20Contract.balanceOf(address);
      console.log(balance.toString());
      setUsdcBalance(balance.toString());
    } catch (error) {
      console.log(error);
    } finally {
      setUsdcBalanceLoading(false);
    }
  };

  const handleRefresh = () => {
    if (activeBalance === "usdc") {
      if (pathname === "/transfer") {
        getSafeUSDCBalance();
      } else {
        getUSDCBalance();
      }
    } else {
      // activeBalance === "cusdc"
      if (pathname === "/transfer") {
        getBalance();
      } else {
        getSafeBalance();
      }
    }
  };

  const getSafeUSDCBalance = async () => {
    try {
      setUsdcBalanceLoading(true);
      const safeBalanceUSDC = new Contract(
        ERC20CONTRACTADDRESS,
        ERC20CONTRACTABI,
        signer
      );

      const safeAddress = await getContractAddress(address);
      if (!safeAddress.data) {
        console.error("No Safe contract address found");
        return;
      }

      const safecontractAddress = safeAddress.data.contractAddress;
      const balance = await safeBalanceUSDC.balanceOf(safecontractAddress);
      setUsdcBalance(balance.toString());
    } catch (error) {
      console.error(error);
    } finally {
      setUsdcBalanceLoading(false);
    }
  };

  const getBalance = async () => {
    setBalanceLoading(true);
    try {
      const { publicKey, privateKey } = fhevmInstance.generateKeypair();
      const eip712 = fhevmInstance.createEIP712(
        publicKey,
        ENCRYPTEDERC20CONTRACTADDRESS
      );

      const signature = await signer._signTypedData(
        eip712.domain,
        { Reencrypt: eip712.types.Reencrypt },
        eip712.message
      );
      const encryptedErc20Contract = new Contract(
        ENCRYPTEDERC20CONTRACTADDRESS,
        ENCRYPTEDERC20CONTRACTABI,
        signer
      );
      const balanceHandle = await encryptedErc20Contract.balanceOf(address);
      console.log("balanceHandle", balanceHandle);
      if (balanceHandle.toString() === "0") {
        console.log("You have no balance to fetch");
        setBalance(null);
      } else {
        const balanceResult = await fhevmInstance.reencrypt(
          balanceHandle,
          privateKey,
          publicKey,
          signature.replace("0x", ""),
          ENCRYPTEDERC20CONTRACTADDRESS,
          address
        );
        console.log(balanceResult);
        setBalance(balanceResult.toString());
      }
    } catch (err) {
      console.error(err);
      setBalance(null);
    } finally {
      console.log("completed");
      setBalanceLoading(false);
    }
  };

  const getSafeBalance = async () => {
    setBalanceLoading(true);
    try {
      const { publicKey, privateKey } = fhevmInstance.generateKeypair();
      const eip712 = fhevmInstance.createEIP712(
        publicKey,
        ENCRYPTEDERC20CONTRACTADDRESS
      );

      const signature = await signer._signTypedData(
        eip712.domain,
        { Reencrypt: eip712.types.Reencrypt },
        eip712.message
      );
      const encryptedErc20Contract = new Contract(
        ENCRYPTEDERC20CONTRACTADDRESS,
        ENCRYPTEDERC20CONTRACTABI,
        signer
      );
      const safeAddress = await getContractAddress(address);
      if (!safeAddress.data) {
        console.error("No Safe contract address found");
        return;
      }

      const safecontractAddress = safeAddress.data.contractAddress;
      const balanceHandle = await encryptedErc20Contract.balanceOf(
        safecontractAddress
      );
      console.log("balanceHandle", balanceHandle);
      if (balanceHandle.toString() === "0") {
        console.log("You have no balance to fetch");
        setBalance(null);
      } else {
        const balanceResult = await fhevmInstance.reencrypt(
          balanceHandle,
          privateKey,
          publicKey,
          signature.replace("0x", ""),
          ENCRYPTEDERC20CONTRACTADDRESS,
          address
        );
        console.log(balanceResult);
        setBalance(balanceResult.toString());
      }
    } catch (err) {
      console.error(err);
      setBalance(null);
    } finally {
      console.log("completed");
      setBalanceLoading(false);
    }
  };

  const claimTokens = async () => {
    try {
      setClaimLoading(true);
      const encryptedErc20Contract = new Contract(
        ENCRYPTEDERC20CONTRACTADDRESS,
        ENCRYPTEDERC20CONTRACTABI,
        signer
      );

      const erc20Contract = new Contract(
        ERC20CONTRACTADDRESS,
        ERC20CONTRACTABI,
        signer
      );

      const response = await encryptedErc20Contract.claim({
        gasLimit: 1000000,
      });
      const tx = await response.getTransaction();
      console.log(tx);

      let count = 1;
      if (count === 1) {
        erc20Contract.on("Transfer", (from, to, value) => {
          if (count === 1) {
            console.log(from, to, value);
            toast.success("Tokens claimed successfully");
            setClaimLoading(false);
            count++;
          }
        });
      }
    } catch (error) {
      setClaimLoading(false);
      console.log(error);
    }
  };

 
  return (
    <div className="max-w-4xl mx-auto p-8 space-y-8 pt-20">
      {/* Balance Display */}
      {/* <Card className="bg-white">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-medium text-gray-900">Balance</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              className="text-gray-500 hover:text-gray-900"
              disabled={balanceLoading || usdcBalanceLoading}
            >
              {balanceLoading || usdcBalanceLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
            </Button>
          </div>

          <div className="relative mb-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-100" />
            </div>
            <div className="relative flex justify-center rounded-xl p-1 bg-gray-50/80">
              <div className="flex w-full max-w-xs rounded-lg bg-gray-50/80 p-1">
                <button
                  onClick={() => setActiveBalance("usdc")}
                  className={`relative w-full rounded-lg py-2.5 text-sm font-medium transition-all duration-200 focus:outline-none ${
                    activeBalance === "usdc"
                      ? "text-gray-900"
                      : "text-gray-400 hover:text-gray-600"
                  }`}
                >
                  {activeBalance === "usdc" && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute inset-0 bg-white rounded-lg shadow-sm ring-1 ring-gray-200/50"
                      transition={{
                        type: "spring",
                        bounce: 0.2,
                        duration: 0.6,
                      }}
                    />
                  )}
                  <span className="relative z-10 flex items-center justify-center gap-1.5">
                    <span>USDC</span>
                    {activeBalance === "usdc" && (
                      <ChevronRight className="w-3 h-3" />
                    )}
                  </span>
                </button>
                <button
                  onClick={() => setActiveBalance("cusdc")}
                  className={`relative w-full rounded-lg py-2.5 text-sm font-medium transition-all duration-200 focus:outline-none ${
                    activeBalance === "cusdc"
                      ? "text-gray-900"
                      : "text-gray-400 hover:text-gray-600"
                  }`}
                >
                  {activeBalance === "cusdc" && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute inset-0 bg-white rounded-lg shadow-sm ring-1 ring-gray-200/50"
                      transition={{
                        type: "spring",
                        bounce: 0.2,
                        duration: 0.6,
                      }}
                    />
                  )}
                  <span className="relative z-10 flex items-center justify-center gap-1.5">
                    <span>cUSDC</span>
                    {activeBalance === "cusdc" && (
                      <ChevronRight className="w-3 h-3" />
                    )}
                  </span>
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center h-20">
            {activeBalance === "usdc" ? (
              <motion.span
                {...fadeIn}
                className="text-3xl font-medium text-gray-900"
              >
                {usdcBalanceLoading ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : (
                  `${usdcBalance?.slice(0, -4) || 0} USDC`
                )}
              </motion.span>
            ) : (
              <motion.div {...fadeIn} className="flex items-center gap-3">
                {isCUSDCLocked ? (
                  <button
                    onClick={handleRevealBalance}
                    className="flex items-center gap-2 text-gray-400 hover:text-gray-600"
                  >
                    <Lock className="h-5 w-5" />
                    <span className="text-sm">Click to reveal</span>
                  </button>
                ) : (
                  <motion.div {...fadeIn} className="flex items-center gap-2">
                    <Unlock className="h-5 w-5 text-gray-900" />
                    <span className="text-3xl font-medium text-gray-900">
                      {balanceLoading ? (
                        <Loader2 className="h-6 w-6 animate-spin" />
                      ) : (
                        `${balance || 0} cUSDC`
                      )}
                    </span>
                  </motion.div>
                )}
              </motion.div>
            )}
          </div>
        </CardContent>
      </Card> */}

      <Balance />

      {/* Actions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <TransferDialog />

        <DistributeDialog />

        <Card className="bg-white hover:bg-gray-50 transition-colors cursor-pointer">
          <CardContent className="p-6">
            <>
              {claimLoading ? (
                <div className="w-full h-full grid place-items-center">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : (
                <div className="flex items-center gap-4" onClick={claimTokens}>
                  <div className="p-2 rounded-full bg-gray-100">
                    <Gift className="w-5 h-5 text-gray-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">Claim Token</h3>
                    <p className="text-sm text-gray-500">Redeem your tokens</p>
                  </div>
                </div>
              )}
            </>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Page;
