/*!
 * Copyright (c) 2021  Denis Kuzmin <x-3F@outlook.com> github/3F
 * Licensed under the MIT License (MIT).
 * See accompanying License.txt file or visit https://github.com/3F/gh3Fs.action.js/
*/

import Arguments from './Arguments';
import ArgumentNullException from './Exceptions/ArgumentNullException';

export default class JtRefuellerHandler
{
    #config;

    process(act, data, cfg)
    {
        const pattern = new RegExp
        (
            this.#config.tag('\\s*([\\w._\\-\\d\\s]+)\\s*'),
            'g'
        );

        return act.val().replace(pattern, function(m, id)
        {
            const t = act.jt().use(id);

            if(!t._disclose)
            {
                return act.bind(t.val(), data);
            }

            let ret = '';
            for(let item of data[t._disclose])
            {
                ret += act.bind(t.val(), item);
            }
            return ret;
        });
    }

    constructor(pair)
    {
        if(!pair) throw new ArgumentNullException('pair');

        const { JtConfig } = require('mrjt');
        this.#config = new JtConfig(Arguments.escapeRegex(pair));
    }
}