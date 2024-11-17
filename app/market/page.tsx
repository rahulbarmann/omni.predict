"use client";

import React, { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, X, ExternalLink } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { fetchMarkets, voteeYes, voteeNo } from "../services/fhe";
import { chainList } from "../utils/supportedChains";
import { ConnectedWallet, usePrivy, useWallets } from "@privy-io/react-auth";
import { useCCTPTransfer } from "../services/cctp";
import { fetchBtcUsd } from "../services/chainlinkFn";
import { Particles } from "../Particles";
import { useRouter } from "next/navigation";

gsap.registerPlugin(ScrollTrigger);

const GridItem = ({
    children,
    className = "",
    delay = 0,
}: {
    children: React.ReactNode;
    className?: string;
    delay?: number;
}) => (
    <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay }}
        className={`p-4 border border-white rounded-lg hover:bg-white hover:text-black transition-all duration-300 ${className}`}
    >
        {children}
    </motion.div>
);

const MarketCard = ({
    title,
    description,
    votes,
    chain,
    yesPercentage,
    noPercentage,
    sourceUrl,
    onVote,
}: {
    title: string;
    description: string;
    votes: number;
    chain: string;
    yesPercentage: number;
    noPercentage: number;
    sourceUrl: string;
    onVote: (vote: string) => void;
}) => {
    const [userVote, setUserVote] = useState<string | null>(null);
    const [isSourceOpen, setIsSourceOpen] = useState(false);

    const handleVote = (vote: string) => {
        setUserVote(vote);
        onVote(vote);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-white text-black p-6 rounded-lg shadow-lg"
        >
            <h3 className="text-2xl font-bold mb-2">{title}</h3>
            <p className="text-gray-600 mb-4">{description}</p>
            <div className="flex justify-between items-center mb-4">
                <span className="text-sm font-semibold">Votes: {votes}</span>
                <span className="text-sm font-semibold bg-gray-200 px-2 py-1 rounded">
                    {chain}
                </span>
            </div>
            <div className="flex justify-between mb-2">
                <div className="w-1/2 bg-green-200 rounded-l-full h-4">
                    <div
                        className="bg-green-500 h-full rounded-l-full"
                        style={{ width: `${yesPercentage}%` }}
                    ></div>
                </div>
                <div className="w-1/2 bg-red-200 rounded-r-full h-4">
                    <div
                        className="bg-red-500 h-full rounded-r-full float-right"
                        style={{ width: `${noPercentage}%` }}
                    ></div>
                </div>
            </div>
            <div className="flex justify-between text-sm mb-4">
                <span>Yes: {yesPercentage}%</span>
                <span>No: {noPercentage}%</span>
            </div>
            <div className="flex justify-between">
                <button
                    onClick={() => handleVote("yes")}
                    className={`px-4 py-2 rounded ${
                        userVote === "yes"
                            ? "bg-green-500 text-white"
                            : "bg-gray-200 text-black"
                    } transition-colors`}
                >
                    Vote Yes
                </button>
                <button
                    onClick={() => handleVote("no")}
                    className={`px-4 py-2 rounded ${
                        userVote === "no"
                            ? "bg-red-500 text-white"
                            : "bg-gray-200 text-black"
                    } transition-colors`}
                >
                    Vote No
                </button>
            </div>
            <div className="mt-4">
                <Button variant="outline" onClick={() => setIsSourceOpen(true)}>
                    View Source
                </Button>
            </div>
            <Dialog open={isSourceOpen} onOpenChange={setIsSourceOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Source Information</DialogTitle>
                        <DialogDescription>
                            View the source of this market's decision
                        </DialogDescription>
                    </DialogHeader>
                    <div className="mt-4">
                        <a
                            href={sourceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center text-blue-500 hover:text-blue-700 transition-colors"
                        >
                            <ExternalLink className="mr-2" size={16} />
                            View Source
                        </a>
                    </div>
                </DialogContent>
            </Dialog>
        </motion.div>
    );
};

function parseProposalsToMarkets(rawData: any, chain: any, sourceUrls: any) {
    if (
        !rawData ||
        !rawData.descriptions ||
        !Array.isArray(rawData.descriptions)
    ) {
        console.error(
            "Invalid rawData: descriptions property is missing or not an array"
        );
        return [];
    }

    return rawData.descriptions.map((description: any, index: any) => {
        const yesPriceRaw = rawData.currentYesPrices?.[index];
        const noPriceRaw = rawData.currentNoPrices?.[index];
        const yesPrice = yesPriceRaw ? parseInt(yesPriceRaw, 10) / 1e18 : 0;
        const noPrice = noPriceRaw ? parseInt(noPriceRaw, 10) / 1e18 : 0;

        const totalVotes = yesPrice + noPrice || 0;
        const yesPercentage =
            totalVotes > 0 ? Math.round((yesPrice / totalVotes) * 100) : 0;
        const noPercentage = totalVotes > 0 ? 100 - yesPercentage : 0;

        return {
            id: index + 1,
            title: description || "No Title",
            votes: totalVotes,
            chain: chain || "Unknown Chain",
            yesPercentage,
            noPercentage,
            sourceUrl: sourceUrls?.[index] || "No Source URL",
        };
    });
}

export default function EnhancedMarketsPage() {
    const containerRef = useRef<HTMLDivElement>(null);
    const [selectedChain, setSelectedChain] = useState("All");
    const [isChainMenuOpen, setIsChainMenuOpen] = useState(false);
    const [connectedWallet, setConnectedWallet] = useState<ConnectedWallet>();

    const { ready, authenticated, login, logout, user } = usePrivy();
    const { wallets } = useWallets();
    const [market, setMarket] = useState([]);
    const router = useRouter();

    const { initTxn } = useCCTPTransfer();

    if (ready && !authenticated) {
        router.push("/");
    }

    useEffect(() => {
        handleFetchMarkets();
    }, []);

    useEffect(() => {
        const ctx = gsap.context(() => {
            gsap.utils.toArray(".fade-in").forEach((element: any) => {
                gsap.fromTo(
                    element,
                    { opacity: 0, y: 50 },
                    {
                        opacity: 1,
                        y: 0,
                        duration: 1,
                        scrollTrigger: {
                            trigger: element,
                            start: "top bottom-=100",
                            end: "top center",
                            scrub: true,
                        },
                    }
                );
            });
        }, containerRef);

        return () => ctx.revert();
    }, []);

    useEffect(() => {
        document.documentElement.style.scrollBehavior = "smooth";
        return () => {
            document.documentElement.style.scrollBehavior = "auto";
        };
    }, []);

    function mapConnectedToSourceChain() {
        if (!connectedWallet) {
            throw new Error("No wallet connected");
        }
        const chain = chainList.find(
            (e) => e.chainId === Number(connectedWallet.chainId.split(":")[1])
        )!;
        if (chain.name === "sepolia") {
            return "sepolia";
        } else if (chain.name === "avalanche-testnet") {
            return "avalanche-testnet";
        } else {
            return "optimism-sepolia";
        }
    }

    function CurrentChain() {
        const { ready, wallets } = useWallets();

        const isDisabled = !ready || (ready && !authenticated);

        if (isDisabled) {
            return null;
        }
        const authenticatedAddress = user?.wallet?.address;

        const connectedWallet = wallets.filter(
            (e) => e.address === authenticatedAddress
        );
        setConnectedWallet(connectedWallet[0]);
        const chainId = connectedWallet[0]?.chainId.split(":")[1];
        const chain = chainList.filter(
            (e: any) => e.chainId === Number(chainId)
        );
        const chainName = chainList.find(
            (e: any) =>
                e.chainId === Number(connectedWallet[0]?.chainId.split(":")[1])
        )?.name;
        return (
            <div className="mb-4 p-4 bg-gray-800 rounded-lg">
                <p className="text-sm mb-2">
                    Connected Chain: {JSON.stringify(chain[0])}
                </p>
                <label
                    htmlFor="chain-select"
                    className="block text-sm font-medium mb-1"
                >
                    Switch Your Chain:
                </label>
                <select
                    id="chain-select"
                    className="text-black bg-white rounded p-2 w-full"
                    defaultValue={chainName}
                    onChange={async (v) => {
                        await connectedWallet[0].switchChain(
                            Number(
                                chainList.find(
                                    (e: any) => e.name === v.target.value
                                )?.chainId
                            )
                        );
                    }}
                >
                    <option value="sepolia">Sepolia ETH</option>
                    <option value="base-sepolia">Base Sepolia</option>
                    <option value="avalanche-testnet">Avalanche Fuji</option>
                    <option value="optimism-sepolia">Optimism Sepolia</option>
                </select>
            </div>
        );
    }

    const handleTransfer = async (totalCost: string) => {
        try {
            if (!connectedWallet) {
                throw new Error("No wallet connected");
            }
            await initTxn({
                sourceChain: mapConnectedToSourceChain(),
                amount: totalCost,
                recipientAddress: "0x724B54D5E2118F4e5e3f4852f62b85cF4B69AE7F",
                userWallet: connectedWallet,
            });
            console.log("Transfer completed successfully");
        } catch (error) {
            console.error("Transfer failed:", error);
        }
    };

    async function handleFetchMarkets() {
        try {
            const res = await fetchMarkets();
            setMarket(res);
            console.log("Markets Fetching completed successfully");
        } catch (error) {
            console.error("Fetching failed:", error);
        }
    }

    async function handleYesVote(
        totalCost: string,
        proposalId: any,
        numberOfShares: any
    ) {
        try {
            if (!connectedWallet) {
                throw new Error("No wallet connected");
            }
            await handleTransfer(totalCost);
            await voteeYes(proposalId, numberOfShares);
            console.log("Voting completed successfully");
        } catch (error) {
            console.error("Voting failed:", error);
        }
    }

    async function handleNoVote(
        totalCost: string,
        proposalId: any,
        numberOfShares: any
    ) {
        try {
            if (!connectedWallet) {
                throw new Error("No wallet connected");
            }
            await handleTransfer(totalCost);
            await voteeNo(proposalId, numberOfShares);
            // const res = await fetchBtcUsd(connectedWallet);
            // console.log("Price: ", res);
            console.log("Voting completed successfully");
        } catch (error) {
            console.error("Voting failed:", error);
        }
    }

    const cleanedData = {
        descriptions: market["0"] || [],
        options: market["1"] || [],
        endTimes: market["2"] || [],
        currentYesPrices: market["3"] || [],
        currentNoPrices: market["4"] || [],
    };

    const markets = parseProposalsToMarkets(
        cleanedData,
        "ethereum",
        "https://youtube.com"
    );

    const filteredMarkets =
        selectedChain === "All"
            ? markets
            : markets.filter((market: any) => market.chain === selectedChain);

    const chains = ["All", "Ethereum", "Polkadot", "Binance Smart Chain"];

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as HTMLElement;
            if (!target.closest(".chain-dropdown")) {
                setIsChainMenuOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    return (
        <>
            {!ready ? (
                <></>
            ) : (
                <>
                    <div
                        ref={containerRef}
                        className="min-h-screen bg-black text-white font-sans relative overflow-hidden"
                    >
                        <Particles />
                        <header className="fixed top-0 left-0 right-0 z-50 bg-black bg-opacity-80 backdrop-blur-md">
                            <nav className="container mx-auto px-4 py-4 flex justify-between items-center">
                                <a href="/">
                                    <h1 className="text-2xl font-bold">
                                        OMNI.PREDICT
                                    </h1>
                                </a>
                                <ul className="flex space-x-6 uppercase text-sm">
                                    <li>
                                        <a
                                            href="#"
                                            className="hover:text-secondary transition-colors"
                                        >
                                            Home
                                        </a>
                                    </li>
                                    <li>
                                        <a
                                            href="#"
                                            className="hover:text-secondary transition-colors"
                                        >
                                            Markets
                                        </a>
                                    </li>
                                    <li>
                                        <a
                                            href="#"
                                            className="hover:text-secondary transition-colors"
                                        >
                                            About
                                        </a>
                                    </li>
                                </ul>
                            </nav>
                        </header>
                        <main className="pt-24 px-4">
                            <section className="container mx-auto mb-12">
                                <motion.h2
                                    initial={{ opacity: 0, y: 50 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 1, delay: 0.5 }}
                                    className="text-5xl md:text-7xl lg:text-8xl font-bold mb-8 fade-in"
                                >
                                    Opinion Markets
                                </motion.h2>
                                <motion.p
                                    initial={{ opacity: 0, y: 50 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 1, delay: 0.7 }}
                                    className="text-xl mb-8 fade-in"
                                >
                                    Explore and vote on cross-chain opinion
                                    markets. Your votes are secured with Fully
                                    Homomorphic Encryption (FHE).
                                </motion.p>
                            </section>

                            <section className="container mx-auto mb-12">
                                <div className="flex justify-between items-center mb-8">
                                    <h3 className="text-2xl font-bold">
                                        Active Markets
                                    </h3>
                                    <div className="relative chain-dropdown z-50">
                                        <button
                                            onClick={() =>
                                                setIsChainMenuOpen(
                                                    !isChainMenuOpen
                                                )
                                            }
                                            className="px-4 py-2 bg-white text-black rounded flex items-center"
                                        >
                                            {selectedChain}{" "}
                                            <ChevronDown className="ml-2" />
                                        </button>
                                        <AnimatePresence>
                                            {isChainMenuOpen && (
                                                <motion.div
                                                    initial={{
                                                        opacity: 0,
                                                        y: -10,
                                                    }}
                                                    animate={{
                                                        opacity: 1,
                                                        y: 0,
                                                    }}
                                                    exit={{
                                                        opacity: 0,
                                                        y: -10,
                                                    }}
                                                    className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5"
                                                >
                                                    <div
                                                        className="py-1"
                                                        role="menu"
                                                        aria-orientation="vertical"
                                                        aria-labelledby="options-menu"
                                                    >
                                                        {chains.map((chain) => (
                                                            <button
                                                                key={chain}
                                                                onClick={() => {
                                                                    setSelectedChain(
                                                                        chain
                                                                    );
                                                                    setIsChainMenuOpen(
                                                                        false
                                                                    );
                                                                }}
                                                                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                                                                role="menuitem"
                                                            >
                                                                {chain}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </div>
                                <CurrentChain />
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {filteredMarkets.map((market: any) => (
                                        <MarketCard
                                            key={market.id}
                                            title={market.title}
                                            description={market.description}
                                            votes={market.votes}
                                            chain={market.chain}
                                            yesPercentage={market.yesPercentage}
                                            noPercentage={market.noPercentage}
                                            sourceUrl={market.sourceUrl}
                                            onVote={(vote) =>
                                                vote === "yes"
                                                    ? handleYesVote(
                                                          "1000000",
                                                          market.id - 1,
                                                          1
                                                      )
                                                    : handleNoVote(
                                                          "1000000",
                                                          market.id - 1,
                                                          1
                                                      )
                                            }
                                        />
                                    ))}
                                </div>
                            </section>

                            <section className="container mx-auto mb-12">
                                <GridItem className="fade-in">
                                    <h3 className="text-2xl font-bold mb-4 uppercase">
                                        How It Works
                                    </h3>
                                    <ol className="list-decimal list-inside space-y-2">
                                        <li>
                                            Connect your preferred blockchain
                                            wallet
                                        </li>
                                        <li>
                                            Browse and select an opinion market
                                        </li>
                                        <li>
                                            Cast your vote securely with FHE
                                        </li>
                                        <li>
                                            Verify the authenticity of opinions
                                            and results
                                        </li>
                                    </ol>
                                </GridItem>
                            </section>

                            <section className="container mx-auto">
                                <h3 className="text-2xl font-bold mb-6 fade-in">
                                    Why Omni.predict?
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <GridItem className="fade-in" delay={0.2}>
                                        <h4 className="text-xl font-bold mb-2">
                                            Cross-Chain Voting
                                        </h4>
                                        <p>
                                            Participate in markets across
                                            multiple blockchain networks
                                        </p>
                                    </GridItem>
                                    <GridItem className="fade-in" delay={0.4}>
                                        <h4 className="text-xl font-bold mb-2">
                                            FHE Security
                                        </h4>
                                        <p>
                                            Your votes are protected by Fully
                                            Homomorphic Encryption
                                        </p>
                                    </GridItem>
                                    <GridItem className="fade-in" delay={0.6}>
                                        <h4 className="text-xl font-bold mb-2">
                                            Verifiable Results
                                        </h4>
                                        <p>
                                            Transparent and auditable voting
                                            process and outcomes
                                        </p>
                                    </GridItem>
                                </div>
                            </section>
                        </main>
                        <footer className="py-8 px-4 border-t border-white mt-12">
                            <div className="container mx-auto grid grid-cols-12 gap-4 items-center">
                                <p className="text-sm col-span-12 md:col-span-6">
                                    &copy; 2024 Omni.predict. All rights
                                    reserved.
                                </p>
                                <nav className="col-span-12 md:col-span-6">
                                    <ul className="flex justify-end space-x-6 text-sm uppercase">
                                        <li>
                                            <a
                                                href="#"
                                                className="hover:text-secondary transition-colors"
                                            >
                                                Privacy Policy
                                            </a>
                                        </li>
                                        <li>
                                            <a
                                                href="#"
                                                className="hover:text-secondary transition-colors"
                                            >
                                                Terms of Service
                                            </a>
                                        </li>
                                        <li>
                                            <a
                                                href="#"
                                                className="hover:text-secondary transition-colors"
                                            >
                                                Contact
                                            </a>
                                        </li>
                                    </ul>
                                </nav>
                            </div>
                        </footer>
                    </div>
                </>
            )}
        </>
    );
}
