<template>
  <svg :x="x" :y="y">
    <g>
      <rect
        @mousedown="mouseDown"
        filter="url(#NodeEffect)"
        fill="#000"
        fill-opacity="0.6"
        x="5" y="15" 
        :rx="rconner" :ry="rconner"
        :width="width" :height="height"
        class="node-dark-background">
      </rect>

      <!-- Titlebar -->
      <svg x=5 y=15 @mousedown="mouseDown">
        <path fill-rule="evenodd" :fill="color" :fill-opacity="titleFillOpacity"
          :d="`M${rconner},0 L${width-rconner},0 A${rconner},${rconner} 0 0 1 ${width},${rconner} L${width},32 L-0,32 L-0,${rconner} A${rconner},${rconner} 0 0 1 ${rconner},0 Z`"/>
        <text :x="10" :y="22" font-size="11pt" font-weight="600" fill="#fff">{{title}}</text>
      </svg>

      <slot></slot>

      <!-- Select effect -->
      <rect fill="none" stroke="#e17e4e" stroke-width="5" v-if="selected" x="3" y="13" :rx="rconner+1" :ry="rconner+1" :width="width+4" :height="height+4"/>

    </g>
  </svg>
</template>
<script>
export default {
  name: "DiagramNode",

  props: {
    title: {
      type: String,
      required: true
    },
    id: Number,
    x: Number,
    y: Number,
    type: String,
    width: {
      type: Number,
      default: 72
    },
    height: {
      type: Number,
      default: 100
    },
    deletable: {
      type: Boolean,
      default: true
    },
    selected: Boolean
  },

  data() {
    return {
      nodeStrokeWidth: 0,
      titleFillOpacity: 0.9,
      rconner: 5,
    };
  },

  computed: {
    color() {
      return { trigger: "#790000", flow: "#fbaf5d", expression: "#7b0046", utility: "#3cb878", action: "#005b7f" }[this.type]
    } 
  },

  methods: {
    deleteNode: function() {
      this.$emit("delete");
    },

    mouseDown: function(event) {
      this.$emit(
        "onStartDrag",
        { type: "node", id: this.id },
        event.x - this.x,
        event.y - this.y
      );
    },

  }
};
</script>
