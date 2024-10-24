import { Button } from "@/components/ui/button";
import { useWalletContext } from "@/privy/walletContext";
import React, { useState } from "react";
import { ethers } from "ethers";
import { SAFEABI, SAFEBYTECODE } from "@/utils/safeContract";
import { useContractAddress } from "@/firebase/getContract";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const DeploySafe = ({ onDeploySuccess }) => {
  const { signer, address } = useWalletContext();
  const [isDeploying, setIsDeploying] = useState(false);
  const [status, setStatus] = useState("");
  const [contractAddress, setContractAddress] = useState("");
  const { updateContractAddress } = useContractAddress();

  const deployContract = async () => {
    if (!signer || !address) {
      toast.error("No signer or address available");
      return;
    }

    setIsDeploying(true);
    setStatus("Starting deployment...");

    try {
      const factory = new ethers.ContractFactory(SAFEABI, SAFEBYTECODE, signer);

      setStatus("Sending deployment transaction...");

      // Deploy the contract
      const deployTransaction = await factory.deploy(
        [address, "0x1950498e95274Dc79Fbca238C2BE53684D69886F"],
        1,
        {
          gasLimit: 7000000,
        }
      );

      setStatus("Waiting for transaction to be mined...");

      // Get the transaction response
      const tx = deployTransaction.deploymentTransaction();
      if (!tx) throw new Error("No deployment transaction found");
      const txResponse = await tx.getTransaction();
      const addressToBeCreated = txResponse.creates;

      // Wait for deployment and database update
      await new Promise((resolve) => {
        setTimeout(async () => {
          try {
            await updateContractAddress(address, addressToBeCreated);
            setContractAddress(addressToBeCreated);
            toast.success("Safe deployed successfully!");
            onDeploySuccess?.(); // Call the success callback
          } catch (err) {
            console.error("Error updating contract address:", err);
            toast.error("Error updating contract address");
          }
          resolve();
        }, 8000);
      });
    } catch (error) {
      console.error("Deployment error:", error);
      toast.error(`Deployment failed: ${error.message}`);
    } finally {
      setIsDeploying(false);
    }
  };

  return (
    <div className="space-y-4">
      {status && <p className="text-sm text-gray-600 text-center">{status}</p>}
      <Button
        onClick={deployContract}
        disabled={isDeploying}
        className="w-full"
      >
        {isDeploying ? (
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Deploying Safe...</span>
          </div>
        ) : (
          "Deploy Safe"
        )}
      </Button>
    </div>
  );
};

export default DeploySafe;
