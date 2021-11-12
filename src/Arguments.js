/*!
 * Copyright (c) 2021  Denis Kuzmin <x-3F@outlook.com> github/3F
 * Licensed under the MIT License (MIT).
 * See accompanying License.txt file or visit https://github.com/3F/gh3Fs.action.js/
*/

import ArgumentNullException from './Exceptions/ArgumentNullException';

export default class Arguments
{
    static toJt(input)
    {
        let result = {};
        this.#simplify(input, result);
        return result;
    }

    static splitAll(input, delimiters)
    {
        if(!input) throw new ArgumentNullException('input');

        let ret = {}
        for(let a of input)
        {
            Object.assign(ret, this.split(a, delimiters));
        }
        return ret;
    }

    static split(input, delimiters)
    {
        if(!input) return null;
        if(!delimiters) return input;

        let index = -1;
        for(let c of delimiters)
        {
            index = input.indexOf(c);
            if(index != -1) break;
        }
        if(index == -1) return input;

        return {[`${input.slice(0, index)}`] : input.slice(index + 1)};
    }

    static escapeRegex(str)
    {
        if(!str) return str;
        return str.replace(/[\[\]{}().?*+\\^$]/g, '\\$&');
    }

    static getAsBase64(input)
    {
        return Buffer.from(input).toString('base64');
    }

    static()
    {

    }

    static #simplify(input, result, prefix = null)
    {
        if(prefix) prefix += '.';

        for(let k in input)
        {
            if(typeof input[k] === 'object' && typeof input[k] !== null)
            {
                this.#simplify(input[k], result, prefix ? prefix + k : k);
                continue;
            }

            result[ prefix ? `${prefix}${k}` : `${k}`] = input[k];
        }
    }
}
