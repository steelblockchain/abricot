import Gun from "gun";
import GWallet, { GWalletCredentials } from "./gwallet";
import SharedDeepQNetwork, { SharedDeepQNetworkOptions } from "./sdqn";
import tf from "@tensorflow/tfjs-node";

export type VegapunkGunMetadata = {
    weight: string;
    input_shape: string;
    output_size: number;
};

export default class Vegapunk {
    private readonly wallet: GWallet;
    private readonly sdqn: SharedDeepQNetwork;

    private constructor(wallet: GWallet, sdqn: SharedDeepQNetwork) {
        this.wallet = wallet;
        this.sdqn = sdqn;
    }

    static async vegapunk(
        peers: Array<string> | Record<string, {}>,
        credentials: GWalletCredentials,
        sdqn_options: SharedDeepQNetworkOptions = {
            input_shape: [2048],
            output_size: 2048,
        }
    ): Promise<Vegapunk> {
        const gun = Gun({
            peers,
        });

        const wallet = await GWallet.wallet(gun, credentials);
        const sdqn = new SharedDeepQNetwork(sdqn_options);

        return new Vegapunk(wallet, sdqn);
    }

    async share(
        public_key: string,
        path: string | Array<string>,
        certification: string
    ): Promise<boolean> {
        const weights = await this.sdqn.save();
        const weights_json_base64 = Buffer.from(
            JSON.stringify(weights)
        ).toString("base64");
        return await this.wallet.put(
            [`~${public_key}`, ...(Array.isArray(path) ? path : [path])],
            {
                [this.wallet.public_key().pub]: {
                    weight: weights_json_base64,
                    input_shape: JSON.stringify(this.sdqn.options.input_shape),
                    output_size: this.sdqn.options.output_size,
                },
            },
            certification
        );
    }

    async predict(
        initial_state: tf.Tensor | Array<tf.Tensor>,
        datas: Array<{
            public_key: string;
            path: string | Array<string>;
        }>
    ): Promise<{ [key: string]: tf.Tensor | Array<tf.Tensor> }> {
        const result: { [key: string]: tf.Tensor | Array<tf.Tensor> } = {};

        let last_state = initial_state;
        for (let data of datas) {
            const metadata = (await this.wallet.load([
                `~${data.public_key}`,
                ...(Array.isArray(data.path) ? data.path : [data.path]),
            ])) as VegapunkGunMetadata;

            const sdqn = new SharedDeepQNetwork({
                input_shape: JSON.parse(metadata.input_shape),
                output_size: metadata.output_size,
            });

            const weights = JSON.parse(
                Buffer.from(metadata.weight, "base64").toString()
            );
            sdqn.load(weights);

            last_state = sdqn.predict(last_state);
            result[data.public_key] = last_state;
        }

        return result;
    }
}
