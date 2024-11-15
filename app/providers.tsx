"use client";

import { PrivyProvider } from "@privy-io/react-auth";

export default function Provider({ children }: { children: React.ReactNode }) {
    return (
        <PrivyProvider
            appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID || ""}
            config={{
                appearance: {
                    theme: "dark",
                    accentColor: "#676FFF",
                },
                // Create embedded wallets for users who don't have a wallet
                // embeddedWallets: {
                //     createOnLogin: "users-without-wallets",
                // },
            }}
        >
            {children}
        </PrivyProvider>
    );
}
