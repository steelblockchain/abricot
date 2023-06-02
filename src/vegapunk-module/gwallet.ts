import {
    GunSchema,
    GunValueSimple,
    IGunChain,
    IGunInstance,
    ISEAPair,
    Policy,
} from "gun";
import SEA from "gun/sea.js";
import "gun/lib/load.js";

export type GWalletCredentials = {
    alias: string;
    passphrase: string;
};

export default class GWallet {
    private static is_credentials(
        credentials: GWalletCredentials | ISEAPair
    ): credentials is GWalletCredentials {
        return "alias" in credentials && "passphrase" in credentials;
    }

    private static async random_passphrase(alias: string) {
        const now = Date.now();
        const random = now * (Math.random() + 1);
        return (
            (await GWallet.work({
                alias,
                timestamp: now,
                random,
            })) ?? `- invalid work -`
        );
    }

    private static async create(
        gun: IGunInstance,
        credentials: GWalletCredentials
    ): Promise<boolean> {
        return new Promise((resolve) => {
            gun.user().create(
                credentials.alias,
                credentials.passphrase,
                (response) => {
                    if ("err" in response) {
                        resolve(false);
                    } else {
                        resolve(true);
                    }
                }
            );
        });
    }

    private static async get_pair(
        gun: IGunInstance,
        credentials: GWalletCredentials
    ): Promise<ISEAPair | undefined> {
        return new Promise((resolve) => {
            gun.user().auth(
                credentials.alias,
                credentials.passphrase,
                (response) => {
                    if ("err" in response) {
                        resolve(undefined);
                    } else {
                        resolve(response.sea);
                    }
                }
            );
        });
    }

    private static async connect(
        gun: IGunInstance,
        pair: ISEAPair
    ): Promise<boolean> {
        return new Promise((resolve) => {
            gun.user().auth(pair, (response) => {
                if ("err" in response) {
                    resolve(false);
                } else {
                    resolve(true);
                }
            });
        });
    }

    static async work(
        data: Record<string, any>,
        pair?: ISEAPair
    ): Promise<string> {
        const proof = await SEA.work(data, pair, undefined, {
            name: "SHA-256",
            encode: "hex",
        });

        if (proof) {
            return proof;
        }

        throw new Error("error on proof generation");
    }

    static async sign(data: Record<string, any>, pair: ISEAPair) {
        return await SEA.sign(data, pair);
    }

    static async wallet(
        gun: IGunInstance,
        credentials: GWalletCredentials | ISEAPair
    ): Promise<GWallet> {
        let pair: ISEAPair | undefined = undefined;
        if (GWallet.is_credentials(credentials)) {
            if (credentials.passphrase === "") {
                credentials.passphrase = await GWallet.random_passphrase(
                    credentials.alias
                );
            }
            await GWallet.create(gun, credentials);
            pair = await GWallet.get_pair(gun, credentials);
        } else {
            pair = credentials;
        }

        if (pair) {
            const wallet = new GWallet(gun, pair);
            return wallet;
        }

        throw new Error("invalid pair");
    }

    static async put(
        gun: IGunInstance,
        path: string | Array<string>,
        data: Record<string, any>,
        options?: { opt: { cert: string } },
        timeout: number = 1000
    ): Promise<boolean> {
        return new Promise((resolve) => {
            const to = setTimeout(() => {
                resolve(false);
                gun.user().leave();
            }, timeout);

            GWallet.get(gun, path).put(
                data,
                (response) => {
                    clearTimeout(to);
                    resolve("ok" in response);
                },
                options
            );
        });
    }

    static async load(
        gun: IGunInstance,
        path: string | Array<string>
    ): Promise<Record<string, any> | GunValueSimple> {
        return new Promise((resolve) => {
            GWallet.get(gun, path).load((data) => resolve(data));
        });
    }

    static get(
        gun: IGunInstance,
        path: string | Array<string>
    ): IGunChain<GunSchema & Record<string, GunSchema>, any, any, string> {
        const full_path = Array.isArray(path) ? path : [path];
        let current_key: string | undefined = full_path.shift();

        if (!current_key) {
            throw new Error("key path length 0");
        }

        let current_chain = gun.get(current_key);

        while ((current_key = full_path.shift())) {
            current_chain = current_chain.get(current_key);
        }

        return current_chain;
    }

    private readonly gun: IGunInstance;
    private readonly pair: ISEAPair;
    private constructor(gun: IGunInstance, pair: ISEAPair) {
        this.gun = gun;
        this.pair = pair;
    }

    public_key(): { pub: string; epub: string } {
        if (this.pair) {
            return {
                pub: this.pair.pub,
                epub: this.pair.epub,
            };
        }

        throw new Error("invalid pair");
    }

    async certify_all(
        policy: Policy,
        options?: { expiry: number }
    ): Promise<string> {
        if (this.pair) {
            return await SEA.certify(
                "*",
                policy,
                this.pair,
                undefined,
                options
            );
        }
        throw new Error("wallet not connected");
    }

    async put(
        path: string | Array<string>,
        data: Record<string, any>,
        cert: string
    ): Promise<boolean> {
        await GWallet.connect(this.gun, this.pair);

        return await GWallet.put(this.gun, path, data, { opt: { cert } });
    }

    async work(data: Record<string, any>): Promise<string> {
        return await GWallet.work(data, this.pair);
    }

    async sign(data: Record<string, any>): Promise<string> {
        return await GWallet.sign(data, this.pair);
    }

    async load(
        path: string | Array<string>
    ): Promise<Record<string, any> | GunValueSimple> {
        return GWallet.load(this.gun, path);
    }
}
