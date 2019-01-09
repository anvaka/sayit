# visualization of related subreddits

This project builds a graph of related subreddits.

[![demo](https://i.imgur.com/xKlxRkf.gif)](https://anvaka.github.io/sayit/)

Recommendations are constructed based on "Redditors who commented in this subreddit, also commented to..."

## The data

I used data from two months worth of comments (August and September of 2018) - which contains ~38 millions `user <-> subreddit` records.

You can find original data by [following this discussion](https://www.reddit.com/r/datasets/comments/3bxlg7/i_have_every_publicly_available_reddit_comment/)

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
