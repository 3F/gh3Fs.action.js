/*!
 * Copyright (c) 2021  Denis Kuzmin <x-3F@outlook.com> github/3F
 * Licensed under the MIT License (MIT).
 * See accompanying License.txt file or visit https://github.com/3F/gh3Fs.action.js/
*/

export default class Log
{
    static debug = false;

    /**
     * Conditional msg. Activated only if {Log.debug} === true.
     * @param {string} msg
     * @param  {...any} args 
     */
    static dbg(msg, ...args)
    {
        if(Log.debug === true) {
            Log.stdout(console.log, msg, ...args);
        }
    }

    static err(msg, ...args)
    {
        Log.stdout(console.error, msg, ...args);
    }

    static warn(msg, ...args)
    {
        Log.stdout(console.warn, msg, ...args);
    }

    static info(msg, ...args)
    {
        Log.stdout(console.log, msg, ...args);
    }

    /**
     *
     * @private
     * @param {CallableFunction} func Function which is ready to process message.
     * @param {string} msg 
     * @param  {...any} args 
     */
    static stdout(func, msg, ...args)
    {
        if(!func) {
            return;
        }

        let stamp = new Date().toISOString().substr(11, 12) + ']';

        msg = stamp + '[gh3Fs.action.js] ' + msg;
        
        if(!args || args.length < 1) {
            func(msg);
        }
        else {
            func(msg, args);
        }
    }
}
