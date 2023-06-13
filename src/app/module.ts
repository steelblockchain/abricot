import EventEmitter from "events";
import TypedEventEmitter, { EventMap } from "typed-emitter";
import winston from "winston";

export default abstract class BaseModule<
    T extends EventMap = {}
> extends (EventEmitter as {
    new <T extends EventMap>(): TypedEventEmitter<T>;
})<T> {
    private static readonly __default_logger__: winston.Logger =
        winston.createLogger();
    protected logger?: winston.Logger;

    set_logger(logger: winston.Logger) {
        this.logger = logger;
    }

    get_logger(): winston.Logger {
        return this.logger ?? BaseModule.__default_logger__;
    }
}   
