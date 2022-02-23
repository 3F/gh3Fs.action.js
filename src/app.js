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

(async () =>
{
    const core = require('@actions/core');
    try
    {
        const v = Arguments.splitAll(process.argv.slice(2), [':', '=']);
        const _k = (key, def) => core.getInput(key) || v[key] || def;

        Log.debug = _k('debug', false) === 'true';

        const token = _k('token', process.env.GH_S_PK);

        core.setOutput('result', await run(token, _k('path'), _k('pinned'), _k('label')));
        await cleanup(token, parseInt(_k('clean')) || 800);
    }
    catch(ex)
    {
        core.setFailed(ex.message);
        Log.err("Fatal", ex);
    }

})();

/**
 * @param {string} token API access token.
 * @param {string} dpath Output path where statistics will be located. 
 * @param {string} pinned Optional list of project names as pinned projects.
 * @param {string} label Custom account labeling.
 * @returns object Oid/url.
 */
async function run(token, dpath, pinned = null, label = null)
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

    const gstat = await tpl.render(tstat, await api.getStat(label));
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

/**
 * @param {string} token API access token.
 * @param {integer} clean Clear "Workflow Runs" to a minimal set.
 */
async function cleanup(token, clean)
{
    if(!token) throw new ArgumentNullException("token");

    Log.dbg('cleanup ...', clean);
    await (new GithubApiGql(token)).trimWorkflowRuns(clean);
}