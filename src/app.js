/*!
 * Copyright (c) 2021  Denis Kuzmin <x-3F@outlook.com> github/3F
 * Licensed under the MIT License (MIT).
 * See accompanying License.txt file or visit https://github.com/3F/gh3Fs.action.js/
*/

import SvgTpl from './SvgTpl';
import Arguments from './Arguments';
import GithubApiGql from './GithubApiGql';
import ArgumentNullException from './Exceptions/ArgumentNullException';
import Log from './Log';

async function run(token, dpath, pinned = null)
{
    if(!token) throw new ArgumentNullException("token");
    if(!dpath) throw new ArgumentNullException("dpath");

    const tstat = './templates/overview.svg';
    const trepo = './templates/repo.svg';
    Log.dbg('Input pinned',  pinned);
    Log.dbg('Input path', dpath);

    const tpl   = new SvgTpl();
    const api   = new GithubApiGql(token);
    const path  = require('path');

    const gstat = await tpl.render(tstat, await api.getStat());
    let files =
    [{ 
        path: path.posix.join(dpath, 'statistics', 'overview.svg'),
        contents: gstat
    }];

    if(pinned)
    {
        const repos = await api.getStatForRepositories(pinned.split(','));
        for(let repo of repos)
        {
            repo.languages = repo.languages.slice(0, 5).sort
            (
                (a, b) => b.bytes - a.bytes
            );
    
            const grepo = await tpl.render(trepo, repo);
    
            files.push
            ({
                path: path.posix.join(dpath, 'repositories/', repo.name +'.svg'),
                contents: grepo
            });
        }
    }

    const result = await api.commitBase64(files);
    core.setOutput('result', result);
    Log.info('Done.', result);
}

const core = require('@actions/core');
Log.debug = false;

(async () =>
{

    try
    {
        const v = Arguments.splitAll(process.argv.slice(2), [':', '=']);
        await run
        (
            core.getInput('token')  || v['token'] || process.env.GH_S_PK,
            core.getInput('path')   || v['path'],
            core.getInput('pinned') || v['pinned'],
        )
    }
    catch(ex)
    {
        core.setFailed(ex.message);
        Log.err("Fatal", ex);
    }

})();