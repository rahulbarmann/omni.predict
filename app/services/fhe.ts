/* eslint-disable @typescript-eslint/no-explicit-any */
import Web3 from "web3";
import { AbiItem } from "web3-utils";
import votingAbiJson from "@/lib/abi/fhe/voting.json";
const votingAbi = votingAbiJson as AbiItem[];

const NETWORK_CONFIG = {
    contractAddress: "0xe7fca855ecf8801e57418574899b6471ac18ea92",
    rpc: "https://api.helium.fhenix.zone",
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
