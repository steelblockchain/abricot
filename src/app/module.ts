import EventEmitter from "events";
import TypedEventEmitter, { EventMap } from "typed-emitter";

export default abstract class BaseModule<
    T extends EventMap = {}
> extends (EventEmitter as {
    new <T extends EventMap>(): TypedEventEmitter<T>;
})<T> {}
