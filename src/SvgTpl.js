/*!
 * Copyright (c) 2021  Denis Kuzmin <x-3F@outlook.com> github/3F
 * Licensed under the MIT License (MIT).
 * See accompanying License.txt file or visit https://github.com/3F/gh3Fs.action.js/
*/

import Arguments from './Arguments';
import JtCaptureHandler from './JtCaptureHandler'
import JtRefuellerHandler from './JtRefuellerHandler'
import { Jt } from 'mrjt'
import { JtIfHandler } from 'mrjt';

export default class SvgTpl
{
    #fs;

    #jt;
    #jtc;
    #jtr;
    #jtif;

    async render(svg, values)
    {
        return this.#jt
        .set('!', await this.#fs.readFile(svg, 'utf8'))
        .sa(this.#jtif, values)
        .sa(this.#jtc)
        .sa(this.#jtr, values)
        .as(Arguments.toJt(values))
        .val();
    }

    async saveTo(file, data)
    {
        this.#fs.writeFile(file, data);
    }

    constructor()
    {
        const { promises: fs } = require('fs');
        this.#fs = fs;

        this.#jt = new Jt();

        this.#jtc = new JtCaptureHandler('{}');
        this.#jtr = new JtRefuellerHandler('[[]]');

        this.#jtif = new JtIfHandler([ '{}' ],
        {
            if: 'if',
            else: '/',
            fi: ';',
        });
    }
}