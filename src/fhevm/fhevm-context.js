import { createContext, useContext, useEffect, useState } from "react";
import { getFhevmInstance } from "./fhe-functions";
import { useWallets } from "@privy-io/react-auth";

const FhevmContext = createContext();

export const FhevmProvider = ({ children }) => {
  const [instance, setInstance] = useState(null);
  const [loading, setLoading] = useState(true);
  const { wallets } = useWallets();
  const w0 = wallets[0];
  useEffect(() => {
    const fetchInstance = async () => {
      try {
        const fhevmInstance = await getFhevmInstance();
        setInstance(fhevmInstance);
        console.log("Instance created!!");
      } catch (error) {
        console.error("Failed to load FHEVM instance:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchInstance();
  }, [w0]);

  return (
    <FhevmContext.Provider value={{ instance, loading }}>
      {children}
    </FhevmContext.Provider>
  );
};

export const useFhevm = () => useContext(FhevmContext);
