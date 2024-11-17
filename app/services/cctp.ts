import Web3 from "web3";
import { TransactionReceipt } from "web3-core";
import { AbiItem } from "web3-utils";

import tokenMessengerAbiJson from "@/lib/abi/cctp/TokenMessenger.json";
import messageAbiJson from "@/lib/abi/cctp/Message.json";
import usdcAbiJson from "@/lib/abi/Usdc.json";
import messageTransmitterAbiJson from "@/lib/abi/cctp/MessageTransmitter.json";
import { ConnectedWallet } from "@privy-io/react-auth";

const tokenMessengerAbi = tokenMessengerAbiJson as AbiItem[];
const messageAbi = messageAbiJson as AbiItem[];
const usdcAbi = usdcAbiJson as AbiItem[];
const messageTransmitterAbi = messageTransmitterAbiJson as AbiItem[];

interface AttestationResponse {
    status: string;
    attestation?: string;
}

if (!process.env.ETH_TESTNET_RPC || !process.env.BASE_TESTNET_RPC) {
    throw new Error("RPCs not found in env");
}

const NETWORK_CONFIG = {
    sepolia: {
        rpc: process.env.ETH_TESTNET_RPC,
        tokenMessenger: "0x9f3B8679c73C2Fef8b59B4f3444d4e156fb70AA5", // matched
        usdc: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238", // matched
        message: "0x80537e4e8bab73d21096baa3a8c813b45ca0b7c9",
        domainId: 0,
    },
    "avalanche-testnet": {
        rpc: "https://api.avax-test.network/ext/bc/C/rpc",
        tokenMessenger: "0xeb08f243e5d3fcff26a9e38ae5520a669f4019d0", // matched
        usdc: "0x5425890298aed601595a70ab815c96711a31bc65", // matched
        message: "0xa9fb1b3009dcb79e2fe346c16a604b8fa8ae0a79", // matched -- message x
        domainId: 1,
    },
    "base-sepolia": {
        rpc: process.env.BASE_TESTNET_RPC,
        messageTransmitter: "0x7865fAfC2db2093669d92c0F33AeEF291086BEFD", // matched
        domainId: 6,
    },
    "optimism-sepolia": {
        rpc: "https://opt-sepolia.g.alchemy.com/v2/bXuP9aZR7kgRSFr1a78fIEXXrAQxS697",
        tokenMessenger: "0x9f3B8679c73C2Fef8b59B4f3444d4e156fb70AA5",
        usdc: "0x5fd84259d66Cd46123540766Be93DFE6D43130D7",
        message: "0x7865fAfC2db2093669d92c0F33AeEF291086BEFD",
        domainId: 2,
    },
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

const waitForAttestation = async (
    messageHash: string,
    maxAttempts = 60
): Promise<string> => {
    let attempts = 0;
    while (attempts < maxAttempts) {
        try {
            const response = await fetch(
                `https://iris-api-sandbox.circle.com/attestations/${messageHash}`
            );
            const attestationResponse: AttestationResponse =
                await response.json();

            if (
                attestationResponse.status === "complete" &&
                attestationResponse.attestation
            ) {
                return attestationResponse.attestation;
            }

            if (attestationResponse.status === "failed") {
                throw new Error("Attestation failed");
            }

            await new Promise((r) => setTimeout(r, 2000));
            attempts++;
        } catch (error) {
            console.error("Error fetching attestation:", error);
            await new Promise((r) => setTimeout(r, 2000));
            attempts++;
        }
    }
    throw new Error("Attestation timeout after maximum attempts");
};

interface InitTxnProps {
    sourceChain: "sepolia" | "avalanche-testnet" | "optimism-sepolia";
    amount: string;
    recipientAddress: string;
    userWallet: ConnectedWallet;
}

export const useCCTPTransfer = () => {
    // const { wallets } = useWallets();

    const initTxn = async ({
        sourceChain,
        amount,
        recipientAddress,
        userWallet,
    }: InitTxnProps): Promise<void> => {
        try {
            if (!process.env.BASE_PRIVATE_KEY) {
                throw new Error("BASE_PRIVATE_KEY not found in env");
            }

            const sourceConfig = NETWORK_CONFIG[sourceChain];
            const baseConfig = NETWORK_CONFIG["base-sepolia"];

            const web3 = new Web3(sourceConfig.rpc);

            // Initialize contracts
            const tokenMessengerContract = new web3.eth.Contract(
                tokenMessengerAbi,
                sourceConfig.tokenMessenger
            );

            const usdcContract = new web3.eth.Contract(
                usdcAbi,
                sourceConfig.usdc
            );

            const messageContract = new web3.eth.Contract(
                messageAbi,
                sourceConfig.message
            );

            const provider = await userWallet.getEthersProvider();

            // Convert recipient address to bytes32
            const destinationAddressInBytes32 = await messageContract.methods
                .addressToBytes32(recipientAddress)
                .call();

            console.log("Starting approval process...");

            // STEP 1: Approve messenger contract
            const approveData = usdcContract.methods
                .approve(sourceConfig.tokenMessenger, amount)
                .encodeABI();
            const approveGasEstimate = await web3.eth.estimateGas({
                from: userWallet.address,
                to: sourceConfig.usdc,
                data: approveData,
            });

            const approveTx = await provider.send("eth_sendTransaction", [
                {
                    from: userWallet.address,
                    to: sourceConfig.usdc,
                    data: approveData,
                    gas: web3.utils.toHex(Math.floor(approveGasEstimate * 1.2)),
                },
            ]);

            console.log("Waiting for approval transaction...");
            const approveTxReceipt = await waitForTransaction(web3, approveTx);
            if (!approveTxReceipt) {
                throw new Error("Approval transaction failed");
            }
            console.log(
                "Approval successful:",
                approveTxReceipt.transactionHash
            );

            // STEP 2: Burn USDC
            console.log("Starting burn process...");
            const burnData = tokenMessengerContract.methods
                .depositForBurn(
                    amount,
                    baseConfig.domainId,
                    destinationAddressInBytes32,
                    sourceConfig.usdc
                )
                .encodeABI();

            const burnGasEstimate = await web3.eth.estimateGas({
                from: userWallet.address,
                to: sourceConfig.tokenMessenger,
                data: burnData,
            });

            const burnTx = await provider.send("eth_sendTransaction", [
                {
                    from: userWallet.address,
                    to: sourceConfig.tokenMessenger,
                    data: burnData,
                    gas: web3.utils.toHex(Math.floor(burnGasEstimate * 1.2)),
                },
            ]);

            console.log("Waiting for burn transaction...");
            const burnTxReceipt = await waitForTransaction(web3, burnTx);
            if (!burnTxReceipt) {
                throw new Error("Burn transaction failed");
            }
            console.log("Burn successful:", burnTxReceipt.transactionHash);

            // STEP 3: Get message bytes from logs
            const eventTopic = web3.utils.keccak256("MessageSent(bytes)");
            const log = burnTxReceipt.logs.find(
                (l) => l.topics[0] === eventTopic
            );
            if (!log) {
                throw new Error("MessageSent event log not found");
            }

            const messageBytes = web3.eth.abi.decodeParameters(
                ["bytes"],
                log.data
            )[0];
            const messageHash = web3.utils.keccak256(messageBytes);

            console.log("Message hash generated:", messageHash);

            // STEP 4: Get attestation
            console.log("Fetching attestation...");
            const attestationSignature = await waitForAttestation(messageHash);
            console.log(
                "Attestation received:",
                attestationSignature.slice(0, 10) + "..."
            );

            // Validate attestation format
            if (!attestationSignature.startsWith("0x")) {
                throw new Error("Invalid attestation format");
            }

            // STEP 5: Process on Base Sepolia
            console.log("Processing on Base Sepolia...");
            const baseWeb3 = new Web3(baseConfig.rpc);

            const baseSigner = baseWeb3.eth.accounts.privateKeyToAccount(
                process.env.BASE_PRIVATE_KEY
            );
            baseWeb3.eth.accounts.wallet.add(baseSigner);

            const messageTransmitterAddress = baseWeb3.utils.toChecksumAddress(
                baseConfig.messageTransmitter
            );

            const messageTransmitterContract = new baseWeb3.eth.Contract(
                messageTransmitterAbi,
                messageTransmitterAddress,
                { from: baseSigner.address }
            );

            // Validate message bytes
            if (
                typeof messageBytes !== "string" ||
                !messageBytes.startsWith("0x")
            ) {
                throw new Error("Invalid message bytes format");
            }

            const receiveTxGas = await messageTransmitterContract.methods
                .receiveMessage(messageBytes, attestationSignature)
                .estimateGas();

            const receiveTx = await messageTransmitterContract.methods
                .receiveMessage(messageBytes, attestationSignature)
                .send({ gas: Math.floor(receiveTxGas * 1.2) });

            console.log("Waiting for receive transaction...");
            const receiveTxReceipt = await waitForTransaction(
                baseWeb3,
                receiveTx.transactionHash
            );
            if (!receiveTxReceipt) {
                throw new Error("Receive transaction failed");
            }
            console.log(
                "Receive successful:",
                receiveTxReceipt.transactionHash
            );
        } catch (error) {
            console.error("Detailed error:", error);
            throw error;
        }
    };

    return { initTxn };
};
