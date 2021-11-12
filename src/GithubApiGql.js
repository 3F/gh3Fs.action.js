/*!
 * Copyright (c) 2021  Denis Kuzmin <x-3F@outlook.com> github/3F
 * Licensed under the MIT License (MIT).
 * See accompanying License.txt file or visit https://github.com/3F/gh3Fs.action.js/
*/

import NumFormatter from './NumFormatter';
import AppException from './Exceptions/AppException';
import ArgumentNullException from './Exceptions/ArgumentNullException';
import Log from './Log';
import Arguments from './Arguments';

export default class GithubApiGql
{
    /** Flag to update our latest commit by moving HEAD - 1 */
    updatableCommit;

    /** @protected */
    #formatter = new NumFormatter();

    /** target repository name for updating assets */
    #reponame;

    #octokit;
    #username;

    #cid = '[gh3Fs.action.js]';
    #defaultMessage = 'update using gh3Fs.action.js';

    async commitBase64(content, msg = null)
    {
        if(!content) throw new ArgumentNullException('content');

        for(let data of content)
        {
            data.contents = Arguments.getAsBase64(data.contents);
        }

        return await this.commit(content, msg);
    }

    async commit(files, msg = null)
    {
        if(!files) throw new ArgumentNullException('files');

        const bref = await this.getDefaultBranchRef(this.#reponame);

        msg = msg || this.#defaultMessage;
        const cfg = 
        {
            branch: {
                repositoryNameWithOwner: this.#username + "/" + this.#reponame,
                branchName: bref.name
            },
            //NOTE: github will also move everything from {headline} into {body} after encountering a line feed character like '\n'
            message: { headline: this.#formatCommitMessage(msg) },
            fileChanges: { additions: files },
            expectedHeadOid: await this.#getOid(bref),
        }

        Log.dbg('commit files:', cfg);
        
        const q = await this.#octokit.graphql
        (`
            mutation push($v: CreateCommitOnBranchInput!)
            { createCommitOnBranch(input: $v) { commit { oid, url } } },
         `, { v: cfg }
        );

        return q.createCommitOnBranch.commit;
    }

    async getDefaultBranchRef(repo)
    {
        if(!repo) throw new ArgumentNullException('repo');

        const q = await this.#octokit.graphql
        (`
            query info($login: String!, $repo: String!)
            {
                repository(owner: $login, name: $repo)
                {
                    defaultBranchRef
                    {
                        id
                        name
                        target {
                        ... on Commit { history(first: 2) { nodes { oid, messageHeadline, messageBody } } }
                        }
                    }
                }
            }`, { login: this.#username, repo: repo }
        );

        const oids = q.repository.defaultBranchRef.target.history.nodes;

        return {
            id:             q.repository.defaultBranchRef.id,
            name:           q.repository.defaultBranchRef.name,
            oidHead:        oids[0].oid,
            titleHead:      oids[0].messageHeadline,
            bodyHead:       oids[0].messageBody,
            oidHeadMinus1:  oids[1].oid,
        };
    }

    async getStat()
    {
        const u = await this.#getUserStat();
        const r = await this.#getRepositoriesStat();

        return {
            followers:  this.#formatter.format(u),
            repositories:
            {
                stargazers: this.#formatter.format(r.stargazers),
                members:    this.#formatter.format(r.members),
                watchers:   this.#formatter.format(r.watchers),
                eWatchers:  this.#formatter.format(r.eWatchers),
                public:     this.#formatter.format(r.public),
                forks:      this.#formatter.format(r.forks),
            }
        };
    }

    async getStatForRepositories(names)
    {
        if(!names) throw new ArgumentNullException("names");

        let repositories = [];
        for(let name of names)
        {
            name = name.trim();
            const r = await this.#getStatForRepository(name);

            let languages = [];
            for(let i = 0; i < r.languages.length; ++i)
            {
                const l = r.languages[i];

                languages.push
                ({
                    size:       this.#formatter.format(l.size),
                    percent:    this.#formatter.percent(l.size, r.code),
                    name:       l.name,
                    color:      l.color || '#CCCCCC',
                    bytes:      l.size
                });
            }

            repositories.push
            ({
                name: name,

                url: r.url,
                description: r.description,
                shortDescriptionHTML: r.shortDescriptionHTML,

                stargazers: this.#formatter.format(r.stargazers),
                forks:      this.#formatter.format(r.forks),
                watchers:   this.#formatter.format(r.watchers),
                languages:  languages,
                code:       this.#formatter.format(r.code),
            });
        }

        Log.dbg("getStatForRepositories(names):", names, repositories);
        return repositories;
    }

    constructor(token, updatableCommit = true, username = null, reponame = null)
    {
        if(!token) throw new ArgumentNullException('token');

        this.updatableCommit = updatableCommit;

        const github = require('@actions/github');

        try
        {
            this.#username = (!username) ? github.context.repo.owner : username;
            this.#reponame = (!reponame) ? github.context.repo.repo : reponame;
        }
        catch(ex)
        {
            throw new AppException('Incomplete environment. Please define username + reponame manually.', ex.message);
        }
        Log.dbg('username:', this.#username);
        Log.dbg('reponame:', this.#reponame);

        this.#octokit = github.getOctokit(token);
    }

    async #getOid(bref)
    {
        if(!bref) throw new ArgumentNullException('bref');

        Log.dbg('getOid', bref);

        if(this.updatableCommit && this.#findMessageIdentifier(bref.titleHead, bref.bodyHead))
        {
            await this.#moveHead(bref.id, bref.oidHeadMinus1);
            return bref.oidHeadMinus1;
        }

        return bref.oidHead;
    }

    async #moveHead(refId, oid)
    {
        if(!refId) throw new ArgumentNullException('refId');
        if(!oid) throw new ArgumentNullException('oid');
        
        const q = await this.#octokit.graphql
        (`
            mutation update($v: UpdateRefInput!)
            { updateRef(input: $v) { ref { id } } },
         `, { v: {
                    refId:  refId,
                    oid:    oid,
                    force:  true,
                 }
            }
        );

        Log.dbg(q);
    }

    async #getStatForRepository(name)
    {
        if(!name) throw new ArgumentNullException("name");

        const q = await this.#octokit.graphql
        (`
            query info($login: String!, $name: String!, $languages: Int)
            {
                repository(owner: $login, name: $name)
                {
                    url
                    description
                    shortDescriptionHTML
                    stargazerCount
                    forkCount
                    watchers{ totalCount }
                    languages(first: $languages)
                    {
                        edges{ size }
                        totalSize
                        nodes{ color, name }
                    }
                }
            }`, { login: this.#username, name: name, languages: 5 }
        );

        let languages = [];
        for(let i = 0; i < q.repository.languages.nodes.length; ++i)
        {
            const node = q.repository.languages.nodes[i];
            const edge = q.repository.languages.edges[i];

            languages.push
            ({
                size: edge.size,
                name: node.name,
                color: node.color,
            });
        }

        Log.dbg("#getStatForRepository(name):", name, q.repository, languages);

        return {
            url:                    q.repository.url,
            description:            q.repository.description,
            shortDescriptionHTML:   q.repository.shortDescriptionHTML,
            stargazers:             q.repository.stargazerCount,
            forks:                  q.repository.forkCount,
            watchers:               q.repository.watchers.totalCount,
            languages:              languages,
            code:                   q.repository.languages.totalSize,
        }
    }

    async #getUserStat()
    {
        const q = await this.#octokit.graphql
        (`
            query info($login: String!)
            {
                user(login: $login)
                {
                    followers { totalCount }
                }
            }`, { login: this.#username }
        );

        Log.dbg("#getUserStat():", q.user.followers);
        return q.user.followers.totalCount;
    }

    #formatCommitMessage(msg)
    {
        return this.updatableCommit ? '' + msg + '\n' + this.#cid : msg;
    }

    #findMessageIdentifier(title, body)
    {
        return title.indexOf(this.#cid) != -1 || body.indexOf(this.#cid) != -1;
    }

    async #getRepositoriesStat(limit = 100, page = null)
    {
        let stargazers  = 0; // earned stars
        let members     = 0; // number of forks provided for users
        let watchers    = 0; // total repository watchers
        let eWatchers   = 0; // repository watchers when 1+
        let rpublic     = 0; // number of public repositories except forks
        let rforks      = 0; // number of public forks

        const q = await this.#octokit.graphql
        (`
            query info($login: String!, $after: String, $first: Int)
            {
                user(login: $login)
                {
                    repositories(first: $first, after: $after)
                    {
                        pageInfo { hasNextPage endCursor }
                        nodes
                        {
                            name,
                            stargazerCount
                            forkCount
                            watchers { totalCount }
                            isPrivate
                            isFork
                        }
                    }
                }
            }`, { login: this.#username, first: limit, after: page }
        );

        for(let i = 0; i < q.user.repositories.nodes.length; ++i)
        {
            const node = q.user.repositories.nodes[i];

            stargazers  += node.stargazerCount;
            members     += node.forkCount;

            if(node.watchers.totalCount > 1) {
                eWatchers += node.watchers.totalCount - 1;
            }
            watchers += node.watchers.totalCount;

            if(!node.isPrivate)
            {
                if(node.isFork) ++rforks; else ++rpublic;
            }

            Log.dbg("repository [" + i + "]: " + node.name);
        }

        if(q.user.repositories.pageInfo.hasNextPage)
        {
            const r = await this.#getRepositoriesStat(limit, q.user.repositories.pageInfo.endCursor);

            stargazers  += r.stargazers;
            members     += r.members;
            watchers    += r.watchers;
            eWatchers   += r.eWatchers;
            rpublic     += r.public;
            rforks      += r.forks;
        }

        return {
            stargazers: stargazers,
            members:    members,
            watchers:   watchers,
            eWatchers:  eWatchers,
            public:     rpublic,
            forks:      rforks,
        };
    }
}