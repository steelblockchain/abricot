import tf from "@tensorflow/tfjs-node";

export type MemoryTensor =
    | number
    | number[]
    | number[][]
    | number[][][]
    | number[][][][]
    | number[][][][][]
    | number[][][][][][];

export type SharedDeepQNetworkOptions = {
    input_shape: tf.Shape;
    output_size: number;
    verbose?: boolean;
};

export default class SharedDeepQNetwork {
    readonly options: SharedDeepQNetworkOptions;
    private readonly model: tf.LayersModel;

    constructor(options?: SharedDeepQNetworkOptions) {
        this.options = options ?? {
            input_shape: [128],
            output_size: 128,
        };

        this.model = this.build_model();
    }

    private build_model(): tf.LayersModel {
        const model: tf.Sequential = tf.sequential();

        // input layer
        model.add(
            tf.layers.dense({
                units: 512,
                inputShape: this.options.input_shape,
                activation: "relu",
            })
        );

        // hidden layer
        model.add(
            tf.layers.dense({
                units: 1024,
                activation: "relu",
            })
        );

        // hidden layer
        model.add(
            tf.layers.dense({
                units: 1024,
                activation: "relu",
            })
        );

        // output layer
        model.add(
            tf.layers.dense({
                units: this.options.output_size,
                activation: "linear",
            })
        );

        model.compile({
            optimizer: tf.train.adam(0.01),
            loss: tf.losses.meanSquaredError,
        });

        return model;
    }

    async train(
        x: tf.Tensor | Array<tf.Tensor>,
        y: tf.Tensor | Array<tf.Tensor>
    ): Promise<void> {
        await this.model.fit(x, y, { verbose: this.options.verbose ? 1 : 0 });
    }

    async train_with_reward(
        states: tf.Tensor | tf.Tensor[],
        rewards: tf.Tensor,
        nextStates: tf.Tensor | tf.Tensor[],
        dones: tf.Tensor,
        gamma: number = 0.99
    ): Promise<void> {
        const targetQs = tf.tidy(() => {
            const nextQs = this.predict(nextStates);
            const result: Array<tf.Tensor> = [];
            for (let nextq of Array.isArray(nextQs) ? nextQs : [nextQs]) {
                const maxNextQs = tf.max(nextq, -1, true);
                const discountedNextQs = tf.mul(maxNextQs, tf.sub(1, dones));
                result.push(tf.add(rewards, tf.mul(discountedNextQs, gamma)));
            }

            return result;
        });

        await this.train(states, targetQs);

        tf.dispose(targetQs);
    }

    predict(
        state: tf.Tensor | Array<tf.Tensor>,
        random?: boolean
    ): tf.Tensor | Array<tf.Tensor> {
        if (random) {
            return tf.tensor(
                Array.from({ length: this.options.output_size }, Math.random)
            );
        }

        return this.model.predict(state);
    }

    async save(): Promise<Array<MemoryTensor>> {
        return Promise.all(
            this.model.getWeights().map(async (x) => await x.array())
        );
    }

    load(weight_array: Array<MemoryTensor>): void {
        const weight_array_tensor = weight_array.map((x) => tf.tensor(x));
        this.model.setWeights(weight_array_tensor);
        tf.dispose(weight_array_tensor);
    }
}
