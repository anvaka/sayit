<template>
  <div id="app">
    <form v-on:submit.prevent="onSubmit" class="search-box">
      <!-- <input class='search-input' type="text" v-model='appState.query' placeholder='Enter query' autofocus> -->
      <typeahead
        placeholder="Enter subreddit name"
        ref:typeahead
        @selected="doSearch"
        :query="appState.query"
        :get-suggestions="getSuggestions"
      ></typeahead>
    </form>
    <div class="help" v-if="!isLoading">
      The graph of related subreddits
      <a
        href="#"
        @click.prevent="aboutVisible = true"
        class="highlight"
      >Learn more.</a>
    </div>
    <div class="help" v-if="isLoading">{{appState.progress.message}}</div>
    <div class="about-line">
      <a class="about-link" href="#" @click.prevent="aboutVisible = true">about</a>
      <a class="bold" href="https://github.com/anvaka/sayit">source code</a>
    </div>

    <about v-if="aboutVisible" @close="aboutVisible = false"></about>

    <div class="welcome" v-if="!appState.hasGraph">
      <h3>Welcome!</h3>
      <p>
        This website renders graph of related subreddits.
        <a
          class="highlight"
          href="#"
          @click.prevent="aboutVisible = true"
        >Click here</a> to learn more, or
        <a class="highlight" href="?query=math">try demo</a>.
      </p>
    </div>

    <div class="tooltip" ref="tooltip">{{tooltip.text}}</div>
    <subreddit v-if="subreddit" :name="subreddit" class="preview"></subreddit>
    <div class="close-container" v-if="subreddit">
      <a href="#" @click.prevent="subreddit = null">close</a>
    </div>
  </div>
</template>

<script>
import "vuereddit/dist/vuereddit.css";

import appState, { performSearch } from "./appState.js";
import Subreddit from "vuereddit";
import createRenderer from "./lib/createRenderer";
import About from "./components/About";
import Typeahead from "./components/Typeahead";
import bus from "./bus";
import redditDataClient from "./lib/redditDataClient";

export default {
  name: "App",
  data() {
    return {
      aboutVisible: false,
      subreddit: null,
      appState,
      tooltip: {
        text: "",
        x: "",
        y: ""
      }
    };
  },
  components: {
    About,
    Typeahead,
    Subreddit
  },
  computed: {
    isLoading() {
      return appState.progress.working;
    }
  },
  methods: {
    doSearch(q) {
      appState.query = q;
      this.onSubmit();
    },
    getSuggestions(input) {
      return redditDataClient.getSuggestion(input);
    },
    onSubmit() {
      if (!appState.query) return;

      performSearch(appState.query);
      this.renderer.render(appState.graph);
      const el = document.querySelector(":focus");
      if (el) el.blur();
    },
    showSubreddit(name) {
      this.subreddit = name;
    }
  },
  mounted() {
    this.renderer = createRenderer(appState.progress);
    bus.on("show-subreddit", this.showSubreddit);
    bus.on("new-search", this.doSearch);

    if (appState.graph) {
      this.renderer.render(appState.graph);
    }
  },

  beforeDestroy() {
    bus.off("show-subreddit", this.showSubreddit);
    bus.off("new-search", this.doSearch);
  }
};
</script>

<style lang='stylus'>
@import ('./vars.styl');

#app {
  position: relative;
  margin: 8px 14px;
  width: 392px;
  background: background-color;
}

.close-container {
  position: fixed;
  z-index: 2;
  top: 0;
  right: 0;
  height: 40px;

  a {
    padding: 0 12px;
    font-size: 12px;
    color: #fff;
    background-color: #333;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: flex-end;
  }
}

.highlight {
  color: highlight-color;
}

rect, path, text {
  transition: stroke 200ms, fill 200ms;
}

.hovered rect, path.hovered {
  stroke: highlight-color;
}

.hovered rect {
  stroke: highlight-color;
}

.help {
  font-size: 12px;
  margin-top: 8px;

  a {
    background: background-color;
  }
}

.special {
  color: highlight-color;
  font-family: monospace;
}

a {
  text-decoration: none;
}

.age-warning {
  margin-top: 62px
}

.about-line {
  position: fixed;
  right: 0;
  top: 8px;
  padding: 0px 0;
  display: flex;
  flex-direction: column;
  align-items: stretch;

  a {
    text-align: right;
    background: background-color;
    font-size: 12px;
    padding: 0 8px;
    line-height: 24px;
    height: 24px;
    color: secondary-color;
    border-bottom: 1px solid transparent;

    &:hover, &:focus {
      color: highlight-color;
      border-bottom: 1px dashed;
    }
  }
}

.tooltip {
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2), 0 -1px 0px rgba(0, 0, 0, 0.02);
  position: fixed;
  background: background-color;
  padding: 8px;
  border: 1px solid border-color;
  pointer-events: none;
  opacity: 0;
  transition-duration: 300ms;
  transition-property: opacity;
}

.tooltip.visible {
  opacity: 1;
}

.search-box {
  position: relative;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2), 0 -1px 0px rgba(0, 0, 0, 0.02);
  height: 48px;
  display: flex;
  font-size: 16px;
  padding: 0;
  cursor: text;

  span {
    display: flex;
    align-items: center;
    flex-shrink: 0;
  }
}

.subreddit.preview {
  position: fixed;
  right: 0;
  top: 0;
  width: 400px;
  overflow: hidden;

  a {
    target: '_blank';
  }

  .controls {
    position: absolute;
    top: 42px;
    right: 0;
    left: 1px;
    height: 32px;
  }
}

.title-area {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 42px;
}

@media (max-width: 800px) {
  #app {
    width: 100%;
    margin: 0;
  }

  .welcome {
    padding: 16px;
  }

  .help {
    padding: 0 8px;
  }

  .about-line {
    bottom: 0;
    top: initial;
    right: 0;
  }

  .subreddit.preview {
    width: 100%;
  }
}

g.node {
  cursor: pointer;
}

.details-container {
  position: absolute;
  top: 82px;
  bottom: 0;
  left: 0;
  right: 0;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

.read-more {
  linear-gradient(180deg, rgba(255, 255, 255, 0), #fff);
}

@media (max-height: 550px) {
  .search-box {
    height: 32px;

    input.search-input {
      font-size: 16px;
    }
  }

  .help {
    margin-top: 4px;
  }
}
</style>
