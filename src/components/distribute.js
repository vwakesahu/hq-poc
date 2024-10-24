import { motion, AnimatePresence } from "framer-motion";
import React, { useState } from "react";
import {
  Package,
  X,
  Plus,
  AlertCircle,
  Loader2,
  Trash2,
  WalletIcon,
  CreditCard,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Contract } from "ethers";
import { AbiCoder } from "ethers";
import { useWalletContext } from "@/privy/walletContext";
import { useFhevm } from "@/fhevm/fhevm-context";
import { toHexString } from "@/fhevm/fhe-functions";
import {
  ENCRYPTEDERC20CONTRACTABI,
  ENCRYPTEDERC20CONTRACTADDRESS,
  ERC20CONTRACTABI,
  ERC20CONTRACTADDRESS,
} from "@/utils/contracts";

const DistributeDialog = () => {
  const { signer, address } = useWalletContext();
  const { instance: fhevmInstance } = useFhevm();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);

  const [payments, setPayments] = useState([
    {
      recipient: "0xfCefe53c7012a075b8a711df391100d9c431c468",
      amount: "3000",
    },
    {
      recipient: "0xa44366bAA26296c1409AD1e284264212029F02f1",
      amount: "3000",
    },
    {
      recipient: "0xc1d91b49A1B3D1324E93F86778C44a03f1063f1b",
      amount: "3000",
    },
  ]);

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

  const handleDistribute = async () => {
    setIsProcessing(true);
    setError(null);

    try {
      const encryptedERC20Contract = new Contract(
        ENCRYPTEDERC20CONTRACTADDRESS,
        ENCRYPTEDERC20CONTRACTABI,
        signer
      );

      let finalData = [];
      let amount = 0;

      for (let i = 0; i < payments.length; i++) {
        const input = await fhevmInstance.createEncryptedInput(
          ENCRYPTEDERC20CONTRACTADDRESS,
          address
        );
        amount = amount + Number(payments[i].amount);

        await input.add64(Number(payments[i].amount));
        const encryptedInput = await input.encrypt();
        const data1 = [
          payments[i].recipient,
          encryptedInput.handles[0],
          "0x" + toHexString(encryptedInput.inputProof),
        ];
        finalData.push(data1);
      }

      const abiCoder = AbiCoder.defaultAbiCoder();
      const encodedData1 = abiCoder.encode(
        ["tuple(address,bytes32,bytes)[]"],
        [finalData]
      );

      const response = await encryptedERC20Contract.wrapAndDistribute(
        amount,
        encodedData1,
        { gasLimit: 7000000 }
      );

      const tx = await response.getTransaction();
      await tx.wait();
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to process distribution");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Card className="bg-white hover:bg-gray-50 transition-colors cursor-pointer">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-2 rounded-full bg-gray-100">
                <Package className="w-5 h-5 text-gray-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Distribute</h3>
                <p className="text-sm text-gray-500">Batch send tokens</p>
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
                  <Package className="w-5 h-5 text-gray-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Wrap & Distribute
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
                  key={index}
                  {...cardAnimation}
                  transition={{
                    duration: 0.25,
                    delay: index * 0.05,
                    ease: [0.4, 0, 0.2, 1],
                  }}
                  className="mb-3"
                >
                  <div className="bg-gray-50 rounded-lg p-4 border">
                    <div className="flex items-center justify-between mb-4">
                      <span className="font-medium text-gray-700">
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
                  className="mb-4 p-3 rounded-lg overflow-x-auto bg-red-50 text-red-600 text-sm flex items-center gap-2"
                >
                  <AlertCircle className="h-4 w-4" />
                  Failed to process distribution
                </motion.div>
              )}
            </AnimatePresence>
            <div className="flex items-center justify-between">
              <Button
                onClick={addPayment}
                variant="outline"
                className="text-gray-600"
                disabled={isProcessing}
              >
                <Plus size={16} className="mr-2" />
                Add Payment
              </Button>
              <Button
                onClick={handleDistribute}
                className="bg-gray-900 hover:bg-gray-800 text-white px-8 min-w-[160px]"
                disabled={isProcessing || payments.length === 0}
              >
                {isProcessing ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center"
                  >
                    <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                    Processing
                  </motion.div>
                ) : (
                  "Wrap & Distribute"
                )}
              </Button>
            </div>
          </div>
        </motion.div>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DistributeDialog;
