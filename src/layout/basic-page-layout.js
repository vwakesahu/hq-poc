"use client";

import { Button } from "@/components/ui/button";
import { useFhevm } from "@/fhevm/fhevm-context";
import { useContractAddress } from "@/firebase/getContract";
import { useWalletContext } from "@/privy/walletContext";
import {
  ENCRYPTEDERC20CONTRACTABI,
  ENCRYPTEDERC20CONTRACTADDRESS,
  ERC20CONTRACTABI,
  ERC20CONTRACTADDRESS,
} from "@/utils/contracts";
import { SAFEABI } from "@/utils/safeContract";
import { Contract, ethers } from "ethers";
import { Loader, RefreshCcw } from "lucide-react";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

const BasicPageLayout = ({ children, title }) => {
  const { instance: fhevmInstance } = useFhevm();
  const [balance, setBalance] = useState(null);
  const [balanceLoading, setBalanceLoading] = useState(false);
  const [usdcBalanceLoading, setUsdcBalanceLoading] = useState(false);
  const [usdcBalance, setUsdcBalance] = useState(null);
  const pathname = usePathname();
  const [mintLoading, setMintLoading] = useState(false);
  const [claimLoading, setClaimLoading] = useState(false);
  const { signer, address } = useWalletContext();
  const { getContractAddress } = useContractAddress();

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

  const getBalance = async () => {
    setBalanceLoading(true);
    // setError(null);
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
        // toast.error("You have no balance to fetch.");
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
      // toast.error("Failed to fetch balance. Please try again.");
      // setError("Failed to fetch balance. Please try again.");
      // setIsErrorModalOpen(true);
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
      toast.success(
        "Transaction sent successfully, waiting for confirmation..."
      );

      let count = 1;
      if (count === 1) {
        erc20Contract.on("Transfer", (from, to, value) => {
          if (count === 1) {
            console.log(from, to, value);
            toast.success("Tokens claimed successfully");
            count++;
          }
        });
      }
    } catch (error) {
      console.log(error);
    } finally {
      setClaimLoading(false);
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
      console.log(balance.toString());
      setUsdcBalance(balance.toString());
    } catch (error) {
      console.log(error);
    } finally {
      setUsdcBalanceLoading(false);
    }
  };

  const getSafeAddress = async () => {
    try {
      const safeAddress = await getContractAddress(address);
      if (!safeAddress.data) {
        console.error("No Safe contract address found");
        return;
      }
      console.log(safeAddress.data.contractAddress);
      return safeAddress.data.contractAddress;
    } catch (error) {
      console.log(error);
    }
  };

  const getSafeBalance = async () => {
    setBalanceLoading(true);
    // setError(null);
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
        // "0x617F29C421EadB44feFc93Ebdc4259464f85E0ea"
      );
      console.log("balanceHandle", balanceHandle);
      if (balanceHandle.toString() === "0") {
        console.log("You have no balance to fetch");
        // toast.error("You have no balance to fetch.");
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
      // toast.error("Failed to fetch balance. Please try again.");
      // setError("Failed to fetch balance. Please try again.");
      // setIsErrorModalOpen(true);
    } finally {
      console.log("completed");
      setBalanceLoading(false);
    }
  };

  return (
    <>
      {pathname === "/transfer" ? (
        <div className="py-8 text-2xl font-semibold max-w-4xl mx-auto flex items-center justify-between">
          {pathname === "/transfer" ? (
            <div className="flex gap-2 items-center">
              <Button
                className="flex gap-2"
                variant="outline"
                onClick={getUSDCBalance}
                disabled={usdcBalanceLoading}
              >
                {usdcBalanceLoading ? (
                  <Loader className="animate-spin" />
                ) : (
                  <>
                    {usdcBalance ? (
                      `USDC Balance: ${usdcBalance.slice(0, -4)}`
                    ) : (
                      <>
                        <RefreshCcw size={16} />
                        USDC
                      </>
                    )}
                  </>
                )}
              </Button>
              <Button
                className="flex gap-2"
                variant="outline"
                onClick={getBalance}
                disabled={balanceLoading}
              >
                {balanceLoading ? (
                  <Loader className="animate-spin" />
                ) : (
                  <>
                    {balance ? (
                      `cUSDC Balance: ${balance.slice(0, -4)}`
                    ) : (
                      <>
                        <RefreshCcw size={16} />
                        CUSDC
                      </>
                    )}
                  </>
                )}
                {/* nce */}
              </Button>
            </div>
          ) : (
            title
          )}
          {pathname === "/transfer" && (
            <div className="flex items-center gap-2">
              <Button
                onClick={claimTokens}
                disabled={claimLoading}
                variant="outline"
              >
                {claimLoading ? (
                  <Loader className="animate-spin" />
                ) : (
                  "Claim Tokens"
                )}
              </Button>
            </div>
          )}
        </div>
      ) : (
        <> </>
      )}

      {pathname === "/transfer-safe" ? (
        <div className="py-8 text-2xl font-semibold max-w-4xl mx-auto flex items-center justify-between">
          {pathname === "/transfer-safe" ? (
            <div className="flex gap-2 items-center">
              <Button
                className="flex gap-2"
                variant="outline"
                onClick={getSafeUSDCBalance}
                disabled={usdcBalanceLoading}
              >
                {usdcBalanceLoading ? (
                  <Loader className="animate-spin" />
                ) : (
                  <>
                    {usdcBalance ? (
                      `USDC Balance: ${usdcBalance.slice(0, -4)}`
                    ) : (
                      <>
                        <RefreshCcw size={16} />
                        USDC
                      </>
                    )}
                  </>
                )}
              </Button>
              <Button
                className="flex gap-2"
                variant="outline"
                onClick={getSafeBalance}
                disabled={balanceLoading}
              >
                {balanceLoading ? (
                  <Loader className="animate-spin" />
                ) : (
                  <>
                    {balance ? (
                      `cUSDC Balance: ${balance.slice(0, -4)}`
                    ) : (
                      <>
                        <RefreshCcw size={16} />
                        CUSDC
                      </>
                    )}
                  </>
                )}
                {/* nce */}
              </Button>
            </div>
          ) : (
            title
          )}
          {pathname === "/transfer-safe" && (
            <div className="flex items-center gap-2">
              <Button
                onClick={claimTokens}
                disabled={claimLoading}
                variant="outline"
              >
                {claimLoading ? (
                  <Loader className="animate-spin" />
                ) : (
                  "Claim Tokens"
                )}
              </Button>
            </div>
          )}
          {/* {pathname === "/transfer" && (
          <div className="flex items-center gap-2">
            <Button onClick={mintTokens} disabled={mintLoading} variant="ghost">
              {mintLoading ? (
                <Loader className="animate-spin" />
              ) : (
                "Mint Tokens"
              )}
            </Button>
            <Button
              onClick={claimTokens}
              disabled={claimLoading}
              variant="outline"
            >
              {claimLoading ? (
                <Loader className="animate-spin" />
              ) : (
                "Claim Tokens"
              )}
            </Button>
          </div>
        )} */}
        </div>
      ) : (
        <> </>
      )}

      <div>{children}</div>
    </>
  );
};

export default BasicPageLayout;
