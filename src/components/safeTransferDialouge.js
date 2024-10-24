import React, { useState } from "react";
import { AbiCoder, Contract, ethers } from "ethers";
import {
  Plus,
  Trash2,
  WalletIcon,
  CreditCard,
  ArrowRightLeft,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useWalletContext } from "@/privy/walletContext";
import { useFhevm } from "@/fhevm/fhevm-context";
import {
  ENCRYPTEDERC20CONTRACTABI,
  ENCRYPTEDERC20CONTRACTADDRESS,
  ERC20CONTRACTABI,
  ERC20CONTRACTADDRESS,
} from "@/utils/contracts";
import { toHexString } from "@/fhevm/fhe-functions";
import { useContractAddress } from "@/firebase/getContract";
import { SAFEABI } from "@/utils/safeContract";
import {
  buildSafeTransaction,
  buildSignatureBytes,
  safeApproveHash,
} from "@/utils/buildSafeTx";

const SafeTransferDialouge = () => {
  const [isReviewing, setIsReviewing] = useState(false);
  const { getContractAddress } = useContractAddress();
  const [error, setError] = useState(null);
  const { signer, address } = useWalletContext();
  const [payments, setPayments] = useState([
    {
      recipient: "",
      amount: "",
      safeContractAddress: "",
    },
  ]);

  const { instance: fhevmInstance } = useFhevm();

  const addPayment = () => {
    setPayments([...payments, { recipient: "", amount: "" }]);
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

  const reviewPayments = async () => {
    setError(null);
    console.log("Form values:", payments);
    setIsReviewing(true);

    try {
      for (let i = 0; i < payments.length; i++) {
        const input = await fhevmInstance.createEncryptedInput(
          ENCRYPTEDERC20CONTRACTADDRESS,
          address
        );

        input.add64(ethers.parseUnits(payments[i].amount.toString(), 4));
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
      setIsReviewing(false);
    }
  };

  const allowance = async () => {
    try {
      let fnSelector = "0x095ea7b3";

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

      const erc20Contract = new Contract(
        ERC20CONTRACTADDRESS,
        ERC20CONTRACTABI,
        signer
      );
      const balance = await erc20Contract.balanceOf(safecontractAddress);
      console.log(balance.toString());

      const txn1 = {
        to: ERC20CONTRACTADDRESS,
        value: 0,
        data:
          fnSelector +
          AbiCoder.defaultAbiCoder()
            .encode(
              ["address", "uint256"],
              [ENCRYPTEDERC20CONTRACTADDRESS, balance] //take input
            )
            .slice(2),
        operation: 0,
        safeTxGas: 1000000,
        baseGas: 0,
        gasPrice: 1000000,
        gasToken: safecontractAddress,
        refundReceiver: address,
        nonce: await contractOwnerSafe.nonce(),
      };

      const tx = buildSafeTransaction(txn1);
      const signatureBytes = buildSignatureBytes([
        await safeApproveHash(signer, contractOwnerSafe, tx, true),
      ]);

      const response = await contractOwnerSafe.execTransaction(
        ERC20CONTRACTADDRESS,
        0,
        fnSelector +
          AbiCoder.defaultAbiCoder()
            .encode(
              ["address", "uint256"],
              [ENCRYPTEDERC20CONTRACTADDRESS, balance] //take input
            )
            .slice(2),
        0,
        1000000,
        0,
        1000000,
        safecontractAddress,
        address,
        signatureBytes,
        { gasLimit: 10000000 }
      );
      const txn = await response.getTransaction();

      //   console.log("Transaction hash:", txn.hash);
      await txn.wait(1);
      console.log("Approval to EncryptedERC20 successful!");

      const contractERC20 = new Contract(
        ERC20CONTRACTADDRESS,
        ERC20CONTRACTABI,
        signer
      );

      console.log(
        "Allowed no. of tokens: " +
          (await contractERC20.allowance(
            safecontractAddress,
            ENCRYPTEDERC20CONTRACTADDRESS
          ))
      );
    } catch (error) {
      console.error("Approval to EncryptedERC20 failed:", error);
    }
  };

  const cardAnimation = {
    initial: {
      opacity: 0,
      y: 10,
      scale: 0.98,
    },
    animate: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.25,
        ease: [0.4, 0, 0.2, 1],
      },
    },
    exit: {
      opacity: 0,
      y: -10,
      scale: 0.98,
      transition: {
        duration: 0.2,
        ease: [0.4, 0, 1, 1],
      },
    },
  };

  console.log(payments);
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Card className="bg-white hover:bg-gray-50 transition-colors cursor-pointer">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-2 rounded-full bg-gray-100">
                <ArrowRightLeft className="w-5 h-5 text-gray-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Transfer</h3>
                <p className="text-sm text-gray-500">Send tokens privately</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </AlertDialogTrigger>

      <AlertDialogContent className="sm:max-w-2xl p-0 gap-0 overflow-hidden">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.2 }}
          className="flex flex-col h-full"
        >
          {/* Header */}
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-gray-100">
                  <ArrowRightLeft className="w-5 h-5 text-gray-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Confidential Transfer
                </h2>
              </div>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <X className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 flex-1 overflow-y-auto max-h-[60vh]">
            <AnimatePresence mode="popLayout">
              {payments.map((payment, index) => (
                <motion.div
                  {...cardAnimation}
                  key={index}
                  transition={{ duration: 0.2, delay: index * 0.1 }}
                  className="mb-4"
                >
                  <div className="bg-gray-50 rounded-lg p-4 border">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm font-medium text-gray-600">
                        Payment {index + 1}
                      </span>
                      {index > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removePayment(index)}
                          className="text-red-500 hover:text-red-700 h-8 w-8 p-0"
                        >
                          <Trash2 size={16} />
                        </Button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">
                          Recipient
                        </label>
                        <div className="relative">
                          <Input
                            placeholder="0x..."
                            className="pl-10 bg-white/70 border-gray-200 hover:border-gray-300 focus:border-gray-300 transition-colors"
                            value={payment.recipient}
                            onChange={(e) =>
                              updatePayment(index, "recipient", e.target.value)
                            }
                          />
                          <WalletIcon
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                            size={16}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">
                          Amount
                        </label>
                        <div className="relative">
                          <Input
                            type="number"
                            placeholder="0.00"
                            className="pl-10 bg-white/70 border-gray-200 hover:border-gray-300 focus:border-gray-300 transition-colors"
                            value={payment.amount}
                            onChange={(e) =>
                              updatePayment(index, "amount", e.target.value)
                            }
                          />
                          <CreditCard
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                            size={16}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-gray-100 bg-gray-50/50">
            <AnimatePresence mode="wait">
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="mb-4 p-3 rounded-lg bg-red-50 text-red-600 text-sm"
                >
                  {error}
                </motion.div>
              )}
            </AnimatePresence>
            <div className="flex items-center justify-between">
              <Button
                onClick={addPayment}
                variant="outline"
                className="text-gray-600"
                disabled={isReviewing}
              >
                <Plus size={16} className="mr-2" />
                Add Payment
              </Button>
              <Button
                onClick={reviewPayments}
                className="bg-gray-900 hover:bg-gray-800 text-white px-8 min-w-[120px]"
                disabled={isReviewing}
              >
                {isReviewing ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center"
                  >
                    <svg
                      className="animate-spin -ml-1 mr-3 h-4 w-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Processing
                  </motion.div>
                ) : (
                  "Review"
                )}
              </Button>
            </div>
          </div>
        </motion.div>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default SafeTransferDialouge;
