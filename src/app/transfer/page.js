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
  const [claimLoading, setClaimLoading] = useState(false);

  const { signer } = useWalletContext();

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

      <Balance />

      {/* Actions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <TransferDialog />

        <DistributeDialog />

        <Card className="bg-white hover:bg-gray-50 transition-colors cursor-pointer">
          <CardContent
            className={`p-6 grid place-items-center ${
              claimLoading ? "h-full" : ""
            }`}
          >
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
