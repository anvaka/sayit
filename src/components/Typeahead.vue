<template>
<div class='ak-typeahead'>
 <input v-model='currentQuery'
        ref='input'
        autofocus
        :readonly='readonly'
        autocomplete='off' autocorrect='off' autocapitalize='off' spellcheck='false'
        :placeholder='placeholder' @input='getSuggestionsInternal' @keydown='cycleTheList'/>
  <a type='submit' class='search-submit' href='#' @click.prevent='pickCurrentText' v-if='currentQuery'>Go</a>
  <ul v-if='showSuggestions' class='suggestions'>
    <li v-for='(suggestion, index) in suggestions' :key='index'>
      <a @click.prevent='pickSuggestion(suggestion)' class='suggestion' :class="{selected: suggestion.selected}" href='#'
         v-html='suggestion.html'>
      </a>
    </li>
  </ul>

  <ul v-if='showLoading' class='suggestions'>
    <li class='searching'>
      <span v-if='!loadingError'>Searching...</span>
      <div v-if='loadingError' class='loading-error'>
        <div>Failed to get reddit completions:</div>
        <pre>{{loadingError}}</pre>
      </div>
    </li>
  </ul>
</div>
</template>

<style lang='stylus'>
@import '../vars.styl'

.ak-typeahead
  height: 100%;
  flex: 1;
  align-items: stretch;

  input::-ms-clear {
      display: none;
  }

.search-submit {
  color: #B2B2B2;
  position: absolute;
  right: 0;
  top: 0;
  height: 100%;
  align-items: center;
  text-decoration: none;
  display: flex;
  flex-shrink: 0;
  width: 48px;
  justify-content: center;
  outline: none;
  &:hover, &:focus {
    color: background-color;
    background: highlight-color;
  }
}
.suggestion {
  display: block;
  width: 100%;
  height: 28px;
  display: flex;
  
  align-items: center;
  padding-left: 10px;
  text-decoration: none;
  font-weight: bold;
  color: primary-text;

  b {
    font-weight: normal;
  }
}

.suggestion:hover,
.suggestion.selected
  background-color: #eee;

.suggestions {
  position: absolute
  top: 48px
  width: 100%
  padding: 0
  background: white
  list-style-type: none
  margin: 0
  border-top: 1px solid $border-color
  box-shadow: 0 2px 4px rgba(0,0,0,0.2)

  .searching {
    margin: 8px;
  }
  .loading-error {
    pre {
      color: orangered;
      overflow-x: auto;
      padding-bottom: 14px;
    }
  }
}

input
  height: 100%
  width: 100%
  padding-left: 10px
  font-size: 18px
  border: 0

input:focus
  outline: none

input::placeholder
  color: $hint-text

</style>

<script>
export default {
  props: {
    readonly: {
      default: false
    },
    placeholder: {
      default: 'Type here'
    },
    getSuggestions: {
      default: function (query) {
        return query.split()
      }
    },
    query: {
      default: ''
    },
    delay: {
      default: 80
    }
  },
  data () {
    return {
      currentSelected: -1,
      showSuggestions: false,
      showLoading: false,
      loadingError: null,
      suggestions: [],
      currentQuery: this.query
    }
  },
  methods: {
    refresh () {
      if (this.showSuggestions) this.getSuggestionsInternal()
    },

    hideSuggestions() {
      this.showSuggestions = false
      this.showLoading = false;
      this.pendingKeyToShow = true
    },

    showIfNeeded(visible) {
      // we need to wait until next keypress before we can show suggestion.
      // This avoids race conditions between search results and form submission
      if (!this.pendingKeyToShow) this.showSuggestions = visible
    },

    focus () {
      this.$refs.input.focus();
    },

    pickCurrentText() {
      this.pickSuggestion({ text: this.currentQuery })
    },

    pickSuggestion(suggestion) {
      this.currentQuery = suggestion.text
      this.hideSuggestions()
      this.$emit('selected', this.currentQuery)
    },

    getSuggestionsInternal() {
      var self = this
      if (self.previous) {
        window.clearTimeout(self.previous)
      }
      if (!self.currentQuery) {
        this.showSuggestions = false;
        return;
      }

      self.previous = window.setTimeout(function() {
        self.previous = null

        var query = self.currentQuery
        var p = self.getSuggestions(query)

        if (Array.isArray(p)) {
          self.suggestions = p.map(x => ({ 
            selected: false, 
            text: x.text,
            html: x.html
          }))
          self.currentSelected = -1
          self.showIfNeeded(p && p.length > 0)
        } else if (p) {
          self.loadingError = null;
          self.showLoading = true;
          p.then(function (suggestions) {
            self.showLoading = false;
            suggestions = suggestions || []
            self.suggestions = suggestions.map(x => ({
              selected: false,
              text: x.text,
              html: x.html
            }))
            self.currentSelected = -1
            self.showIfNeeded(suggestions && suggestions.length > 0)
          }, function(err) {
            self.loadingError = err;
          });
        } else {
          throw new Error('Could not parse suggestions response')
        }
      }, self.delay)
    },

    cycleTheList(e) {
      var items = this.suggestions
      var currentSelected = this.currentSelected
      // Any key is alright for the suggestions
      this.pendingKeyToShow = false

      let dx
      if (e.which === 38) { // UP
        dx = -1
      } else if (e.which === 40) { // down
        dx = 1
      } else if (e.which === 13) { // Enter === accept
        if (items[currentSelected]) {
          this.pickSuggestion(items[currentSelected])
        } else {
          this.pickSuggestion({ text: this.currentQuery })
        }
        e.preventDefault()
        return
      } else if (e.which === 27) { // Esc === close
        this.hideSuggestions()
      }

      if (!dx || items.length === 0) return

      e.preventDefault()

      if (currentSelected >= 0) {
        this.suggestions[currentSelected].selected = false
      }
      currentSelected += dx
      if (currentSelected < 0) currentSelected = items.length - 1
      if (currentSelected >= items.length) currentSelected = 0

      this.suggestions[currentSelected].selected = true
      this.currentSelected = currentSelected
    }
  }
}
</script>
