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
    Log.dbg('Input path', dpath);
    Log.dbg('Input pinned',  pinned);

    const path = await import('path');
    const dstats = path.posix.join(dpath, 'statistics');
    const drepos = path.posix.join(dpath, 'repositories');

    const tpl   = new SvgTpl();
    const api   = new GithubApiGql(token);

    const gstat = await tpl.render(tstat, await api.getStat());
    let fstats =
    [{ 
        path: path.posix.join(dstats, 'overview.svg'),
        contents: gstat
    }];

    let frepos = [];
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
    
            frepos.push
            ({
                path: path.posix.join(drepos, repo.name +'.svg'),
                contents: grepo
            });
        }
    }

    let result;
    if(!await api.isUpToDate(dstats, fstats) || !await api.isUpToDate(drepos, frepos))
    {
        Log.info('Outdated data. Start updating ...');
        result = await api.commit([...fstats, ...frepos]);
    }
    else
    {
        Log.info('There is nothing to do. Everything is up-to-date.');
        result = { oid: null, url: null };
    }

    Log.info('Done.', result);
    return result;
}

(async () =>
{
    const core = require('@actions/core');

    Log.debug = false;
    try
    {
        const v = Arguments.splitAll(process.argv.slice(2), [':', '=']);
        core.setOutput('result', await run
        (
            core.getInput('token')  || v['token'] || process.env.GH_S_PK,
            core.getInput('path')   || v['path'],
            core.getInput('pinned') || v['pinned'],
        ));
    }
    catch(ex)
    {
        core.setFailed(ex.message);
        Log.err("Fatal", ex);
    }

})();