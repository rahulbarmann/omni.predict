"use client";

import { usePrivy, useWallets } from "@privy-io/react-auth";

export default function Home() {
    const { ready, authenticated, login, logout, user, linkGoogle } =
        usePrivy();
    const { wallets } = useWallets();

    function LogoutButton() {
        const disableLogout = !ready || (ready && !authenticated);

        return (
            <button disabled={disableLogout} onClick={logout}>
                Log out
            </button>
        );
    }

    function LoginButton() {
        const disableLogin = !ready || (ready && authenticated);

        return (
            <button disabled={disableLogin} onClick={login}>
                Log in
            </button>
        );
    }
    console.log("Wallets", wallets);

    return (
        <>
            <div>Wallet: {user?.wallet ? user?.wallet.address : "None"}</div>
            <LoginButton />
            <LogoutButton />
            <div className="text-7xl">Helloooo</div>
        </>
    );
}
