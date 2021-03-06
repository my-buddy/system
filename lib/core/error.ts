"use strict";

export class SystemError extends Error {

    code: string;

    public static CODE_PREFIX: string = "bError.";

    constructor(message, code) {
        super(message);
        this.message = message;
        this.name = this.constructor.name;
        this.code = code;
        Error.captureStackTrace(this, this.constructor);
    }

    toString() {
        return this.constructor.name + ":" + this.message;
    }
}