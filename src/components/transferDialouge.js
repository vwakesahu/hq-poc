import React, { useState } from "react";
import { Contract, ethers } from "ethers";
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
} from "@/utils/contracts";
import { toHexString } from "@/fhevm/fhe-functions";

const TransferDialog = () => {
  const [isReviewing, setIsReviewing] = useState(false);
  const [error, setError] = useState(null);
  const { signer, address } = useWalletContext();
  const [payments, setPayments] = useState([
    {
      recipient: "",
      amount: "",
    },
  ]);
  const { instance: fhevmInstance } = useFhevm();

  const addPayment = () => {
    setPayments([...payments, { recipient: "", amount: "" }]);
  };

  const removePayment = (index) => {
    setPayments(payments.filter((_, i) => i !== index));
  };

  const updatePayment = (index, field, value) => {
    const updatedPayments = [...payments];
    updatedPayments[index][field] = value;
    setPayments(updatedPayments);
  };

  const reviewPayments = async () => {
    setIsReviewing(true);
    setError(null);

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
        input.add64(ethers.parseUnits(payments[i].amount.toString(), 4));
        const encryptedInput = input.encrypt();

        const response = await encryptedERC20Contract[
          "transfer(address,bytes32,bytes)"
        ](
          payments[i].recipient,
          encryptedInput.handles[0],
          "0x" + toHexString(encryptedInput.inputProof)
        );

        const tx = await response.getTransaction();
        await tx.wait();
      }
    } catch (err) {
      console.error(err);
      setError(err.message || "Transaction failed. Please try again.");
    } finally {
      setIsReviewing(false);
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

export default TransferDialog;
