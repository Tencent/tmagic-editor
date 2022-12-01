<template>
  <div
    class="demo-block"
    :class="[blockClass, { hover: hovering }]"
    @mouseenter="hovering = true"
    @mouseleave="hovering = false"
  >
    <div class="source">
      <slot name="source"></slot>
      <m-form ref="form" :config="formConfig" :init-values="{}"></m-form>
    </div>
    <div class="meta" ref="meta">
      <div class="description">
        <pre><code lass="language-javascript hljs" v-html="text"></code></pre>
      </div>
      <div class="highlight">
        <slot name="highlight"></slot>
      </div>
    </div>
    <div
      class="demo-block-control"
      ref="control"
      @click="isExpanded = !isExpanded"
    >
      <transition name="arrow-slide">
        <i :class="[iconClass, hovering]"></i>
      </transition>
      <transition name="text-slide">
        <span>{{ controlText }}</span>
      </transition>
      <el-tooltip effect="dark" :content="'前往 codepen.io 运行此示例'" placement="right">
        <transition name="text-slide">
          <el-button
            size="small"
            type="primary"
            text
            class="control-button"
            @click.stop="goCodepen"
          >
            {{type === 'form' ? '查看结果' : '在线运行'}}
          </el-button>
        </transition>
      </el-tooltip>
    </div>

    <el-dialog
      v-model="resultVisible"
      title="result"
    >
      <pre><code class="language-javascript hljs" v-html="result"></code></pre>
    </el-dialog>
  </div>
</template>

<style lang="scss">
.demo-block {
  margin: 10px 0;
  border: solid 1px #ebebeb;
  border-radius: 3px;
  transition: 0.2s;

  &.hover {
    box-shadow: 0 0 8px 0 rgba(232, 237, 250, 0.6), 0 2px 4px 0 rgba(232, 237, 250, 0.5);
  }

  code {
    font-family: Menlo, Monaco, Consolas, Courier, monospace;
  }

  .demo-button {
    float: right;
  }

  .source {
    padding: 24px;

    p {
      font-size: 14px;
      color: rgb(94, 109, 130);
      line-height: 1.5em;
    }
  }

  .meta {
    background-color: #fafafa;
    border-top: solid 1px #eaeefb;
    overflow: hidden;
    height: 0;
    transition: height 0.2s;
  }

  .el-dialog {
    background-color: #fff;
    color: #666;

    code {
      color: #5e6d82;
    }
  }

  .description {
    box-sizing: border-box;
    border: solid 1px #ebebeb;
    border-radius: 3px;
    font-size: 14px;
    color: #666;
    word-break: break-word;
    margin: 10px;
    background-color: #fff;

    p {
      margin: 0;
      line-height: 26px;
    }

    code {
      color: #5e6d82;
    }
  }

  .highlight {
    pre {
      margin: 0;
    }

    code.hljs {
      margin: 0;
      border: none;
      max-height: none;
      border-radius: 0;

      &::before {
        content: none;
      }
    }
  }

  .demo-block-control {
    border-top: solid 1px #eaeefb;
    height: 44px;
    box-sizing: border-box;
    background-color: #fff;
    border-bottom-left-radius: 4px;
    border-bottom-right-radius: 4px;
    text-align: center;
    margin-top: -1px;
    color: #d3dce6;
    cursor: pointer;
    position: relative;

    &.is-fixed {
      position: fixed;
      bottom: 0;
      width: 868px;
    }

    i {
      font-size: 16px;
      line-height: 44px;
      transition: 0.3s;
      &.hovering {
        transform: translateX(-40px);
      }
    }

    > span {
      position: absolute;
      transform: translateX(-30px);
      font-size: 14px;
      line-height: 44px;
      transition: 0.3s;
      display: inline-block;
    }

    &:hover {
      color: #409eff;
      background-color: #f9fafc;
    }

    & .text-slide-enter,
    & .text-slide-leave-active {
      opacity: 0;
      transform: translateX(10px);
    }

    .control-button {
      line-height: 26px;
      position: absolute;
      top: 10px;
      right: 0;
      font-size: 14px;
      padding-left: 5px;
      padding-right: 25px;
    }
  }
}
</style>

<script lang="ts">
import hljs from 'highlight.js';
import serialize from 'serialize-javascript';

export function stripScript(content) {
  const result = content.match(/<(script)>([\s\S]+)<\/\1>/);
  return result && result[2] ? result[2].trim() : '';
}

export function stripStyle(content) {
  const result = content.match(/<(style)\s*>([\s\S]+)<\/\1>/);
  return result && result[2] ? result[2].trim() : '';
}

export function stripTemplate(content) {
  content = content.trim();
  if (!content) {
    return content;
  }
  return content.replace(/<(script|style)[\s\S]+<\/\1>/g, '').trim();
}

export default {
  props: [
    'type', 'config'
  ],

  data() {
    return {
      codepen: {
        script: '',
        html: '',
        style: '',
      },
      hovering: false,
      isExpanded: false,
      fixedControl: false,
      scrollParent: null,
      resultVisible: false,
      result: {},
    };
  },

  methods: {
    async goCodepen() {
      if (this.type === 'form') {
        this.resultVisible = true;
        const values = await this.$refs.form.submitForm();
        this.result = hljs.highlight('json', JSON.stringify(values, null, 2)).value;
      }
    },

    scrollHandler() {
      const { top, bottom, left } = this.$refs.meta.getBoundingClientRect();
      this.fixedControl =
        bottom > document.documentElement.clientHeight && top + 44 <= document.documentElement.clientHeight;
      this.$refs.control.style.left = this.fixedControl ? `${left}px` : '0';
    },

    removeScrollHandler() {
      this.scrollParent && this.scrollParent.removeEventListener('scroll', this.scrollHandler);
    },
  },

  computed: {
    lang() {
      return 'zh-CN';
    },

    blockClass() {
      return `demo-${this.lang}}`;
    },

    iconClass() {
      return this.isExpanded ? 'el-icon-caret-top' : 'el-icon-caret-bottom';
    },

    controlText() {
      return this.isExpanded ? '隐藏配置' : '显示配置';
    },

    codeArea() {
      return this.$el.getElementsByClassName('meta')[0];
    },

    codeAreaHeight() {
      if (this.$el.getElementsByClassName('description').length > 0) {
        return (
          this.$el.getElementsByClassName('description')[0].clientHeight +
          this.$el.getElementsByClassName('highlight')[0].clientHeight +
          20
        );
      }
      return this.$el.getElementsByClassName('highlight')[0].clientHeight;
    },

    text() {
      return this.isStringConfig ?
        hljs.highlight('js', this.config).value :
        hljs.highlight('js', serialize(this.config, {
          space: 2,
          unsafe: true,
        }).replace(/"(\w+)":\s/g, '$1: ')).value;
    },

    formConfig() {
      return this.isStringConfig ? eval(this.config) : this.config;
    },

    isStringConfig() {
      return typeof this.config === 'string';
    }
  },

  watch: {
    isExpanded(val) {
      this.codeArea.style.height = val ? `${this.codeAreaHeight + 1}px` : '0';
      if (!val) {
        this.fixedControl = false;
        this.$refs.control.style.left = '0';
        this.removeScrollHandler();
        return;
      }
      setTimeout(() => {
        this.scrollParent = document.querySelector('.page-component__scroll > .el-scrollbar__wrap');
        this.scrollParent && this.scrollParent.addEventListener('scroll', this.scrollHandler);
        this.scrollHandler();
      }, 200);
    },
  },

  created() {
    const { highlight } = this.$slots;
    if (highlight && highlight[0]) {
      let code = '';
      let cur = highlight[0];
      if (cur.tag === 'pre' && cur.children && cur.children[0]) {
        cur = cur.children[0];
        if (cur.tag === 'code') {
          code = cur.children[0].text;
        }
      }
      if (code) {
        this.codepen.html = stripTemplate(code);
        this.codepen.script = stripScript(code);
        this.codepen.style = stripStyle(code);
      }
    }
  },

  mounted() {
    this.$nextTick(() => {
      const highlight = this.$el.getElementsByClassName('highlight')[0];
      if (this.$el.getElementsByClassName('description').length === 0) {
        highlight.style.width = '100%';
        highlight.borderRight = 'none';
      }
    });
  },

  beforeDestroy() {
    this.removeScrollHandler();
  },
};
</script>
