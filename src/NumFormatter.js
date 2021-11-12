/*!
 * Copyright (c) 2021  Denis Kuzmin <x-3F@outlook.com> github/3F
 * Licensed under the MIT License (MIT).
 * See accompanying License.txt file or visit https://github.com/3F/gh3Fs.action.js/
*/

import ArgumentException from "./Exceptions/ArgumentException";

export default class NumFormatter
{
    /**
     * 
     * @param {number} number Number value to format.
     * @param {number} fixed Number of digits after the decimal point. Must be in the range 0 - 20, inclusive.
     * @returns {string} Formatted number.
     */
    format(number, fixed = 2)
    {
        if(!this.isValid(number))
        {
            throw new ArgumentException('Unexpected value: ', number);
        }

        if(number >= 1e6)
        {
            return (number / 1e6).toFixed(fixed) + 'm';
        }

        if(number >= 1e3)
        {
            return (number / 1e3).toFixed(fixed) + 'k';
        }

        return number + '';
    }

    /**
     * 
     * @param {number} a Numerator.
     * @param {number} b Denominator.
     * @param {number} fixed Number of digits after the decimal point. Must be in the range 0 - 20, inclusive.
     * @returns {string} Percentage formatted number.
     */
    percent(a, b, fixed = 1)
    {
        if(this.isValid(a) && this.isValid(b))
        {
            return (a / b * 100).toFixed(fixed) + '%';
        }

        throw new ArgumentException('Unexpected values: ', a, b);
    }

    constructor()
    {

    }

    /**
     * @private
     * @returns {boolean}
     */
    isValid(n)
    {
        return !isNaN(parseFloat(n)) && isFinite(n) && n >= 0;
    }
}
