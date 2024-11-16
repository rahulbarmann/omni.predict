/** @type {import('next').NextConfig} */

module.exports = {
    env: {
        ETH_TESTNET_RPC: process.env.ETH_TESTNET_RPC,
        ETH_PRIVATE_KEY: process.env.ETH_PRIVATE_KEY,
        RECIPIENT_ADDRESS: process.env.RECIPIENT_ADDRESS,
        AMOUNT: process.env.AMOUNT,
        BASE_TESTNET_RPC: process.env.BASE_TESTNET_RPC,
        BASE_PRIVATE_KEY: process.env.BASE_PRIVATE_KEY,
    },
    webpack: (config: any, { isServer }: { isServer: any }) => {
        patchWasmModuleImport(config, isServer);

        if (!isServer) {
            config.output.environment = {
                ...config.output.environment,
                asyncFunction: true,
            };
        }
        return config;
    },
};

function patchWasmModuleImport(config: any, isServer: any) {
    config.experiments = Object.assign(config.experiments || {}, {
        asyncWebAssembly: true,
        layers: true,
        topLevelAwait: true,
    });

    config.optimization.moduleIds = "named";

    config.module.rules.push({
        test: /\.wasm$/,
        type: "asset/resource",
    });

    // TODO: improve this function -> track https://github.com/vercel/next.js/issues/25852
    if (isServer) {
        config.output.webassemblyModuleFilename =
            "./../static/wasm/tfhe_bg.wasm";
    } else {
        config.output.webassemblyModuleFilename = "static/wasm/tfhe_bg.wasm";
    }
}
