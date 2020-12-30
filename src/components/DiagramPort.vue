<template>
  <g @mouseenter="enter" @mouseleave="leave" @mousedown="startDragNewLink" @mouseup="mouseup" @dblclick="dblclick">

    <rect v-if="mode=='view' && highlight" :x="this.$el.getBBox().x" :y="this.$el.getBBox().y" :height="18*slots" :width="this.$el.getBBox().width" fill="url(#HighlightEffect)"/>

    <g ref="main">

      <svg :x="x-1" :y="y" >
      
        <polygon v-if="type === 'flow'" 
          points="3,1 3,15 13,9" :fill="connected ? color : 'none'" :stroke="color" stroke-width="2" stroke-linejoin="round" />
  
        <g v-else-if="type === 'array'">
          <rect v-for="i in [0,1,2,3,5,6,7,8]" :key="i" :x="1 + (i % 3)*5" :y="1 + Math.floor(i / 3)*5" width="3" height="3" :fill="color"/>
          <rect v-if="connected" x="6" y="6" width="3" height="3" :fill="color"/>
        </g>

        <circle v-else r="7" cx="8" cy="8" :fill="connected ? color : 'none'" :stroke="color" stroke-width="2" stroke-linejoin="round" />

      </svg>

      <text ref="name" fill="white" font-size="10pt" 
        v-show="mode == 'view'"
        :x="direction == 'in' ? x + 20 : x - 7" 
        :y="slots == 1 ? y + 13 : y + 4 "
        :text-anchor="direction == 'in' ? 'start' : 'end'">
        {{subtype ? `[${subtype}] ` : "" + name}}
      </text>
      <foreignObject v-if="mode=='edit'" :width="$refs.name.getBBox().width+20" :height="36" :x="$refs.name.getBBox().x + (direction == 'in' ? 1 : -21)"  :y="slots == 1 ? y : y - 9 "> 
        <span ref="name_input" contentEditable="true" 
          :class="`input input-name ${direction == 'in' ? 'left' : 'right'}`" 
          @keydown.enter="rename($event.target.innerText.trim())" 
          @keyup.escape="mode='view'" @blur="mode='view'">{{name}}</span> 
      </foreignObject>

      <foreignObject v-if="type == 'value' && direction == 'in' && !connected" :width="width()" :height="20" :x="x + 20" :y="y + 8">
        <input v-if="!options" ref="value" :value="value" placeholder="value"
          @input="setPortValue($event.target.value)" 
          v-autowidth="{maxWidth: `${width()}px`, minWidth: '20px', comfortZone: 0}" />
        <v-select v-else ref="value" :options="options" @input="setPortValue" :value="value"/>
      </foreignObject> 
    </g>
  </g>
</template>
<script>
import vSelect from 'vue-select'

export default {
  name: "DiagramPort",
  components: {vSelect},
  props: ["model", "id", "handlePos", "direction", "type", "subtype", "name", "value", "nodeWidth", "nodeId", "connected", "options"],
  data() {
    return {
      highlight: false,
      mode: "view",
      timeout: null
    };
  },
  computed: {
    color() {
      const pallete = { flow: "white", ref: "#00aeef", value: "#3cb878", binding: "#8560a8" } 
      const color = (this.type === "array") ? pallete[this.subtype.split(".")[0]] : pallete[this.type] 
      return color ? color : "#666"
    },
    x() {
      return (this.direction === 'in') ? this.handlePos.x + 0 : (this.handlePos.x - 14)
    },
    y() {
      return this.handlePos.y - 9
    },
    editable() {
      return this.type == "binding"
    },
    slots() {
      if (this.can_change_subtype) return 2
      if (this.type == "value" && this.direction == "in" && !this.connected) return 2
      return 1
    }
  },

  methods: {
    
    width() {
      let w = 50; //min
      if (this.$refs.name) w = Math.max(w, this.$refs.name.getBBox().width + 20)
      if (this.$refs.value) w = Math.max(w, this.$refs.value.getBoundingClientRect().width + 20)
      return w
    },

    mouseup() {
      this.$emit("mouseUpPort", this.id);
    },

    enter() {
      this.highlight=true;
      this.$emit("mouseEnterPort", this.id);
    },

    leave() {
      this.highlight=false;
      this.$emit("mouseLeavePort", this.id);
    },

    dblclick(e) {
      if (this.editable || true) {
        this.mode='edit'
        this.$nextTick(() => {
          this.$refs.name_input.focus();
		    });   
      }
    },

    startDragNewLink() {
      if (this.mode == "view") this.$emit("onStartDragNewLink", this.id)
    },

    rename(e) {
      const port = this.model.findPort(this.id)
      if (port) {
        port.name = e
        this.$emit("portRename", this.id, e)
        this.mode='view'
      } else console.log(`Port ${port_id} not found.`)
    },

    setPortValue(e) {
      const port = this.model.findPort(this.id)
      if (port) {
        port.value = e
        this.$emit("portValueUpdate", this.id, this.e)
      } else console.log(`Port ${port_id} not found.`)      
    }
  }
};
</script>

<style scoped>

.input.input-name {
  overflow: hidden;
  white-space: nowrap;
  display: block;
  font-family: "Helvetica";
  color: white;
  font-size: 10pt;
}

.input.right {
  text-align: right;
}

</style>
