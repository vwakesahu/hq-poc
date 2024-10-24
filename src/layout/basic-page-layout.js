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
  const { updateContractAddress, getContractAddress, loading } =
    useContractAddress();

  const mintTokens = async () => {
    try {
      setMintLoading(true);
      const encryptedErc20Contract = new Contract(
        ENCRYPTEDERC20CONTRACTADDRESS,
        ENCRYPTEDERC20CONTRACTABI,
        signer
      );

      console.log(encryptedErc20Contract);

      const response = await encryptedErc20Contract.mint(address, 1000000, {
        gasLimit: 1000000,
      });
      const tx = await response.getTransaction();
      console.log(tx);
      const receipt = await tx.wait();
      toast.success("cUSDC minted successfully");

      const erc20Contract = new Contract(
        ERC20CONTRACTADDRESS,
        ERC20CONTRACTABI,
        signer
      );
      const response2 = await erc20Contract.mintAndApprove(
        address,
        1000000,
        ENCRYPTEDERC20CONTRACTADDRESS,
        // ethers.parseEther(1000000),
        {
          gasLimit: 1000000,
        }
      );
      const tx2 = await response2.getTransaction();
      console.log(tx2);
      const receipt2 = await tx2.wait();

      // const approve = await erc20Contract.approve(
      //   ENCRYPTEDERC20CONTRACTADDRESS,
      //   1000000,
      //   { gasLimit: 1000000 }
      // );

      // const tx3 = await approve.getTransaction();
      // console.log(tx3);
      // const receipt3 = await tx3.wait();

      toast.success("USDC minted successfully");
    } catch (error) {
      console.log("got some error");
      console.error(error);
      setMintLoading(false);
    } finally {
      console.log("done");
      setMintLoading(false);
    }
  };

  const mintSafeTokens = async () => {
    try {
      setMintLoading(true);
      const encryptedErc20Contract = new Contract(
        ENCRYPTEDERC20CONTRACTADDRESS,
        ENCRYPTEDERC20CONTRACTABI,
        signer
      );

      console.log(encryptedErc20Contract);
      const safeAddress = await getContractAddress(address);
      if (!safeAddress.data) {
        console.error("No Safe contract address found");
        return;
      }

      const safecontractAddress = safeAddress.data.contractAddress;

      const response = await encryptedErc20Contract.mint(
        safecontractAddress,
        1000000,
        {
          gasLimit: 1000000,
        }
      );
      const tx = await response.getTransaction();
      console.log(tx);
      const receipt = await tx.wait();
      toast.success("cUSDC minted successfully");

      const erc20Contract = new Contract(
        ERC20CONTRACTADDRESS,
        ERC20CONTRACTABI,
        signer
      );

      const response2 = await erc20Contract.mintAndApprove(
        safecontractAddress,
        1000000,
        ENCRYPTEDERC20CONTRACTADDRESS,
        // ethers.parseEther(1000000),
        {
          gasLimit: 1000000,
        }
      );
      const tx2 = await response2.getTransaction();
      console.log(tx2);
      const receipt2 = await tx2.wait();

      // const approve = await erc20Contract.approve(
      //   ENCRYPTEDERC20CONTRACTADDRESS,
      //   1000000,
      //   { gasLimit: 1000000 }
      // );

      // const tx3 = await approve.getTransaction();
      // console.log(tx3);
      // const receipt3 = await tx3.wait();

      toast.success("USDC minted successfully");
    } catch (error) {
      console.log("got some error");
      console.error(error);
      setMintLoading(false);
    } finally {
      console.log("done");
      setMintLoading(false);
    }
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
                    `USDC Balance: ${usdcBalance}`
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
                    `cUSDC Balance: ${balance}`
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
        )}
      </div>

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
                    `USDC Balance: ${usdcBalance}`
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
                    `cUSDC Balance: ${balance}`
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
              onClick={mintSafeTokens}
              disabled={mintLoading}
              variant="ghost"
            >
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
        )}
        {pathname === "/transfer" && (
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
        )}
      </div>

      <div>{children}</div>
    </>
  );
};

export default BasicPageLayout;
