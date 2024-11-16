/* eslint-disable @typescript-eslint/no-explicit-any */
import votingAbiJson from "@/lib/abi/fhe/voting.json";
import Web3 from "web3";
import { AbiItem } from "web3-utils";
import { JsonRpcProvider } from "ethers";
const votingAbi = votingAbiJson as AbiItem[];
import { TransactionReceipt } from "web3-core";

import { ethers, hexlify } from "ethers";
// import { JsonRpcProvider } from "@ethersproject/providers";
import voteAbi from "@/lib/abi/fhe/voting.json"; // Directly import ABI JSON
import { ConnectedWallet } from "@privy-io/react-auth";
import { FhenixClient, EncryptedUint8, EncryptionTypes } from "fhenixjs";

const NETWORK_CONFIG = {
    contractAddress: "0x1379C568D2566b060c403c4f089E1802bD854493",
    rpc: "https://api.nitrogen.fhenix.zone",
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

export async function fetchMarkets() {
    try {
        const web3 = new Web3(NETWORK_CONFIG.rpc);

        const votingContract = new web3.eth.Contract(
            votingAbi,
            NETWORK_CONFIG.contractAddress
        );

        votingContract.methods;
        const result = await votingContract.methods.getAllProposals().call();
        return result;
    } catch (e) {
        console.error("Detailed error:", e);
        throw e;
    }
}

export async function createMarket(userWallet: ConnectedWallet) {
    try {
        const web3 = new Web3(NETWORK_CONFIG.rpc);
        const provider = await userWallet.getEthersProvider();

        const votingContract = new web3.eth.Contract(
            votingAbi,
            NETWORK_CONFIG.contractAddress
        );

        // Call the method first to get the proposal ID without creating a transaction
        const proposalId = await votingContract.methods
            .createProposal("will astralis win major?", ["Yes", "No"], 60)
            .call({ from: userWallet.address });

        console.log("Proposal ID:", proposalId);

        // Then encode the data and send the transaction
        const createProposalData = votingContract.methods
            .createProposal("will astralis win major?", ["Yes", "No"], 60)
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

        console.log(
            "Waiting for Create Proposal transaction...",
            createProposalTx
        );
        const createProposalTxReceipt = await waitForTransaction(
            web3,
            createProposalTx
        );
        if (!createProposalTxReceipt) {
            throw new Error("Create Proposal transaction failed");
        }

        console.log(
            "Create Proposal successful:",
            createProposalTxReceipt.transactionHash,
            createProposalTxReceipt
        );

        // Return or use the proposal ID obtained earlier
        return proposalId;
    } catch (e) {
        console.log("Error: ", e);
    }
}

export async function voteYes(
    userWallet: ConnectedWallet,
    proposalId: any,
    numberOfShares: number
) {
    try {
        const provider2: any = new JsonRpcProvider(
            "https://api.nitrogen.fhenix.zone"
        );

        // const chainId = await provider2.getNetwork();
        // console.log("Connected to network:", chainId);
        // const provider = await userWallet.getEthersProvider();

        // const client = new FhenixClient({ provider: provider2 });
        // console.log("Before input encytption");
        // const voteBytes = await client.encrypt_uint8(1);
        // let voteBytes: EncryptedUint8 = await client.encrypt(
        //     1,
        //     EncryptionTypes.uint8
        // );
        // console.log("After input encryption");

        const votingContract = new ethers.Contract(
            NETWORK_CONFIG.contractAddress,
            voteAbi,
            provider2
        );
        console.log("Before data encoding");
        const voteData = votingContract.interface.encodeFunctionData(
            "buyYesShares",
            [Number(proposalId), numberOfShares]
        );
        console.log("After data encoding");

        const voteEstimate = await provider2.estimateGas({
            from: "0x687cD57BC79f1F77d76668ea1c5c531664C97CB9",
            to: NETWORK_CONFIG.contractAddress,
            data: voteData,
        });

        console.log("Before sending");
        const createProposalTx = await provider2.send("eth_sendTransaction", [
            {
                from: userWallet.address,
                to: NETWORK_CONFIG.contractAddress,
                data: voteData,
                gas: hexlify(voteEstimate.mul(120).div(100).toString()), // Adjusted gas calculation
            },
        ]);
        console.log("After sending");

        console.log("Waiting for Voting transaction...");

        const voteTxReceipt = await provider2.waitForTransaction(
            createProposalTx
        );
        if (!voteTxReceipt) {
            throw new Error("Voting failed");
        }

        console.log("Voting was successful:", voteTxReceipt.transactionHash);
    } catch (e) {
        console.log("Error:", e);
    }
}

export async function voteMarket(userWallet: ConnectedWallet) {
    try {
        const provider2: any = new JsonRpcProvider(
            "https://api.helium.fhenix.zone"
        );

        const chainId = await provider2.getNetwork();
        console.log("Connected to network:", chainId);
        const provider = await userWallet.getEthersProvider();

        const client = new FhenixClient({ provider: provider2 });
        console.log("Before input encytption");
        // const voteBytes = await client.encrypt_uint8(1);
        let voteBytes: EncryptedUint8 = await client.encrypt(
            1,
            EncryptionTypes.uint8
        );
        console.log("After input encryption");

        const votingContract = new ethers.Contract(
            NETWORK_CONFIG.contractAddress,
            voteAbi,
            provider2
        );
        console.log("Before data encoding");
        const voteData = votingContract.interface.encodeFunctionData("vote", [
            3,
            voteBytes,
        ]);
        console.log("After data encoding");

        const voteEstimate = await provider2.estimateGas({
            from: "0x687cD57BC79f1F77d76668ea1c5c531664C97CB9",
            to: NETWORK_CONFIG.contractAddress,
            data: voteData,
        });

        console.log("Before sending");
        const createProposalTx = await provider2.send("eth_sendTransaction", [
            {
                from: userWallet.address,
                to: NETWORK_CONFIG.contractAddress,
                data: voteData,
                gas: hexlify(voteEstimate.mul(120).div(100).toString()), // Adjusted gas calculation
            },
        ]);
        console.log("After sending");

        console.log("Waiting for Voting transaction...");

        const voteTxReceipt = await provider2.waitForTransaction(
            createProposalTx
        );
        if (!voteTxReceipt) {
            throw new Error("Voting failed");
        }

        console.log("Voting was successful:", voteTxReceipt.transactionHash);
    } catch (e) {
        console.log("Error:", e);
    }
}

export async function voteeYes(proposalId: any, amount: any) {
    try {
        if (!process.env.BASE_PRIVATE_KEY) {
            throw new Error("BASE_PRIVATE_KEY not found in env");
        }
        const baseWeb3 = new Web3("https://api.nitrogen.fhenix.zone");

        const baseSigner = baseWeb3.eth.accounts.privateKeyToAccount(
            process.env.BASE_PRIVATE_KEY
        );
        baseWeb3.eth.accounts.wallet.add(baseSigner);

        const voteYesContractAddress = baseWeb3.utils.toChecksumAddress(
            NETWORK_CONFIG.contractAddress
        );

        const voteYesContract = new baseWeb3.eth.Contract(
            votingAbi,
            voteYesContractAddress,
            { from: baseSigner.address }
        );

        // Validate message bytes
        // if (
        //     typeof messageBytes !== "string" ||
        //     !messageBytes.startsWith("0x")
        // ) {
        //     throw new Error("Invalid message bytes format");
        // }

        const buyYesTxGas = await voteYesContract.methods
            .buyYesShares(proposalId, amount)
            .estimateGas();

        const buyYesTx = await voteYesContract.methods
            .buyYesShares(proposalId, amount)
            .send({ gas: Math.floor(buyYesTxGas * 1.2) });

        console.log("Waiting for Buy transaction in Fhenix...");
        const receiveTxReceipt = await waitForTransaction(
            baseWeb3,
            buyYesTx.transactionHash
        );
        if (!receiveTxReceipt) {
            throw new Error("Buy transaction in Fhenix failed");
        }
        console.log(
            "Buy transaction in Fhenix successful:",
            receiveTxReceipt.transactionHash
        );
    } catch (e) {
        console.log("Error: ", e);
    }
}
