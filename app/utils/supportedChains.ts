interface ChainListParams {
    displayName: string;
    name: string;
    chainId: number;
    token: string;
}

export const chainList: ChainListParams[] = [
    {
        displayName: "ETH Sepolia Testnet",
        name: "sepolia",
        chainId: 11155111,
        token: "ETH",
    },
    {
        displayName: "Base Sepolia Testnet",
        name: "base-sepolia",
        chainId: 84532,
        token: "ETH",
    },
    {
        displayName: "Avalanche Fuji Testnet",
        name: "avalanche-testnet",
        chainId: 43113,
        token: "AVAX",
    },
    {
        displayName: "Arbitrum Sepolia Testnet",
        name: "arbitrum-testnet",
        chainId: 421614,
        token: "AVAX",
    },
    {
        displayName: "Optimism Sepolia Testnet",
        name: "optimism-sepolia",
        chainId: 11155420,
        token: "ETH",
    },
];
