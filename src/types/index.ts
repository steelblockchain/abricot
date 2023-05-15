export type FilterStartWith<
    Set,
    StartPattern extends string
> = Set extends `${StartPattern}${infer _X}` ? Set : never;

export type FilterNotStartWith<
    Set,
    StartPattern extends string
> = Set extends `${StartPattern}${infer _X}` ? never : Set;
