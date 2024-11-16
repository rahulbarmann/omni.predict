import Web3 from "web3";

import votingAbiJson from "@/lib/abi/chainlinkFn/btc-usd.json";
import { AbiItem } from "web3-utils";
import { ConnectedWallet } from "@privy-io/react-auth";
import { TransactionReceipt } from "web3-core";

const btcUsdAbi = votingAbiJson as AbiItem[];

const NETWORK_CONFIG = {
    contractAddress: "0xf61206Df269C45683755CC80289F6F32D09A30bF",
    rpc: "https://base-sepolia.g.alchemy.com/v2/bXuP9aZR7kgRSFr1a78fIEXXrAQxS697",
};

const waitForTransaction = async (
    web3: Web3,
    txHash: string,
    maxAttempts = 30
): Promise<TransactionReceipt | null> => {
    let attempts = 0;
    while (attempts < maxAttempts) {
        const receipt = await web3.eth.getTransactionReceipt(txHash);
        if (receipt) {
            if (receipt.status) {
                return receipt;
            } else {
                throw new Error("Transaction failed");
            }
        }
        await new Promise((r) => setTimeout(r, 2000));
        attempts++;
    }
    throw new Error("Transaction confirmation timeout");
};

export async function fetchBtcUsd(userWallet: ConnectedWallet) {
    try {
        const web3 = new Web3(NETWORK_CONFIG.rpc);
        const provider = await userWallet.getEthersProvider();

        const btcUsdContract = new web3.eth.Contract(
            btcUsdAbi,
            NETWORK_CONFIG.contractAddress
        );

        // Then encode the data and send the transaction
        const createProposalData = btcUsdContract.methods
            .sendRequest(234)
            .encodeABI();

        const createProposalEstimate = await web3.eth.estimateGas({
            from: "0x687cD57BC79f1F77d76668ea1c5c531664C97CB9",
            to: NETWORK_CONFIG.contractAddress,
            data: createProposalData,
        });

        const createProposalTx = await provider.send("eth_sendTransaction", [
            {
                from: userWallet.address,
                to: NETWORK_CONFIG.contractAddress,
                data: createProposalData,
                gas: web3.utils.toHex(Math.floor(createProposalEstimate * 1.2)),
            },
        ]);

        console.log("Waiting for Send Req transaction...", createProposalTx);
        const createProposalTxReceipt = await waitForTransaction(
            web3,
            createProposalTx
        );
        if (!createProposalTxReceipt) {
            throw new Error("Send Req transaction failed");
        }

        console.log(
            "Send Req transaction successful:",
            createProposalTxReceipt.transactionHash,
            createProposalTxReceipt
        );

        btcUsdContract.methods;
        const result = await btcUsdContract.methods.s_bitcoinPrice().call();
        console.log("Price fetched: ", result);
        return result;
    } catch (e) {
        console.error("Detailed error:", e);
        throw e;
    }
}
