"use client";
import React, { useEffect, useState } from "react";
import { Copy, Check, Loader2, Lock, RefreshCw } from "lucide-react";
import { useContractAddress } from "@/firebase/getContract";
import { Button } from "@/components/ui/button";
import { Contract } from "ethers";
import { useWalletContext } from "@/privy/walletContext";
import { useFhevm } from "@/fhevm/fhevm-context";
import {
  ENCRYPTEDERC20CONTRACTABI,
  ENCRYPTEDERC20CONTRACTADDRESS,
  ERC20CONTRACTABI,
  ERC20CONTRACTADDRESS,
} from "@/utils/contracts";

const truncateAddress = (address) => {
  if (!address) return "";
  const start = address.slice(0, 6);
  const end = address.slice(-4);
  return `${start}...${end}`;
};

const formatCurrency = (amount) => {
  if (!amount) return "$0.00";
  //   return amount
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount.slice(0, -4));
};

const CopyButton = ({ text }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className="ml-2 p-1 text-gray-500 hover:text-gray-700 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
      title="Copy address"
    >
      {copied ? (
        <Check className="w-4 h-4 text-green-500" />
      ) : (
        <Copy className="w-4 h-4 text-black/20" />
      )}
    </button>
  );
};

const AddressTable = () => {
  const { getAllAddresses, loading } = useContractAddress();
  const { instance: fhevmInstance } = useFhevm();
  const { signer, address } = useWalletContext();
  const [loadingMint, setLoadingMint] = useState(false);

  const [addresses, setAddresses] = useState([]);
  const [fetchError, setFetchError] = useState(null);
  const [balances, setBalances] = useState({});
  const [loadingStates, setLoadingStates] = useState({});
  const [decryptedAddresses, setDecryptedAddresses] = useState({});

  const getBalance = async (ownerAddress, safeAddress) => {
    setLoadingStates((prev) => ({
      ...prev,
      [safeAddress]: { ...prev[safeAddress], cusdcLoading: true },
    }));

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
        ownerAddress
      );

      if (balanceHandle.toString() === "0") {
        setBalances((prev) => ({
          ...prev,
          [safeAddress]: { ...prev[safeAddress], cusdc: "0" },
        }));
      } else {
        const balanceResult = await fhevmInstance.reencrypt(
          balanceHandle,
          privateKey,
          publicKey,
          signature.replace("0x", ""),
          ENCRYPTEDERC20CONTRACTADDRESS,
          address
        );

        setBalances((prev) => ({
          ...prev,
          [safeAddress]: {
            ...prev[safeAddress],
            cusdc: balanceResult.toString(),
          },
        }));
      }
    } catch (err) {
      console.error("cUSDC Balance Error:", err);
      setBalances((prev) => ({
        ...prev,
        [safeAddress]: { ...prev[safeAddress], cusdc: null },
      }));
    } finally {
      setLoadingStates((prev) => ({
        ...prev,
        [safeAddress]: { ...prev[safeAddress], cusdcLoading: false },
      }));
    }
  };

  const getSafeBalance = async (ownerAddress, safeAddress) => {
    setLoadingStates((prev) => ({
      ...prev,
      [safeAddress]: { ...prev[safeAddress], safeLoading: true },
    }));

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

      const balanceHandle = await encryptedErc20Contract.balanceOf(safeAddress);

      if (balanceHandle.toString() === "0") {
        setBalances((prev) => ({
          ...prev,
          [safeAddress]: { ...prev[safeAddress], safe: "0" },
        }));
      } else {
        const balanceResult = await fhevmInstance.reencrypt(
          balanceHandle,
          privateKey,
          publicKey,
          signature.replace("0x", ""),
          ENCRYPTEDERC20CONTRACTADDRESS,
          address
        );

        setBalances((prev) => ({
          ...prev,
          [safeAddress]: {
            ...prev[safeAddress],
            safe: balanceResult.toString(),
          },
        }));
      }
    } catch (err) {
      console.error("Safe Balance Error:", err);
      setBalances((prev) => ({
        ...prev,
        [safeAddress]: { ...prev[safeAddress], safe: null },
      }));
    } finally {
      setLoadingStates((prev) => ({
        ...prev,
        [safeAddress]: { ...prev[safeAddress], safeLoading: false },
      }));
    }
  };

  const handleDecrypt = async (ownerAddress, safeAddress) => {
    setDecryptedAddresses((prev) => ({
      ...prev,
      [safeAddress]: true,
    }));

    await Promise.all([
      getBalance(ownerAddress, safeAddress),
      getSafeBalance(ownerAddress, safeAddress),
    ]);
  };

  useEffect(() => {
    const fetchAddresses = async () => {
      try {
        const result = await getAllAddresses();
        const formattedAddresses = result.data.map((address) => ({
          ownerAddress: address.ownerAddress,
          safeAddress: address.contractAddress,
        }));

        setAddresses(formattedAddresses);

        // Initialize loading and balance states
        const initialStates = {};
        formattedAddresses.forEach((address) => {
          initialStates[address.safeAddress] = {
            cusdcLoading: false,
            safeLoading: false,
          };
        });
        setLoadingStates(initialStates);

        setFetchError(null);
      } catch (err) {
        setFetchError(err.message);
      }
    };

    fetchAddresses();
  }, []);

  if (loading) {
    return (
      <div className="w-full p-4 grid place-items-center h-full">
        <div className="max-w-3xl py-2">
          <div className="bg-white rounded-lg p-8 text-center">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        </div>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="w-full p-4 grid place-items-center">
        <div className="max-w-3xl py-2">
          <div className="bg-white rounded-lg border p-8 text-center text-red-600">
            Error loading addresses: {fetchError}
          </div>
        </div>
      </div>
    );
  }

  const mintUSDC = async () => {
    setLoadingMint(true);
    try {
      const erc20Contract = new Contract(
        ERC20CONTRACTADDRESS,
        ERC20CONTRACTABI,
        signer
      );

      const response = await erc20Contract.mintAndApprove(
        ENCRYPTEDERC20CONTRACTADDRESS,
        9007199254740991,
        ENCRYPTEDERC20CONTRACTADDRESS,
        {
          gasLimit: 1000000,
        }
      );
      const tx = await response.getTransaction();
      console.log(tx);
      await tx.wait();
      toast.success("USDC minted successfully");
    } catch (error) {
      console.error("Error minting USDC:", error);
      toast.error("Failed to mint USDC");
    } finally {
      setLoadingMint(false);
    }
  };

  return (
    <div className="w-full p-4 grid place-items-center h-full">
      <div className="max-w-5xl w-full space-y-2">
        <Button variant="ghost" onClick={mintUSDC}>
          {loadingMint ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            "Mint Encrypted Tokens"
          )}
        </Button>
        <div className="bg-white rounded-lg border">
          {addresses.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No addresses found
            </div>
          ) : (
            <>
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-600">
                      Owner
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-600">
                      cUSDC Balance
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-600">
                      Safe Contract Address
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-600">
                      Safe Balance
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-600">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {addresses.map((address) => {
                    const isLoading =
                      loadingStates[address.safeAddress]?.cusdcLoading ||
                      loadingStates[address.safeAddress]?.safeLoading;
                    const isDecrypted = decryptedAddresses[address.safeAddress];

                    return (
                      <tr
                        key={address.ownerAddress}
                        className="border-b hover:bg-gray-50 text-sm font-medium"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <span
                              className="text-blue-500"
                              title={address.ownerAddress}
                            >
                              {truncateAddress(address.ownerAddress)}
                            </span>
                            <CopyButton text={address.ownerAddress} />
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {isLoading &&
                          loadingStates[address.safeAddress]?.cusdcLoading ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                          ) : isDecrypted ? (
                            <span className="text-gray-900">
                              {formatCurrency(
                                balances[address.safeAddress]?.cusdc
                              )}
                            </span>
                          ) : (
                            <Lock className="w-5 h-5 text-gray-500" />
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <span
                              className="text-gray-900"
                              title={address.safeAddress}
                            >
                              {truncateAddress(address.safeAddress)}
                            </span>
                            <CopyButton text={address.safeAddress} />
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {isLoading &&
                          loadingStates[address.safeAddress]?.safeLoading ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                          ) : isDecrypted ? (
                            <span className="text-gray-900">
                              {formatCurrency(
                                balances[address.safeAddress]?.safe
                              )}
                            </span>
                          ) : (
                            <Lock className="w-5 h-5 text-gray-500" />
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <Button
                            onClick={() =>
                              handleDecrypt(
                                address.ownerAddress,
                                address.safeAddress
                              )
                            }
                            className="flex items-center gap-2"
                            disabled={isLoading}
                          >
                            {isLoading ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Loading
                              </>
                            ) : isDecrypted ? (
                              <>
                                <RefreshCw className="w-4 h-4" />
                                Refresh
                              </>
                            ) : (
                              <>
                                <Lock className="w-4 h-4" />
                                Decrypt
                              </>
                            )}
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <div className="px-6 py-4 border-t flex justify-end gap-2">
                <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
                  Previous
                </button>
                <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
                  Next
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AddressTable;
