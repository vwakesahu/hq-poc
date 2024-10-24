"use client";
import React, { useState } from "react";
import { Loader, Plus, RefreshCcw, Trash2, Wallet } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import BasicPageLayout from "@/layout/basic-page-layout";
import { useWalletContext } from "@/privy/walletContext";
import { useFhevm } from "@/fhevm/fhevm-context";
import { Wallet as WalletIcon, CreditCard } from "lucide-react";
import {
  ENCRYPTEDERC20CONTRACTABI,
  ENCRYPTEDERC20CONTRACTADDRESS,
} from "@/utils/contracts";
import { AbiCoder, Contract } from "ethers";
import { toHexString } from "@/fhevm/fhe-functions";
import { SAFEABI } from "@/utils/safeContract";
import { useContractAddress } from "@/firebase/getContract";
import SafeTransferDialouge from "@/components/safeTransferDialouge";
import SafeDistribute from "@/components/safeDistribute";
import {
  buildSafeTransaction,
  buildSignatureBytes,
  safeApproveHash,
} from "@/utils/buildSafeTx";

const TransferForm = () => {
  const { signer, w0, address, isLoading, error } = useWalletContext();
  const { getContractAddress } = useContractAddress();
  const { instance: fhevmInstance } = useFhevm();
  const [balance, setBalance] = useState(null);
  const [balanceLoading, setBalanceLoading] = useState(false);
  const [payments, setPayments] = useState([
    {
      recipient: "",
      amount: "",
      safeContractAddress: "",
    },
  ]);

  const addPayment = () => {
    setPayments([
      ...payments,
      { recipient: "", amount: "", safeContractAddress: "" },
    ]);
  };

  const removePayment = (index) => {
    setPayments(payments.filter((_, i) => i !== index));
  };

  const updatePayment = async (index, field, value) => {
    const updatedPayments = [...payments];
    updatedPayments[index][field] = value;

    // If recipient field is updated, fetch and update the safe contract address
    if (field === "recipient" && value) {
      try {
        const safeContractAddress = await getContractAddress(value);
        if (safeContractAddress.data) {
          updatedPayments[index].safeContractAddress =
            safeContractAddress.data.contractAddress;
        } else {
          updatedPayments[index].safeContractAddress = "";
        }
      } catch (error) {
        console.error("Error fetching safe contract address:", error);
        updatedPayments[index].safeContractAddress = "";
      }
    }

    setPayments(updatedPayments);
  };

  console.log("payments", payments);

  const confidentialTransfer = async () => {
    console.log("Form values:", payments);
    const encryptedERC20Contract = new Contract(
      ENCRYPTEDERC20CONTRACTADDRESS,
      ENCRYPTEDERC20CONTRACTABI,
      signer
    );

    try {
      for (let i = 0; i < payments.length; i++) {
        const input = await fhevmInstance.createEncryptedInput(
          ENCRYPTEDERC20CONTRACTADDRESS,
          address
        );
        input.add64(Number(payments[i].amount));
        const encryptedInput = input.encrypt();

        const fnSelector = "0x7b7e0a5a";
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

        const txn2 = {
          to: ENCRYPTEDERC20CONTRACTADDRESS,
          value: 0,
          data:
            fnSelector +
            AbiCoder.defaultAbiCoder()
              .encode(
                ["address", "bytes32", "bytes"],
                [
                  payments[i].safeContractAddress,
                  encryptedInput.handles[0],
                  "0x" + toHexString(encryptedInput.inputProof),
                ]
              )
              .slice(2),
          operation: 0,
          safeTxGas: 1000000,
          baseGas: 0,
          gasPrice: 0,
          gasToken: address,
          refundReceiver: safecontractAddress,
          nonce: await contractOwnerSafe.nonce(),
        };

        const tx2 = buildSafeTransaction(txn2);

        const signatureBytes2 = buildSignatureBytes([
          await safeApproveHash(signer, contractOwnerSafe, tx2, true),
        ]);

        try {
          const response = await contractOwnerSafe.execTransaction(
            ENCRYPTEDERC20CONTRACTADDRESS,
            0,
            fnSelector +
              AbiCoder.defaultAbiCoder()
                .encode(
                  ["address", "bytes32", "bytes"],
                  [
                    payments[i].safeContractAddress,
                    encryptedInput.handles[0],
                    "0x" + toHexString(encryptedInput.inputProof),
                  ]
                )
                .slice(2),
            // "0xc6dad082",
            0,
            1000000,
            0,
            // 1000000,
            0,
            address,
            safecontractAddress,
            signatureBytes2,
            { gasLimit: 10000000 }
          );
          const txn = await response.getTransaction();
          console.log("Transaction hash:", txn.hash);
          await txn.wait(1);
          console.log("Wrap and distribute to receiver safes successful!");
        } catch (error) {
          console.error("Wrap and distribute to receiver safes failed:", error);
        }

        // const response = await encryptedERC20Contract[
        //   "transfer(address,bytes32,bytes)"
        // ](
        //   payments[i].safeContractAddress,
        //   encryptedInput.handles[0],
        //   "0x" + toHexString(encryptedInput.inputProof)
        // );

        // const tx = await response.getTransaction();
        // await tx.wait();
      }
    } catch (err) {
      console.error(err);
      setError(err.message || "Transaction failed. Please try again.");
    } finally {
      // setIsReviewing(false);
    }
  };

  const claimPayments = async () => {
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

    try {
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
      console.log("Claim by Carol safe successful!");
    } catch (error) {
      console.error("Claim by Carol safe failed:", error);
    }
  };

  const reviewPayments = async () => {
    console.log("Form values:", payments);

    for (let i = 0; i < payments.length; i++) {
      try {
        const encryptedERC20Contract = new Contract(
          payments[i].safeContractAddress,
          SAFEABI,
          signer
        );

        const input = await fhevmInstance.createEncryptedInput(
          ENCRYPTEDERC20CONTRACTADDRESS,
          address
        );
        input.add64(Number(payments[i].amount));
        const encryptedInput = input.encrypt();

        const response = await encryptedERC20Contract[
          "transfer(address,bytes32,bytes)"
        ](
          payments[i].recipient,
          encryptedInput.handles[0],
          "0x" + toHexString(encryptedInput.inputProof)
        );

        const tx = await response.getTransaction();
        console.log(tx);
        const receipt = await tx.wait();
      } catch (error) {
        console.error(error);
      }
    }
  };

  return (
    <div className="max-w-4xl mx-auto pb-8 flex flex-col h-full">
      <Button onClick={claimPayments}>Claim</Button>
      <Card>
        <CardContent className="p-6">
          <div className="flex w-full justify-between">
            <h2 className="text-lg font-semibold pb-4">
              Payments ({payments.length})
            </h2>
            <Button
              onClick={addPayment}
              className="bg-gray-900 hover:bg-gray-700 text-white"
            >
              <Plus size={16} />
            </Button>
          </div>

          <div className="max-h-80 overflow-y-auto mb-4 py-1 scrollbar-hidden">
            <div className="space-y-4">
              {payments.map((payment, index) => (
                <Card
                  key={index}
                  className="border border-black/15 shadow-none bg-muted"
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-4">
                      <span className="font-medium text-gray-700">
                        Payment {index + 1}
                      </span>
                      {index > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removePayment(index)}
                          className="text-red-500 hover:text-red-700 hover:border hover:border-red-700 hover:bg-red-50"
                        >
                          <Trash2 size={16} />
                        </Button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Recipient *
                        </label>
                        <div className="relative">
                          <Input
                            placeholder="Enter recipient address"
                            className="w-full pl-10 bg-white"
                            value={payment.recipient}
                            onChange={(e) =>
                              updatePayment(index, "recipient", e.target.value)
                            }
                          />
                          <WalletIcon
                            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                            size={18}
                          />
                        </div>
                        {payment.safeContractAddress && (
                          <div className="text-sm font-semibold mt-4">
                            Safe Contract:{" "}
                            {payment.safeContractAddress.slice(0, 6)}...
                            {payment.safeContractAddress.slice(-4)}
                          </div>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Amount *
                        </label>
                        <div className="relative">
                          <Input
                            placeholder="Enter amount"
                            className="w-full pl-10 bg-white"
                            type="number"
                            value={payment.amount}
                            onChange={(e) =>
                              updatePayment(index, "amount", e.target.value)
                            }
                          />
                          <CreditCard
                            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                            size={18}
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <SafeTransferDialouge />
      <SafeDistribute />

      <div className="mt-8 flex justify-end gap-4">
        <Button
          className="bg-gray-900 hover:bg-gray-700 text-white px-6"
          onClick={confidentialTransfer}
        >
          Review Payments
        </Button>
      </div>
    </div>
  );
};

const Page = () => {
  const [safeContractAddress, setSafeContractAddress] = useState("");
  return (
    <BasicPageLayout>
      <TransferForm />
    </BasicPageLayout>
  );
};

export default Page;
