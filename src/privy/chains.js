export const chainsName = { inco: "Inco" };

export const incoNetwork = {
  id: 9000,
  network: "Evmos",
  name: "Evmos Testnet",
  nativeCurrency: {
    name: "tEVMOS",
    symbol: "tEVMOS",
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ["https://validator.rivest.inco.org"],
    },
    public: {
      http: ["https://validator.rivest.inco.org"],
    },
  },
  blockExplorers: {
    default: {
      name: "Explorer",
      url: "https://explorer.rivest.inco.org",
    },
  },
};
