# visualization of related subreddits

This project builds a graph of related subreddits.

[![demo](https://i.imgur.com/xKlxRkf.gif)](https://anvaka.github.io/sayit/)

Recommendations are constructed based on _Redditors who commented in this subreddit, also commented to..._

Play with it here: https://anvaka.github.io/sayit/

## The data

I used data from two months worth of comments (August and September of 2018) - which contains ~38 millions `user <-> subreddit` records.

You can find original data by [following this discussion](https://www.reddit.com/r/datasets/comments/3bxlg7/i_have_every_publicly_available_reddit_comment/)

I computed Jaccard Similarity between subreddits, and then stored results into github pages. Please let me know if you are curious to learn more about this or anything else - feel free to reach out to me on [twitter](https://twitter.com/anvaka) or via issues in this repository

## Local Build Setup

```bash
# install dependencies
npm install

# serve with hot reload at localhost:8080
npm run dev

# build for production with minification
npm run build

# build for production and view the bundle analyzer report
npm run build --report
```

For a detailed explanation on how things work, check out the [guide](http://vuejs-templates.github.io/webpack/) and [docs for vue-loader](http://vuejs.github.io/vue-loader).

# Thanks!

If you like my work and would like to support me - I have [a Patreon page](https://www.patreon.com/anvaka).

Thank you!
