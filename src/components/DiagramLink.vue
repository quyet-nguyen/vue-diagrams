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
          :stroke="selected ? '#e17e4e' : fill"
          :stroke-opacity="selected || highlight ? 0.5 : 0"
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
import { curve } from "../SVGUtils.js";

export default {
  name: "DiagramLink",
  props: ["positionFrom", "positionTo", "id", "type", "selected"],

  data() {
    return {
      highlight: false
    };
  },
  methods: {
    mouseEnter() {
      this.highlight = true;
    },
    mouseLeave() {
      this.highlight = false;
    },
    mouseDown(pos) {
      this.$emit("select", { type: "link", id: this.id });
    }
  },
  computed: {
    fill() {
      return {
        flow: "#555",
        ref: "#00aeef",
        value: "#3cb878",
        binding: "#8560a8"
      }[this.type];
    },
    curve() {
      return curve(
        this.positionFrom.x,
        this.positionFrom.y,
        this.positionTo.x,
        this.positionTo.y
      );
    }
  }
};
</script>
