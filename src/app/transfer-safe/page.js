"use client";
import React, { useEffect, useState } from "react";
import { Gift, Loader2, Shield } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useWalletContext } from "@/privy/walletContext";
import { ENCRYPTEDERC20CONTRACTADDRESS } from "@/utils/contracts";
import { Contract } from "ethers";
import { SAFEABI } from "@/utils/safeContract";
import { useContractAddress } from "@/firebase/getContract";
import SafeTransferDialouge from "@/components/safeTransferDialouge";
import SafeDistribute from "@/components/safeDistribute";
import {
  buildSafeTransaction,
  buildSignatureBytes,
  safeApproveHash,
} from "@/utils/buildSafeTx";
import Balance from "@/components/balance";
import { toast } from "sonner";
import DeploySafe from "@/components/deploySafe";

const TransferForm = () => {
  const { signer, address } = useWalletContext();
  const { getContractAddress } = useContractAddress();
  const [claimLoading, setClaimLoading] = useState(false);

  const claimPayments = async () => {
    setClaimLoading(true);

    try {
      const safeAddress = await getContractAddress(address);
      if (!safeAddress.data) {
        console.error("No Safe contract address found");
        return;
      }
      const safecontractAddress = safeAddress.data.contractAddress;
      const contractOwnerSafe = new Contract(
        safecontractAddress,
        SAFEABI,
        signer
      );
      let claimFnSelector = "0x4e71d92d";

      const txn2 = {
        to: ENCRYPTEDERC20CONTRACTADDRESS,
        value: 0,
        data: claimFnSelector,
        operation: 0,
        safeTxGas: 1000000,
        baseGas: 0,
        gasPrice: 1000000,
        gasToken: safecontractAddress,
        refundReceiver: address,
        nonce: await contractOwnerSafe.nonce(),
      };

      const tx2 = buildSafeTransaction(txn2);
      const signatureBytes5 = buildSignatureBytes([
        await safeApproveHash(signer, contractOwnerSafe, tx2, true),
      ]);

      const txn = await contractOwnerSafe.execTransaction(
        ENCRYPTEDERC20CONTRACTADDRESS,
        0,
        claimFnSelector,
        // "0xc6dad082",
        0,
        1000000,
        0,
        // 1000000,
        0,
        address,
        safecontractAddress,
        signatureBytes5,
        { gasLimit: 10000000 }
      );
      console.log("Transaction hash:", txn.hash);
      await txn.wait(1);
      toast.success("Claim successful!");
      console.log("Claim by Carol safe successful!");
    } catch (error) {
      console.error("Claim by Carol safe failed:", error);
    } finally {
      setClaimLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-8 space-y-8 pt-20">
      <Balance />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <SafeTransferDialouge />
        <SafeDistribute />
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
                <div
                  className="flex items-center gap-4"
                  onClick={claimPayments}
                >
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

const SafeManager = () => {
  const { address } = useWalletContext();
  const { getContractAddress } = useContractAddress();
  const [isLoading, setIsLoading] = useState(true);
  const [hasSafe, setHasSafe] = useState(false);
  const [error, setError] = useState(null);

  const checkSafe = async () => {
    if (!address) {
      setIsLoading(false);
      return;
    }

    try {
      const safeAddress = await getContractAddress(address);
      setHasSafe(!!safeAddress?.data);
      setError(null);
    } catch (err) {
      setError(err.message);
      console.error("Error checking safe:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkSafe();
  }, [address]);

  // Callback for successful deployment
  const handleDeploySuccess = async () => {
    setIsLoading(true);
    // Wait a bit to ensure the contract address is updated in the database
    await new Promise((resolve) => setTimeout(resolve, 2000));
    await checkSafe();
  };

  if (isLoading) {
    return (
      <div className="w-full h-full grid place-items-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-gray-600" />
          <p className="text-gray-600">Checking Safe deployment status...</p>
        </div>
      </div>
    );
  }

  if (error?.includes("No contract address found") || !hasSafe) {
    return (
      <div className="h-full grid place-items-center p-4">
        <Card className="w-full max-w-md border">
          <CardHeader className="text-center space-y-2 pb-2">
            <div className="mx-auto bg-gray-100 w-16 h-16 rounded-full grid place-items-center mb-2">
              <Shield className="w-8 h-8" />
            </div>
            <CardTitle className="text-2xl font-bold">
              Deploy Safe
            </CardTitle>
            {error ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="p-3 bg-gray-100 rounded-lg">
                  <p className="text-sm font-medium">
                    No Safe found for this address. Please deploy one to
                    continue.
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-gray-600 text-sm">
                Secure your assets by deploying a new Safe wallet
              </p>
            )}
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-medium mb-2">
                  Benefits of Safe:
                </h3>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-gray-400 mr-2" />
                    Multi-signature security
                  </li>
                  <li className="flex items-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-gray-400 mr-2" />
                    Smart contract integration
                  </li>
                  <li className="flex items-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-gray-400 mr-2" />
                    Enhanced fund protection
                  </li>
                </ul>
              </div>
              <DeploySafe onDeploySuccess={handleDeploySuccess} />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="max-w-md mx-auto mt-8 p-6">
        <div className="text-center space-y-4">
          <h3 className="text-lg font-medium text-red-600">Error</h3>
          <p className="text-gray-600">{error}</p>
          <p className="text-sm text-gray-500">
            Please try refreshing the page
          </p>
        </div>
      </Card>
    );
  }

  return <TransferForm />;
};
export default SafeManager;
