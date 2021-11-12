/*!
 * Copyright (c) 2021  Denis Kuzmin <x-3F@outlook.com> github/3F
 * Licensed under the MIT License (MIT).
 * See accompanying License.txt file or visit https://github.com/3F/gh3Fs.action.js/
*/

import AppException from './AppException';

export default class ArgumentNullException extends AppException
{
    constructor(...args)
    {
        super("'" + args + "' cannot be null.", null);
    }
}

