"use client";

import React, { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const colors = {
    primary: "#FFFFFF",
    secondary: "#FF0000",
    background: "#000000",
    text: "#FFFFFF",
};

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

export default function SwissGridOmniPredict() {
    const containerRef = useRef<HTMLDivElement>(null);

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

            gsap.to(".parallax-text", {
                y: (i: any, el: any) =>
                    (1 - parseFloat(el.getAttribute("data-speed"))) *
                    ScrollTrigger.maxScroll(window) *
                    -1,
                ease: "none",
                scrollTrigger: {
                    trigger: ".parallax-section",
                    start: "top top",
                    end: "bottom top",
                    scrub: true,
                    invalidateOnRefresh: true,
                },
            });
        }, containerRef);

        return () => ctx.revert();
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
                                href="#about"
                                className="hover:text-secondary transition-colors"
                            >
                                About
                            </a>
                        </li>
                        <li>
                            <a
                                href="#features"
                                className="hover:text-secondary transition-colors"
                            >
                                Features
                            </a>
                        </li>
                        <li>
                            <a
                                href="#how-it-works"
                                className="hover:text-secondary transition-colors"
                            >
                                How It Works
                            </a>
                        </li>
                    </ul>
                </nav>
            </header>

            <main className="pt-16">
                <section
                    id="hero"
                    className="min-h-screen grid grid-cols-12 gap-4 items-center px-4 parallax-section"
                >
                    <div className="col-span-12 md:col-span-8">
                        <h2
                            className="text-8xl font-bold mb-6 leading-tight uppercase parallax-text"
                            data-speed="0.1"
                        >
                            Decentralized Opinion Markets
                        </h2>
                        <p
                            className="text-xl mb-8 parallax-text"
                            data-speed="0.2"
                        >
                            Secure. Transparent. Verifiable.{" "}
                            <span className="text-secondary">Cross-Chain.</span>
                        </p>
                    </div>
                </section>

                <section id="about" className="py-20 px-4">
                    <div className="container mx-auto grid grid-cols-12 gap-4">
                        <GridItem className="col-span-12 md:col-span-6 fade-in">
                            <h3 className="text-4xl font-bold mb-4 uppercase">
                                About Omni.predict
                            </h3>
                            <p className="text-lg">
                                Omni.predict revolutionizes opinion markets by
                                leveraging blockchain technology and Fully
                                Homomorphic Encryption (FHE) to create a secure,
                                transparent, and verifiable voting platform
                                across multiple blockchain networks.
                            </p>
                        </GridItem>
                        <GridItem className="col-span-12 md:col-span-6 fade-in">
                            <h4 className="text-2xl font-bold mb-4 uppercase">
                                Our Mission
                            </h4>
                            <p className="text-lg">
                                To provide a cross-chain, decentralized platform
                                where every voice matters and every vote counts,
                                without compromising on security or privacy,
                                regardless of the blockchain you prefer.
                            </p>
                        </GridItem>
                    </div>
                </section>

                <section
                    id="features"
                    className="py-20 px-4 bg-white text-black"
                >
                    <div className="container mx-auto">
                        <h3 className="text-4xl font-bold mb-12 text-center uppercase">
                            Key Features
                        </h3>
                        <div className="grid grid-cols-12 gap-4">
                            <GridItem className="col-span-12 md:col-span-4 fade-in">
                                <h4 className="text-2xl font-bold mb-4 uppercase">
                                    Cross-Chain Voting
                                </h4>
                                <p className="text-lg">
                                    Cast your votes securely across multiple
                                    blockchain networks, including Ethereum,
                                    Binance Smart Chain, Polkadot, and more,
                                    ensuring wide accessibility and flexibility.
                                </p>
                            </GridItem>
                            <GridItem className="col-span-12 md:col-span-4 fade-in">
                                <h4 className="text-2xl font-bold mb-4 uppercase">
                                    FHE Encryption
                                </h4>
                                <p className="text-lg">
                                    Your votes are protected by Fully
                                    Homomorphic Encryption, guaranteeing privacy
                                    while enabling verifiable computations
                                    across different blockchains.
                                </p>
                            </GridItem>
                            <GridItem className="col-span-12 md:col-span-4 fade-in">
                                <h4 className="text-2xl font-bold mb-4 uppercase">
                                    Verifiable Opinions
                                </h4>
                                <p className="text-lg">
                                    Easily verify the authenticity and source of
                                    opinions, ensuring trust in the voting
                                    process and results, regardless of the
                                    underlying blockchain.
                                </p>
                            </GridItem>
                        </div>
                    </div>
                </section>

                <section id="how-it-works" className="py-20 px-4">
                    <div className="container mx-auto">
                        <h3 className="text-4xl font-bold mb-12 text-center uppercase">
                            How It Works
                        </h3>
                        <div className="grid grid-cols-12 gap-4">
                            <GridItem className="col-span-12 md:col-span-4 fade-in">
                                <h4 className="text-2xl font-bold mb-4 uppercase">
                                    1. Connect
                                </h4>
                                <p className="text-lg">
                                    Link your preferred blockchain wallet to get
                                    started. We support a wide range of wallets
                                    across multiple blockchains, allowing you to
                                    participate from your preferred network.
                                </p>
                            </GridItem>
                            <GridItem className="col-span-12 md:col-span-4 fade-in">
                                <h4 className="text-2xl font-bold mb-4 uppercase">
                                    2. Vote
                                </h4>
                                <p className="text-lg">
                                    Browse opinions and cast your vote on any
                                    supported blockchain. Your choice is
                                    encrypted using FHE, ensuring your privacy
                                    is protected across all networks.
                                </p>
                            </GridItem>
                            <GridItem className="col-span-12 md:col-span-4 fade-in">
                                <h4 className="text-2xl font-bold mb-4 uppercase">
                                    3. Verify
                                </h4>
                                <p className="text-lg">
                                    Confirm the authenticity of opinions and the
                                    integrity of the voting process through our
                                    transparent, cross-chain verification
                                    system.
                                </p>
                            </GridItem>
                        </div>
                    </div>
                </section>
            </main>

            <footer className="py-8 px-4 border-t border-white">
                <div className="container mx-auto grid grid-cols-12 gap-4 items-center">
                    <p className="text-sm col-span-12 md:col-span-6">
                        &copy; 2024 Omni.predict. All rights reserved.
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
    );
}
