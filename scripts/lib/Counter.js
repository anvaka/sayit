/**
 *  * This class counts total number of mutual commenters to pair of subreddits
 *   */
class Counter {
    constructor() {
          this.sim = 0;
          this.count = 0;
        }

    increase(instanceSimilarity) {
          this.sim += instanceSimilarity;
          this.count += 1;
        }
}

module.exports = Counter;
