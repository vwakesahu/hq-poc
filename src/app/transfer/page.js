"use client";
import React, { useState } from "react";
import { Plus, Trash2, Wallet } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import BasicPageLayout from "@/layout/basic-page-layout";
import { useWalletContext } from "@/privy/walletContext";
import { useFhevm } from "@/fhevm/fhevm-context";
import {
  ENCRYPTEDERC20CONTRACTABI,
  ENCRYPTEDERC20CONTRACTADDRESS,
} from "@/utils/contracts";
import { Contract } from "ethers";

const TransferForm = () => {
  const { signer, w0, address, isLoading, error } = useWalletContext();
  const [payments, setPayments] = useState([{}]);
  const { instance: fhevmInstance } = useFhevm();

  const addPayment = () => {
    setPayments([...payments, {}]);
  };

  const removePayment = (index) => {
    setPayments(payments.filter((_, i) => i !== index));
  };

  const getShortAddress = (address) => {
    if (address.length > 10) {
      return `${address.slice(0, 4)}...${address.slice(-4)}`;
    }
    return address;
  };

  const getBalance = async () => {
    // setIsLoading(true);
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
      const balanceHandle = await encryptedErc20Contract.balanceOf(
        "0xe0Af5dC2E3c92632140776C5a780212592588042"
      );
      console.log("balanceHandle", balanceHandle);
      if (balanceHandle.toString() === "0") {
        console.log("You have no balance to fetch");
        // toast.error("You have no balance to fetch.");
        // setBalance(null);
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
        // const vestingContract = new Contract(
        //   VESTING_CONTRACT_ADDRESS,
        //   VESTINGABI,
        //   signer
        // );
        // const plans = await vestingContract.plans(1);
        // console.log(plans);
        // setBalance(balanceResult.toString());
      }
    } catch (err) {
      console.error(err);
      // toast.error("Failed to fetch balance. Please try again.");
      // setError("Failed to fetch balance. Please try again.");
      // setIsErrorModalOpen(true);
    } finally {
      console.log("completed");
      // setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto  pb-8">
      <Card className="mb-8">
        <CardContent className="p-6">
          <h2 className="text-lg font-semibold mb-4">Selected Wallet</h2>
          <Button className="bg-gray-900 hover:bg-gray-700 text-white flex items-center">
            <Wallet className="mr-2" size={18} />
            {address && getShortAddress(address)}
          </Button>
        </CardContent>
      </Card>

      <Card className="overflow-hidden">
        <CardContent className="p-6 overflow-hidden">
          <h2 className="text-lg font-semibold mb-4">
            Payments ({payments.length})
          </h2>
          <div className="space-y-6">
            {payments.map((_, index) => (
              <Card key={index} className="border border-gray-200">
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
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
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
                      <Input
                        placeholder="Enter recipient address"
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Amount *
                      </label>
                      <Input placeholder="Enter amount" className="w-full" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mt-6">
            <Button
              variant="secondary"
              onClick={addPayment}
              className="flex items-center border"
            >
              <Plus size={16} className="mr-2" />
              Add another payment
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="mt-8 flex justify-end">
        <Button
          className="bg-gray-900 hover:bg-gray-700 text-white px-6"
          onClick={getBalance}
        >
          Get Balance
        </Button>
        <Button className="bg-gray-900 hover:bg-gray-700 text-white px-6">
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
