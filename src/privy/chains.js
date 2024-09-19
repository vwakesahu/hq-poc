import { toast } from "sonner";

export const chainsName = { inco: "Inco" };

export const incoNetwork = {
  id: 9090,
  network: "Inco Gentry Testnet",
  name: "INCO",
  nativeCurrency: {
    name: "INCO",
    symbol: "INCO",
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ["https://testnet.inco.org/"],
    },
    public: {
      http: ["https://testnet.inco.org/"],
    },
  },
  blockExplorers: {
    default: {
      name: "Explorer",
      url: "https://explorer.testnet.inco.org",
    },
  },
};
