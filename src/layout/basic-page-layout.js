"use client";

import { Button } from "@/components/ui/button";
import { useWalletContext } from "@/privy/walletContext";
import {
  ENCRYPTEDERC20CONTRACTABI,
  ENCRYPTEDERC20CONTRACTADDRESS,
  ERC20CONTRACTABI,
  ERC20CONTRACTADDRESS,
} from "@/utils/contracts";
import { Contract } from "ethers";
import { Loader } from "lucide-react";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

const BasicPageLayout = ({ children, title }) => {
  const pathname = usePathname();
  const [mintLoading, setMintLoading] = useState(false);
  const [claimLoading, setClaimLoading] = useState(false);
  const { signer, address } = useWalletContext();
  const mintTokens = async () => {
    try {
      setMintLoading(true);
      const encryptedErc20Contract = new Contract(
        ENCRYPTEDERC20CONTRACTADDRESS,
        ENCRYPTEDERC20CONTRACTABI,
        signer
      );

      console.log(encryptedErc20Contract);

      const response = await encryptedErc20Contract.mint(1000000, {
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
      const response2 = await erc20Contract.mint(address, 1000000, {
        gasLimit: 1000000,
      });
      const tx2 = await response2.getTransaction();
      console.log(tx2);
      const receipt2 = await tx2.wait();
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

  const claimTokens = async () => {};
  return (
    <>
      <div className="py-8 text-2xl font-semibold max-w-4xl mx-auto flex items-center justify-between">
        {title}
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
