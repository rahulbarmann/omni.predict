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

gsap.registerPlugin(ScrollTrigger);

const GridItem = ({
    children,
    className = "",
}: {
    children: React.ReactNode;
    className?: string;
}) => (
    <div
        className={`p-4 border border-white hover:bg-white hover:text-black transition-all duration-300 ${className}`}
    >
        {children}
    </div>
);

const MarketCard = ({
    title,
    description,
    votes,
    chain,
    yesPercentage,
    noPercentage,
    sourceUrl,
}: {
    title: string;
    description: string;
    votes: number;
    chain: string;
    yesPercentage: number;
    noPercentage: number;
    sourceUrl: string;
}) => {
    const [userVote, setUserVote] = useState<string | null>(null);
    const [isSourceOpen, setIsSourceOpen] = useState(false);

    const handleVote = (vote: string) => {
        setUserVote(vote);
        // Here you would typically send the vote to your backend
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

export default function MarketsPage() {
    const containerRef = useRef<HTMLDivElement>(null);
    const [selectedChain, setSelectedChain] = useState("All");
    const [isChainMenuOpen, setIsChainMenuOpen] = useState(false);

    const markets = [
        {
            id: 1,
            title: "Will AI surpass human intelligence by 2030?",
            description: "Vote on the future of artificial intelligence",
            votes: 1234,
            chain: "Ethereum",
            yesPercentage: 65,
            noPercentage: 35,
            sourceUrl: "https://example.com/ai-intelligence-2030",
        },
        {
            id: 2,
            title: "Next US President 2024",
            description: "Predict the outcome of the upcoming US election",
            votes: 5678,
            chain: "Polkadot",
            yesPercentage: 48,
            noPercentage: 52,
            sourceUrl: "https://example.com/us-election-2024",
        },
        {
            id: 3,
            title: "Bitcoin price prediction for 2025",
            description: "What will be the price of Bitcoin in 2025?",
            votes: 9876,
            chain: "Binance Smart Chain",
            yesPercentage: 72,
            noPercentage: 28,
            sourceUrl: "https://example.com/bitcoin-price-2025",
        },
        {
            id: 4,
            title: "Mars colony by 2040?",
            description:
                "Will humans establish a permanent colony on Mars by 2040?",
            votes: 3456,
            chain: "Ethereum",
            yesPercentage: 30,
            noPercentage: 70,
            sourceUrl: "https://example.com/mars-colony-2040",
        },
        {
            id: 5,
            title: "Quantum computing breakthrough",
            description:
                "Will a major quantum computing breakthrough occur in the next 5 years?",
            votes: 7890,
            chain: "Polkadot",
            yesPercentage: 55,
            noPercentage: 45,
            sourceUrl: "https://example.com/quantum-computing-breakthrough",
        },
        {
            id: 6,
            title: "Global renewable energy adoption",
            description:
                "Predict the percentage of global energy from renewable sources by 2030",
            votes: 2345,
            chain: "Binance Smart Chain",
            yesPercentage: 80,
            noPercentage: 20,
            sourceUrl: "https://example.com/renewable-energy-2030",
        },
    ];

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

    const filteredMarkets =
        selectedChain === "All"
            ? markets
            : markets.filter((market) => market.chain === selectedChain);

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
        <div
            ref={containerRef}
            className="min-h-screen bg-black text-white font-sans"
        >
            <header className="fixed top-0 left-0 right-0 z-50 bg-black">
                <nav className="container mx-auto px-4 py-4 grid grid-cols-12 gap-4 items-center">
                    <h1 className="text-2xl font-bold col-span-3">
                        OMNI.PREDICT
                    </h1>
                    <ul className="col-span-9 flex justify-end space-x-6 uppercase text-sm">
                        <li>
                            <a
                                href="#"
                                className="hover:text-red-500 transition-colors"
                            >
                                Home
                            </a>
                        </li>
                        <li>
                            <a
                                href="#"
                                className="hover:text-red-500 transition-colors"
                            >
                                Markets
                            </a>
                        </li>
                        <li>
                            <a
                                href="#"
                                className="hover:text-red-500 transition-colors"
                            >
                                About
                            </a>
                        </li>
                    </ul>
                </nav>
            </header>

            <main className="pt-24 px-4">
                <section className="container mx-auto mb-12">
                    <h2 className="text-6xl font-bold mb-8 fade-in">
                        Opinion Markets
                    </h2>
                    <p className="text-xl mb-8 fade-in">
                        Explore and vote on cross-chain opinion markets. Your
                        votes are secured with Fully Homomorphic Encryption
                        (FHE).
                    </p>
                </section>

                <section className="container mx-auto mb-12">
                    <div className="flex justify-between items-center mb-8">
                        <h3 className="text-2xl font-bold">Active Markets</h3>
                        <div className="relative chain-dropdown z-50">
                            <button
                                onClick={() =>
                                    setIsChainMenuOpen(!isChainMenuOpen)
                                }
                                className="px-4 py-2 bg-white text-black rounded flex items-center"
                            >
                                {selectedChain} <ChevronDown className="ml-2" />
                            </button>
                            {isChainMenuOpen && (
                                <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5">
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
                                                    setSelectedChain(chain);
                                                    setIsChainMenuOpen(false);
                                                }}
                                                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                                                role="menuitem"
                                            >
                                                {chain}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredMarkets.map((market) => (
                            <MarketCard
                                key={market.id}
                                title={market.title}
                                description={market.description}
                                votes={market.votes}
                                chain={market.chain}
                                yesPercentage={market.yesPercentage}
                                noPercentage={market.noPercentage}
                                sourceUrl={market.sourceUrl}
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
                            <li>Connect your preferred blockchain wallet</li>
                            <li>Browse and select an opinion market</li>
                            <li>Cast your vote securely with FHE</li>
                            <li>
                                Verify the authenticity of opinions and results
                            </li>
                        </ol>
                    </GridItem>
                </section>

                <section className="container mx-auto">
                    <h3 className="text-2xl font-bold mb-6 fade-in">
                        Why Omni.predict?
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <GridItem className="fade-in">
                            <h4 className="text-xl font-bold mb-2">
                                Cross-Chain Voting
                            </h4>
                            <p>
                                Participate in markets across multiple
                                blockchain networks
                            </p>
                        </GridItem>
                        <GridItem className="fade-in">
                            <h4 className="text-xl font-bold mb-2">
                                FHE Security
                            </h4>
                            <p>
                                Your votes are protected by Fully Homomorphic
                                Encryption
                            </p>
                        </GridItem>
                        <GridItem className="fade-in">
                            <h4 className="text-xl font-bold mb-2">
                                Verifiable Results
                            </h4>
                            <p>
                                Transparent and auditable voting process and
                                outcomes
                            </p>
                        </GridItem>
                    </div>
                </section>
            </main>

            <footer className="py-8 px-4 border-t border-white mt-12">
                <div className="container mx-auto grid grid-cols-12 gap-4 items-center">
                    <p className="text-sm col-span-12 md:col-span-6">
                        &copy; 2024 Omni.predict. All rights reserved.
                    </p>
                    <nav className="col-span-12 md:col-span-6">
                        <ul className="flex justify-end space-x-6 text-sm uppercase">
                            <li>
                                <a
                                    href="#"
                                    className="hover:text-red-500 transition-colors"
                                >
                                    Privacy Policy
                                </a>
                            </li>
                            <li>
                                <a
                                    href="#"
                                    className="hover:text-red-500 transition-colors"
                                >
                                    Terms of Service
                                </a>
                            </li>
                            <li>
                                <a
                                    href="#"
                                    className="hover:text-red-500 transition-colors"
                                >
                                    Contact
                                </a>
                            </li>
                        </ul>
                    </nav>
                </div>
            </footer>
        </div>
    );
}
