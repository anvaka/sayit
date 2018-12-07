<template>
  <div class='about'>
    <div class='background absolute' @click.prevent='close'></div>
    <div class='content'>
      <h3>Related subreddits <a class='close bold highlight' href='#' @click.prevent='close'>close</a></h3>
      <p>TODO: Fill this in</p>
      <p>I hope you like it! Please let me know.</p>
      <ul>
        <li>
        Stay tuned for updates on <a href='https://twitter.com/anvaka' class='highlight'>Twitter.</a>
        </li><li>
        <a href='https://www.patreon.com/anvaka' class='highlight'>Support me on Patreon</a> .
        </li>
      </ul>
      <p>With passion,<br/> Anvaka</p>
      <a href='#' @click.prevent='close' class='large-close bold highlight'>
        close
      </a>
    </div>
  </div>
</template>
<script>

export default {
  mounted() {
    this.closeHandler = (e) => {
      if (e.keyCode === 27) {
        e.preventDefault();
        this.close();
      }
    }
    document.addEventListener('keyup', this.closeHandler);
  },
  beforeDestroy() {
    document.removeEventListener('keyup', this.closeHandler);
  },
  methods: {
    close() {
      this.$emit('close');
    }
  }
}
</script>

<style lang='stylus'>
.about {
  position: fixed;
  overflow: hidden;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;

  .close {
    position: absolute;
    right: 15px;
    font-size: 12px;
  }

  .large-close {
    width: 100%;
    height: 32px;
    display: block;
    text-align: center;
  }

  .content {
    overflow-y: auto;
    max-height: 100%;
    box-shadow: 0 2px 4px rgba(0,0,0,0.2), 0 -1px 0px rgba(0,0,0,0.02);
    position: absolute;
    background-color: white;
    width: 400px;
    padding: 14px;
    border: 1px solid #58585A;
    h3 {
      margin: 0;
      font-weight: normal;
    }
  }
}


.background {
  position: absolute;
  background-color: #58585A;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

@media (max-width: 800px) {
  .about {
    justify-content: initial;
  }
  .about .content {
    width: 100%;
    border: none;
  }
}
</style>
