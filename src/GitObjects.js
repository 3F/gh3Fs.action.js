/*!
 * Copyright (c) 2021  Denis Kuzmin <x-3F@outlook.com> github/3F
 * Licensed under the MIT License (MIT).
 * See accompanying License.txt file or visit https://github.com/3F/gh3Fs.action.js/
*/

import ArgumentNullException from './Exceptions/ArgumentNullException';

const { createHash } = await import('crypto');

export default class GitObjects
{
    /**
     * Hash content using algorithm described in 10.2 Git Internals - Git Objects
     * https://git-scm.com/book/en/v2/Git-Internals-Git-Objects
     * @param {string} content Input string data
     * @param {boolean} normalize Normalize content using GitObjects.normalize.
     * @returns `git hash-object` related a 40-character checksum hash (SHA-1)
     */
    static hash(content, normalize = true)
    {
        if(!content) throw new ArgumentNullException('content');

        if(normalize)
        {
            content = this.normalize(content);
        }

        // NOTE: do not use .length since content may contain unicode symbols
        const gitobj = `blob ${Buffer.byteLength(content, 'utf8')}\u0000${content}`;

        const hash = createHash('sha1');
        hash.update(gitobj);
        return hash.digest('hex');
    }

    /**
     * Normalize content to use LF, utf-8, + end with a newline.
     * https://docs.github.com/en/graphql/reference/input-objects#encoding
     * @param {string} content Input string data
     */
    static normalize(content)
    {
        if(!content) throw new ArgumentNullException('content');

        content = Buffer.from
        (
            content.replace(/\r/g, ''), 
            'utf-8'
        )
        .toString();

        if(!content.match(/\n$/)) content += '\n';
        return content;
    }

    static()
    {

    }
}
