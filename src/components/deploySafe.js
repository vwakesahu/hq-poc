"use client";
import { Button } from "@/components/ui/button";
import { useWalletContext } from "@/privy/walletContext";
import React, { useState } from "react";
import { ethers } from "ethers";
import { SAFEABI, SAFEBYTECODE } from "@/utils/safeContract";
import { useContractAddress } from "@/firebase/getContract";

const DeploySafe = () => {
  const { signer, address } = useWalletContext();
  const [isDeploying, setIsDeploying] = useState(false);
  const [status, setStatus] = useState("");
  const [contractAddress, setContractAddress] = useState("");
  const { updateContractAddress } = useContractAddress();

  const deployContract = async () => {
    if (!signer || !address) {
      setStatus("No signer or address available");
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
      console.log(addressToBeCreated);
      setTimeout(async () => {
        try {
          const result = await updateContractAddress(
            address,
            addressToBeCreated
          );
          console.log("Success:", result);
        } catch (err) {
          console.error("Error:", err.message);
        }
        setContractAddress(addressToBeCreated);
        setIsDeploying(false);
        setStatus(`Contract deployed at: ${addressToBeCreated}`);
      }, 8000);
    } catch (error) {
      console.error("Deployment error:", error);
      setStatus(`Deployment failed: ${error.message}`);
    } finally {
      setIsDeploying(false);
    }
  };

  return (
    <div className="p-4 space-y-4">
      <Button onClick={deployContract} disabled={isDeploying}>
        {isDeploying ? "Deploying..." : "Deploy Safe"}
      </Button>
    </div>
  );
};

export default DeploySafe;
