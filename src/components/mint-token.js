import React from "react";
import { motion } from "framer-motion";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Loader2, Wallet, X } from "lucide-react";
import { Contract, ethers } from "ethers";
import { toast } from "sonner";
import { useWalletContext } from "@/privy/walletContext";
import {
  ENCRYPTEDERC20CONTRACTABI,
  ENCRYPTEDERC20CONTRACTADDRESS,
  ERC20CONTRACTABI,
  ERC20CONTRACTADDRESS,
} from "@/utils/contracts";
import { useContractAddress } from "@/firebase/getContract";

const MintTokensDialog = ({ path }) => {
  const [tokenType, setTokenType] = React.useState("usdc");
  const [amount, setAmount] = React.useState("");
  const [mintLoading, setMintLoading] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  const { address, signer } = useWalletContext();
  const { getContractAddress } = useContractAddress();

  const mintUSDC = async (targetAddress) => {
    const erc20Contract = new Contract(
      ERC20CONTRACTADDRESS,
      ERC20CONTRACTABI,
      signer
    );

    const response = await erc20Contract.mintAndApprove(
      targetAddress,
      amount,
      ENCRYPTEDERC20CONTRACTADDRESS,
      {
        gasLimit: 1000000,
      }
    );
    const tx = await response.getTransaction();
    console.log(tx);
    await tx.wait();
    toast.success("USDC minted successfully");
  };

  const mintCUSDC = async (targetAddress) => {
    const encryptedErc20Contract = new Contract(
      ENCRYPTEDERC20CONTRACTADDRESS,
      ENCRYPTEDERC20CONTRACTABI,
      signer
    );

    // console.log(ethers.parseUnits(amount.toString(), 4));

    const response = await encryptedErc20Contract.mint(
      targetAddress,
      ethers.parseUnits(amount.toString(), 4),
      {
        gasLimit: 1000000,
      }
    );
    const tx = await response.getTransaction();
    console.log(tx);
    await tx.wait();
    toast.success("cUSDC minted successfully");
  };

  const mintTokens = async () => {
    try {
      setMintLoading(true);
      if (tokenType === "usdc") {
        await mintUSDC(address);
      } else {
        await mintCUSDC(address);
      }
    } catch (error) {
      console.error("Error minting tokens:", error);
      toast.error(`Failed to mint ${tokenType.toUpperCase()}`);
    } finally {
      setMintLoading(false);
      setOpen(false);
    }
  };

  const mintSafeTokens = async () => {
    try {
      setMintLoading(true);
      const safeAddress = await getContractAddress(address);

      if (!safeAddress.data) {
        toast.error("No Safe contract address found");
        return;
      }

      const safecontractAddress = safeAddress.data.contractAddress;

      if (tokenType === "usdc") {
        await mintUSDC(safecontractAddress);
      } else {
        await mintCUSDC(safecontractAddress);
      }
    } catch (error) {
      console.error("Error minting safe tokens:", error);
      toast.error(`Failed to mint ${tokenType.toUpperCase()} to Safe`);
    } finally {
      setMintLoading(false);
      setOpen(false);
    }
  };

  const handleMint = async () => {
    if (!amount) return;

    if (path === "/transfer") {
      await mintTokens();
    } else if (path === "/transfer-safe") {
      await mintSafeTokens();
    }
  };

  const buttonText = path === "/transfer" ? "Mint Tokens" : "Mint Safe Tokens";
  const dialogTitle = path === "/transfer" ? "Mint Tokens" : "Mint Safe Tokens";
  const dialogDescription =
    path === "/transfer"
      ? "Choose token type and amount to mint to your wallet"
      : "Choose token type and amount to mint to your Safe";

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button className="w-full flex items-center gap-2" variant="ghost">
          <Wallet className="h-4 w-4" />
          {buttonText}
        </Button>
      </AlertDialogTrigger>

      <AlertDialogContent className="sm:max-w-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
        >
          <AlertDialogHeader>
            <div className="flex items-center justify-between">
              <AlertDialogTitle>{dialogTitle}</AlertDialogTitle>
              <X onClick={() => setOpen(false)} size={16} />
            </div>

            <AlertDialogDescription>{dialogDescription}</AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-6 py-4">
            <RadioGroup
              defaultValue="usdc"
              value={tokenType}
              onValueChange={setTokenType}
              className="grid grid-cols-2 gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="usdc" id="usdc" />
                <Label htmlFor="usdc">USDC</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="cusdc" id="cusdc" />
                <Label htmlFor="cusdc">cUSDC</Label>
              </div>
            </RadioGroup>

            <div className="space-y-2">
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                type="number"
                placeholder="Enter amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>

            <div className="flex justify-end">
              <Button
                onClick={handleMint}
                disabled={!amount || mintLoading}
                className="w-full bg-gray-900 hover:bg-gray-700 text-white"
              >
                {mintLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Minting...
                  </>
                ) : (
                  `Mint ${tokenType.toUpperCase()}`
                )}
              </Button>
            </div>
          </div>
        </motion.div>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default MintTokensDialog;
