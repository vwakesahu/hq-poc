import { ethers } from "ethers";

export const buildSafeTransaction = (template) => {
  return {
    to: template.to,
    value: template.value || 0,
    data: template.data || "0x",
    operation: template.operation || 0,
    safeTxGas: template.safeTxGas || 0,
    baseGas: template.baseGas || 0,
    gasPrice: template.gasPrice || 0,
    gasToken: template.gasToken || AddressZero,
    refundReceiver: template.refundReceiver || AddressZero,
    nonce: template.nonce,
  };
};

export const buildSignatureBytes = (signatures) => {
  const SIGNATURE_LENGTH_BYTES = 65;
  signatures.sort((left, right) =>
    left.signer.toLowerCase().localeCompare(right.signer.toLowerCase())
  );

  let signatureBytes = "0x";
  let dynamicBytes = "";

  for (const sig of signatures) {
    if (sig.dynamic) {
      /* 
          A contract signature has a static part of 65 bytes and the dynamic part that needs to be appended 
          at the end of signature bytes.
          The signature format is
          Signature type == 0
          Constant part: 65 bytes
          {32-bytes signature verifier}{32-bytes dynamic data position}{1-byte signature type}
          Dynamic part (solidity bytes): 32 bytes + signature data length
          {32-bytes signature length}{bytes signature data}
        */
      const dynamicPartPosition = (
        signatures.length * SIGNATURE_LENGTH_BYTES +
        dynamicBytes.length / 2
      )
        .toString(16)
        .padStart(64, "0");
      const dynamicPartLength = (sig.data.slice(2).length / 2)
        .toString(16)
        .padStart(64, "0");
      const staticSignature = `${sig.signer
        .slice(2)
        .padStart(64, "0")}${dynamicPartPosition}00`;
      const dynamicPartWithLength = `${dynamicPartLength}${sig.data.slice(2)}`;

      signatureBytes += staticSignature;
      dynamicBytes += dynamicPartWithLength;
    } else {
      signatureBytes += sig.data.slice(2);
    }
  }

  return signatureBytes + dynamicBytes;
};

export const safeApproveHash = async (
  signer,
  safe,
  safeTx,
  skipOnChainApproval = false
) => {
  if (!skipOnChainApproval) {
    if (!signer.provider) {
      throw Error("Provider required for on-chain approval");
    }

    const network = await signer.provider.getNetwork();
    const chainId = await network.chainId;
    const safeAddress = await safe.getAddress();
    const typedDataHash = calculateSafeTransactionHash(
      safeAddress,
      safeTx,
      chainId
    );
    const signerSafe = safe.connect(signer);
    await signerSafe.approveHash(typedDataHash);
  }

  const signerAddress = await signer.getAddress();

  return {
    signer: signerAddress,
    data:
      "0x000000000000000000000000" +
      signerAddress.slice(2) +
      "0000000000000000000000000000000000000000000000000000000000000000" +
      "01",
  };
};

export const calculateSafeTransactionHash = (safeAddress, safeTx, chainId) => {
  return ethers.TypedDataEncoder.hash(
    { verifyingContract: safeAddress, chainId },
    EIP712_SAFE_TX_TYPE,
    safeTx
  );
};
