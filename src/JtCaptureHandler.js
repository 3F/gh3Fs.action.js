/*!
 * Copyright (c) 2021  Denis Kuzmin <x-3F@outlook.com> github/3F
 * Licensed under the MIT License (MIT).
 * See accompanying License.txt file or visit https://github.com/3F/gh3Fs.action.js/
*/

import Arguments from './Arguments';
import ArgumentNullException from './Exceptions/ArgumentNullException';

export default class JtCaptureHandler
{
    #pattern;

    process(act, data, cfg)
    {
        return act.val().replace
        (
            this.#pattern,
            function(m, name, using, data)
            {
                act.jt().set(name.trim(), data)
                        ._disclose = using.trim();

                return '';
            }
        );
    }

    constructor(pair)
    {
        if(!pair) throw new ArgumentNullException('pair');
        
        const { JtConfig } = require('mrjt');
        const config = new JtConfig(Arguments.escapeRegex(pair));

        this.#pattern = new RegExp
        (
            config.tag
            (
                "capture\\s+(?:(?:as\\s*)?'([^']*?)'\\s*)?(?:using\\s*'([^']*?)')?"
            ) 
            + "([\\s\\S]+?)" + 
            config.tag("/capture"), 'g'
        );
    }
}