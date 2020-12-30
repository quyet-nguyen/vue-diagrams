<template>
  <svg :x="x" :y="y">
    <g>
      <!-- Main content -->
      <svg x="4" y="4" @mousedown="mouseDown">
        <rect
          filter="url(#NodeEffect)"
          fill="#000"
          fill-opacity="0.6"
          x="0" y="0" 
          :rx="rconner" :ry="rconner"
          :width="width" :height="height"
          class="node-dark-background">
        </rect>

        <!-- Titlebar -->
        <path fill-rule="evenodd" :fill="color" :fill-opacity="titleFillOpacity"
          :d="`M${rconner},0 L${width-rconner},0 A${rconner},${rconner} 0 0 1 ${width},${rconner} L${width},32 L-0,32 L-0,${rconner} A${rconner},${rconner} 0 0 1 ${rconner},0 Z`"/>
        <text ref="text" :x="10" :y="22" font-size="11pt" font-weight="600" fill="#fff">{{title}}</text>

        <!-- Expression -->
        <text v-if="has_expressions" x="12" y="80" font-family="Serif" font-size="48pt" fill="#666" >“</text>
        <foreignObject v-if="has_expressions" :width="width - 12" :height="72" x="6" y="38" > 
          <div v-if="expression" ref="expression" :contentEditable="mode=='edit'" class="text expression" @keydown.enter="rename" @keyup.escape="mode='view'" @blur="mode='view'">{{expression}}</div> 
        </foreignObject>

        <!-- Add binding -->
        <foreignObject v-if="has_bindings" :width="120" :height="36" x="6" :y="height - 30"> 
          <button @click="addBinding">Add binding</button>
        </foreignObject>

        <!-- Add binding -->
        <foreignObject v-if="open_ended" :width="180" :height="36" :x="width - 186" :y="height - 36"> 
          <div class="text action text-right"> <span> Add binding ></span></div>
        </foreignObject>

      </svg>

      <slot></slot>


      <!-- Select effect -->
      <rect fill="none" stroke="#e17e4e" stroke-width="5" v-if="selected" x="4" y="4" :rx="rconner+1" :ry="rconner+1" :width="width+2" :height="height+2"/>

    </g>
  </svg>
</template>
<script>
export default {
  name: "DiagramNode",
  props: [
    "id",
    "title",
    "x",
    "y",
    "type",
    "subtype",
    "width",
    "height",
    "selected",
    "has_bindings",
    "has_expressions",
    "open_ended",
    "expression"
  ],
  data() {
    return {
      nodeStrokeWidth: 0,
      titleFillOpacity: 0.9,
      rconner: 5,
      mode: "view"
    };
  },

  computed: {
    color() {
      return {
        trigger: "#790000",
        flow: "#fbaf5d",
        expression: "#7b0046",
        utility: "#3cb878",
        action: "#005b7f",
        object: "#555",
        method: "red",
        class_method: "yellow"
      }[this.type];
    }
  },

  methods: {
    getTextWidth() {
      return this.$refs.text.getBBox().width;
    },

    mouseDown(event) {
      this.$emit(
        "onStartDrag",
        { type: "node", id: this.id, x: this.x, y: this.y },
        event.x,
        event.y
      );
    },

    addBinding(e) {
      this.$emit("addBinding", this.id);
    }
  }
};
</script>
<style scoped>
  .text {
    color: white;
    font-size: 11pt;
    vertical-align: middle;
  }
  .text.text-right {
    text-align: right;
  }
  .text.expression {
    font-family: monospace;
    font-size: 12pt;
    text-align: center;
    word-wrap: break-word;
  }
</style>