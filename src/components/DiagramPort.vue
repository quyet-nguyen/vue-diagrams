<template>
  <g @mouseenter="enter" @mouseleave="leave" @mousedown="startDragNewLink" @mouseup="mouseup">
    <svg :x="x-1" :y="y" >
     
      <polygon v-if="type === 'flow'" 
        points="3,2 3,14 12,8" :fill="highlight ? color : 'none'" :stroke="color" stroke-width="2" stroke-linejoin="round" />
 
      <rect v-else-if="type === 'array'" x="0" y="0" width="12" height="12" :fill="highlight ? color : 'none'" :stroke="color" stroke-width="2" />

      <circle v-else r="6" cx="7" cy="7" :fill="highlight ? color : 'none'" :stroke="color" stroke-width="2" stroke-linejoin="round" />

    </svg>
    <text 
      v-show="mode == 'view'"
      @dblclick="dblclick"
      :x="direction == 'in' ? x + 16 : x - 4" :y="y + 13"
      :text-anchor="direction == 'in' ? 'start' : 'end'"
      font-size="10pt" fill="white" ref="text">{{name}}</text>
    <foreignObject v-if="mode=='edit'" :width="bbox.width-15" :height="bbox.height" :x="bbox.x" :y="bbox.y"> 
      <input @input="setTimeout(() => {mode='view'}, 2000)" @keyup.enter="mode='view'" v-model="name"/> 
    </foreignObject>
    <rect v-if="highlight" :x="bbox.x" :y="bbox.y" :height="bbox.height" :width="bbox.width" fill="#fff" fill-opacity="0.5"/>
  </g>
</template>
<script>
export default {
  name: "DiagramPort",
  props: ["id", "handlePos", "direction", "type", "subtype", "name", "nodeWidth", "nodeId", "editable"],
  data() {
    return {
      highlight: false,
      mode: "view"
    };
  },
  computed: {
    color() {
      const pallete = { flow: "white", ref: "#00aeef", value: "#3cb878", binding: "#8560a8" } 
      return (this.type === "array") ? pallete[this.subtype] : pallete[this.type] 
    },
    x() {
      return (this.direction === 'in') ? this.handlePos.x + 0 : (this.handlePos.x - 10)
    },
    y() {
      return this.handlePos.y - 9
    },
    bbox() {
      let text_width = this.$refs.text.getBBox().width
      return {
        y: this.y,
        height: 16,
        x: (this.direction === 'in') ? this.x - 1 : this.x - text_width - 3,
        width: text_width + 15
      }
    }
  },

  methods: {
    mouseup() {
      this.$emit("mouseUpPort", this.id);
    },

    enter() {
      this.highlight=true;
      this.$emit("mouseEnterPort", this.id);
    },

    leave() {
      if (this.mode =="view") this.highlight=false;
      this.$emit("mouseLeavePort", this.id);
    },

    dblclick(e) {
      if (editable) mode='edit'
      e.stopPropagation()
    },

    startDragNewLink() {
      if (this.mode == "view") this.$emit("onStartDragNewLink", this.id);
    },
  }
};
</script>
