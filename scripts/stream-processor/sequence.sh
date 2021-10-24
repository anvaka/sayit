curl https://files.pushshift.io/reddit/comments/RC_2019-11.zst | zstdcat -d | node process_output.js > comments_2019-://files.pushshift.io/reddit/comments/RC_2019-11.zst | zstdcat -d | node process_output.js > comments_2019-11

#cat comments_* > all.csv
#sort -u all.csv > comments_sorted
