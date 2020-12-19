<template>
  <g>
    <g
      @mouseenter="mouseEnter"
      @mouseleave="mouseLeave"
      @mousedown="mouseDown"
    >
      <g>
        <path
          :d="curve"
          :style="largeStrokeStyle"
          stroke-width="8"
          fill="none"
        />
        <path
          :d="curve"
          :stroke="fill"
          stroke-width="3"
          fill="none"
        />
      </g>
    </g>
  </g>
</template>
<script>

import {curve} from "../SVGUtils.js"

export default {
  name: "DiagramLink",
  props: ["positionFrom", "positionTo", "id", "type"],

  data() {
    return {
      largeStrokeStyle: "stroke:rgba(255,0,0,0.0);"
    };
  },
  methods: {
    mouseEnter() {
      this.largeStrokeStyle = "stroke:rgba(255,0,0,0.5);";
    },
    mouseLeave() {
      this.largeStrokeStyle = "stroke:rgba(255,0,0,0.0);";
    },
    mouseDown(pos) {},
  },
  computed: {
    fill() {
      return { flow: "#555", ref: "#00aeef", value: "#3cb878", binding: "#8560a8" }[this.type] 
    },
    curve() {
      return curve(this.positionFrom.x, this.positionFrom.y, this.positionTo.x, this.positionTo.y)
    }
  }
};
</script>
