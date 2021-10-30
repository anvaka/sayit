import createRedditDataClient from "./createRedditDataClient";

const isProd = true;
const dataEndpoint = isProd
  ? "https://anvaka.github.io/sayit-data/2/"
  : "http://localhost:8081/";
const redditDataClient = createRedditDataClient(dataEndpoint);

export default redditDataClient;
