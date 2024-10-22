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
import { Contract } from "ethers";
import { toHexString } from "@/fhevm/fhe-functions";

const TransferForm = () => {
  const { signer, w0, address, isLoading, error } = useWalletContext();
  const [payments, setPayments] = useState([
    {
      recipient: "",
      amount: "",
    },
  ]);
  const { instance: fhevmInstance } = useFhevm();
  const [balance, setBalance] = useState(null);
  const [balanceLoading, setBalanceLoading] = useState(false);

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

  const getShortAddress = (address) => {
    if (address.length > 10) {
      return `${address.slice(0, 4)}...${address.slice(-4)}`;
    }
    return address;
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

  const reviewPayments = async () => {
    console.log("Form values:", payments);

    // [
    //   {
    //     recipient: "nzhsbdvjhabsdjkhb",
    //     amount: "5454",
    //   },
    //   {
    //     recipient: "sdcisdgbycvu",
    //     amount: "45745",
    //   },
    // ];

    const encryptedERC20Contract = new Contract(
      ENCRYPTEDERC20CONTRACTADDRESS,
      ENCRYPTEDERC20CONTRACTABI,
      signer
    );

    for (let i = 0; i < payments.length; i++) {
      try {
        const input = await fhevmInstance.createEncryptedInput(
          ENCRYPTEDERC20CONTRACTADDRESS,
          address
        );
        input.add64(Number(payments[i].amount));
        const encryptedInput = input.encrypt();
        // console.log(
        //   "Encryted input",
        //   await toHexString(encryptedInput.inputProof)
        // );
        // console.log(
        //   "Encryted input",
        //   await toHexString(encryptedInput.inputProof)
        // );

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
      {/* <Card className="mb-8">
        <CardContent className="p-6">
          <h2 className="text-lg font-semibold mb-4">Selected Wallet</h2>
          <Button className="bg-gray-900 hover:bg-gray-700 text-white flex items-center">
            <Wallet className="mr-2" size={18} />
            {address && getShortAddress(address)}
          </Button>
        </CardContent>
      </Card> */}

      <Card className="">
        <CardContent className="p-6">
          <div className="flex w-full justify-between">
            <h2 className="text-lg font-semibold pb-4">
              Payments ({payments.length})
            </h2>
            <div className="flex gap-2 items-center">
              <Button className="flex gap-2" variant="outline">
                <RefreshCcw size={16} />
                USDC
                {/* <span className="font-semibold">14000</span> */}
              </Button>
              <Button className="flex gap-2" variant="outline">
                <RefreshCcw size={16} />
                CUSDC
              </Button>
            </div>

            {/* <Button
              onClick={addPayment}
              className="bg-gray-900 hover:bg-gray-700 text-white"
            >
              <Plus size={16} />
            </Button> */}
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
          {/* <Button
            variant="secondary"
            onClick={addPayment}
            className="flex items-center border bg-white hover:bg-white/70"
          >
            <Plus size={16} className="mr-2" />
            Add another payment
          </Button> */}
        </CardContent>
      </Card>

      <div className="mt-8 flex justify-end gap-4">
        {/* <Button
          className="bg-gray-900 hover:bg-gray-700 text-white px-6"
          onClick={getBalance}
        >
          {balanceLoading ? (
            <Loader className="animate-spin" />
          ) : (
            <>{balance ? `Balance: ${balance}` : "Get Balance"}</>
          )}
        </Button> */}
        <Button
          className="bg-gray-900 hover:bg-gray-700 text-white px-6"
          onClick={reviewPayments}
        >
          Review Payments
        </Button>
      </div>
    </div>
  );
};

const Page = () => {
  return (
    <BasicPageLayout title="Transfer Funds">
      <TransferForm />
    </BasicPageLayout>
  );
};

export default Page;
