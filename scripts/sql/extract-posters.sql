SELECT author, subreddit, count(author) as c FROM `fh-bigquery.reddit_comments.2018_08`
where not regexp_contains(author, r'(?i)(deleted)|(bot)|(AutoModerator)')
group by author, subreddit 
order by author desc
