select author, subreddit, comment_count from (
    SELECT
        author,
        subreddit,
        COUNT(subreddit) AS comment_count,
        COUNT(*) OVER (PARTITION BY author) AS rows_count
    FROM `fh-bigquery.reddit_comments.2018_08`
    WHERE
        (NOT REGEXP_CONTAINS(author, r'(?i)(deleted)|(bot)|(AutoModerator)')) AND
        (NOT REGEXP_CONTAINS(subreddit, r'(?i)^u_'))
    GROUP BY
    author,
    subreddit
)
WHERE rows_count > 1
ORDER BY
author ASC, subreddit asc

