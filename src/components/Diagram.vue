<template>
  <div tabindex="-1" @keyup.ctrl.z.exact="undo" @keyup.ctrl.shift.z.exact="redo" @keyup.delete="deleteSelected">
    <SvgPanZoom
        :style="{ width: width + 'px', height: height + 'px', border:'1px solid black'}"
        :zoomEnabled="zoomEnabled"
        id="svgroot"
        xmlns="http://www.w3.org/2000/svg"
        :panEnabled="panEnabled"
        :controlIconsEnabled="true"
        minZoom="0.6" maxZoom="1.2"
        :fit="false"
        :center="true"
        :dblClickZoomEnabled="false"
        viewportSelector="#svgroot2"
        :preventMouseEventsDefault="false"
        :beforePan="beforePan">
      <svg
        id="svgroot2"
        version="1.1"
        xmlns="http://www.w3.org/2000/svg"
        :viewBox="'0 0 ' + width + ' ' + height"
        :width="width"
        :height="height"
        preserveAspectRatio="xMinYMin meet"
        class="svg-content"
        ref="dragramRoot"
        @mousemove="mouseMove"
        @mouseup="mouseUp">
        <defs>
          <pattern id="smallGrid" :width="gridSnap" :height="gridSnap" patternUnits="userSpaceOnUse">
            <path :d="`M ${gridSnap} 0 L 0 0 0 ${gridSnap}`" fill="none" stroke="gray" stroke-width="0.5"/>
          </pattern>
          <pattern id="grid" :width="gridSnap*5" :height="gridSnap*5" patternUnits="userSpaceOnUse">
            <rect :width="gridSnap*5" :height="gridSnap*5" fill="url(#smallGrid)"/>
            <path :d="`M ${gridSnap*5} 0 L 0 0 0 ${gridSnap*5}`" fill="none" stroke="gray" stroke-width="1"/>
          </pattern>
          <linearGradient id="HighlightEffect" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
            <stop offset="0%" style="stop-color:rgb(255,255,255); stop-opacity:0" />
            <stop offset="50%" style="stop-color:rgb(255,255,255); stop-opacity:0.5" />
            <stop offset="100%" style="stop-color:rgb(255,255,255); stop-opacity:0" />
          </linearGradient>

        </defs>
        <filter id="NodeEffect" filterUnits="objectBoundingBox" x="-10%" y="-10%" width="150%" height="150%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="5" result="blur"/>
          <feOffset in="blur" dx="4" dy="4" result="offsetBlur"/>
          <feSpecularLighting in="offsetBlur" surfaceScale="5" specularConstant=".75" specularExponent="20" lighting-color="#000" result="specOut">
            <fePointLight x="-5000" y="-10000" z="20000"/>
          </feSpecularLighting>
          <feComposite in="specOut" in2="SourceAlpha" operator="in" result="specOut2"/>
          <feComposite in="SourceGraphic" in2="specOut2" operator="arithmetic" k1="0" k2="1" k3="1" k4="0" result="litPaint" />
          <feMerge>
            <feMergeNode in="offsetBlur"/>
            <feMergeNode in="litPaint"/>
          </feMerge>
        </filter>

        <rect x="-5000px" y="-5000px" width="10000px" height="10000px" fill="url(#grid)" @mousedown="clearSelection" ref="grid" class="svg-pan-zoom_viewport"/>
        <g ref="viewPort" id="viewport" x="0" y="0">
          <DiagramLink
            :ref="'link-' + link.id"
            :positionFrom="getPortHandlePosition(link.from)"
            :positionTo="getPortHandlePosition(link.to)"
            @select="select"
            :selected="selectedItem.type === 'link' && selectedItem.id === link.id"
            :type="model.findPort(link.to).type"
            :id="link.id"
            v-for="link in model.getLinks()"
            :key="'link-' + link.id"
          />
          <path :d="newLinkPath" :stroke="newLinkStroke" stroke-width="3" fill="none" v-if="newLink"/>
          <DiagramNode
            :ref="'node-' + node.id"
            :title="node.title"
            :x="node.x"
            :y="node.y"
            :width="node.width"
            :height="node.height"
            :type="node.type"
            :subtype="node.subtype"
            :has_bindings="node.has_bindings"
            :has_expressions="node.has_expressions"
            :expression="node.data.expression"
            :open_ended="node.open_ended"
            :selected="selectedItem.type === 'node' && selectedItem.id === node.id"
            :id="node.id"
            v-for="node in model.getNodes()"
            :key="'node-' + node.id"
            @addBinding="addBinding"
            @onStartDrag="startDragItem"
            @delete="model.deleteNode(node)"
          >
            <DiagramPort
              v-for="port in model.getPorts(port => port.node_id == node.id)"
              :model="model"
              :key="'port-' + port.id"
              :ref="'port-' + port.id"
              :id="port.id"
              :nodeId="node.id"
              :handlePos="getPortHandlePosition(port.id, relative=true)"
              :connected="port.links.length > 0"
              :nodeWidth="node.width"
              :type="port.type"
              :direction="port.direction"
              :name="port.name"
              :value="port.value"
              :options="port.options"
              @onStartDragNewLink="startDragNewLink"
              @mouseUpPort="mouseUpPort"
              @mouseEnterPort="mouseEnterPort"
              @mouseLeavePort="mouseLeavePort"
              @portRename="portRename"
              @portValueUpdate="portValueUpdate"
            />
          </DiagramNode>
        </g>
      </svg>
    </SvgPanZoom>

  </div>
</template>
<script>
import SvgPanZoom from "vue-svg-pan-zoom";

import DiagramModel from "./../DiagramModel";
import DiagramNode from "./DiagramNode";
import DiagramLink from "./DiagramLink";
import DiagramPort from "./DiagramPort";

import { curve } from "../SVGUtils";

var generateId = function() {
  return Math.trunc(Math.random() * 1000);
};

function getAbsoluteXY(element) {
  var viewportElement = document.documentElement;
  var box = element.getBoundingClientRect();
  var scrollLeft = viewportElement.scrollLeft;
  var scrollTop = viewportElement.scrollTop;
  var x = box.left + scrollLeft;
  var y = box.top + scrollTop;
  return { x: x, y: y };
}

function snapToGrip(val, gridSize) {
  return gridSize * Math.round(val / gridSize);
}

export default {
  name: "Diagram",
  Model: DiagramModel,

  props: {
    model: {
      required: true
    },
    width: {
      default: 500
    },
    height: {
      default: 500
    },
    gridSnap: {
      default: 18
    }
  },

  data() {
    return {
      document,
      zoomEnabled: true,
      panEnabled: true,
      draggedItem: undefined,
      selectedItem: {},
      initialDragX: 0,
      initialDragY: 0,
      newLink: undefined,
      newLinkStroke: "black",
      mouseX: 0,
      mouseY: 0
    };
  },
  components: { DiagramNode, DiagramLink, DiagramPort, SvgPanZoom },

  methods: {
    portRename() {},

    portValueUpdate() {},

    convertXYtoViewPort(x, y) {
      let rootelt = document.getElementById("svgroot2");
      let rec = document.getElementById("viewport");
      let point = rootelt.createSVGPoint();
      let rooteltPosition = getAbsoluteXY(rootelt);
      point.x = x - rooteltPosition.x;
      point.y = y - rooteltPosition.y;
      let ctm = rec.getCTM().inverse();
      return point.matrixTransform(ctm);
    },
    beforePan() {
      if (this.selectedItem.type || this.draggedItem || this.newLink)
        return false;
      else return true;
    },

    clearSelection() {
      this.selectedItem = {};
    },

    startDragNewLink(startPortId) {
      this.panEnabled = false;
      this.newLink = {
        startPortId
      };
    },

    getPortHandlePosition(portId, relative = false) {
      const port = this.model.findPort(portId);
      if (port) {
        const node = this.model.findNode(port.node_id);
        const index = node[`${port.direction}ports`].indexOf(port.id);

        const pos = {
          x: port.direction === "in" ? 10 : node.width - 1,
          y: index * 36 + (node.has_expressions ? 72 : 0) + 36 + 4 + 36 / 2
        };
        if (relative) return pos;
        else return { x: pos.x + node.x, y: pos.y + node.y };
      } else {
        console.warn(
          `port "${portId}" not found. you must call this method after the first render`
        );
        return 0;
      }
    },

    autoFit(node) {
      var lwidth = 0;
      node.inports.forEach(pid => {
        lwidth = Math.max(
          lwidth,
          this.$refs[`port-${pid}`][0].$el.getBBox().width
        );
      });
      var rwidth = 0;
      node.outports.forEach(pid => {
        rwidth = Math.max(
          rwidth,
          this.$refs[`port-${pid}`][0].$el.getBBox().width
        );
      });
      const minwidth =
        80 + (node.has_bindings ? 120 : 0) + (node.open_ended ? 180 : 0);
      node.width =
        snapToGrip(
          Math.max(
            this.$refs[`node-${node.id}`][0].getTextWidth() + 10,
            lwidth + rwidth + 30,
            minwidth
          ),
          this.gridSnap
        ) + this.gridSnap;
      node.height =
        32 +
        4 + //Titlebar
        (node.has_expressions ? 72 : 0) + //Expression
        Math.max(node.inports.length, node.outports.length) * 36 + //Nodes
        (node.has_bindings || node.open_ended ? 36 : 0);
      // Auto fit to grid
      node.x = snapToGrip(node.x, this.gridSnap) - 4;
      node.y = snapToGrip(node.y, this.gridSnap) - 4;
    },

    mouseMove(pos) {
      this.mouseX = pos.x;
      this.mouseY = pos.y;
      if (this.draggedItem) {
        let coords = this.convertXYtoViewPort(this.mouseX, this.mouseY);
        const obj = this.model.findBy(
          this.draggedItem.type,
          this.draggedItem.id
        );
        obj.x = snapToGrip(coords.x - this.initialDragX, this.gridSnap) - 4;
        obj.y = snapToGrip(coords.y - this.initialDragY, this.gridSnap) - 4;
      }
    },

    mouseUp() {
      this.draggedItem = undefined;
      this.newLink = undefined;
      this.model.logChange();
    },

    mouseEnterPort(portId) {
      if (this.newLink !== undefined) {
        let port1 = this.$refs[`port-${this.newLink.startPortId}`][0];
        let port2 = this.$refs[`port-${portId}`][0];
        this.newLinkStroke = this.model.canConnect(port1.id, port2.id)
          ? "green"
          : "red";
      }
    },

    mouseLeavePort(portId) {
      this.newLinkStroke = "black";
    },

    mouseUpPort(portId) {
      if (this.newLink !== undefined) {
        let port1 = this.$refs[`port-${this.newLink.startPortId}`][0];
        let port2 = this.$refs[`port-${portId}`][0];

        if (this.model.canConnect(port1.id, port2.id)) {
          if (port1.direction === "in") this.model.addLink(port2.id, port1.id);
          else this.model.addLink(port1.id, port2.id);
        }
      }
    },

    startDragItem(item, x, y) {
      this.panEnabled = false;
      this.draggedItem = item;
      this.selectedItem = item;
      // TODO: need to get calculate pan and zoom level
      const cords = this.convertXYtoViewPort(x, y);
      this.initialDragX = cords.x - item.x;
      this.initialDragY = cords.y - item.y;
    },

    async addBinding(node_id) {
      this.model.addPort(node_id, "New Binding", "in", "binding");
      setTimeout(() => {
        this.$forceUpdate();
      }, 100);
      await this.$nextTick();
      this.autoFit(this.model.findNode(node_id));
    },

    select(item) {
      console.log("xxxxxxxxxxx");
      this.selectedItem = item;
    },

    async undo(e) {
      const delta = this.model.undo();
      console.log("Undo", JSON.stringify(delta));
      if (delta.nodes) {
        setTimeout(() => {
          this.$forceUpdate();
        }, 100);
        await this.$nextTick();
        Object.keys(delta.nodes).forEach(node_id =>
          this.autoFit(this.model.findNode(node_id))
        );
      }
    },

    async redo(e) {
      const delta = this.model.redo();
      console.log("Undo", JSON.stringify(delta));
      if (delta && delta.nodes) {
        setTimeout(() => {
          this.$forceUpdate();
        }, 100);
        await this.$nextTick();
        Object.keys(delta.nodes).forEach(node_id => {
          this.autoFit(this.model.findNode(node_id));
        });
      }
    },

    deleteSelected(e) {
      if (this.selectedItem) {
        this.model.delete(this.selectedItem.type, this.selectedItem.id);
      }
    }
  },
  computed: {
    newLinkPath() {
      let start = this.getPortHandlePosition(this.newLink.startPortId);
      let end = this.convertXYtoViewPort(this.mouseX, this.mouseY);
      const port = this.model.findPort(this.newLink.startPortId);
      if (port.direction === "out")
        return curve(start.x, start.y, end.x, end.y);
      else return curve(end.x, end.y, start.x, start.y);
    }
  },

  mounted() {
    this.$nextTick(() => {
      this.model.getNodes().forEach(node => {
        this.autoFit(node);
      });
    });
  },

  watch: {
    // "model._model": function() {
    //   this.model.getNodes().forEach(node => {
    //     this.autoFit(node)
    //   })
    // }

    "model._model": {
      deep: true,
      handler() {
        console.log("model._model change");
        this.model.getNodes().forEach(node => {
          this.autoFit(node);
        });
      }
    }
  }
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
  svg{
    user-select: none;
    font-family: "Helvetica";
    /* font-family: "Segoe UI"; */
  }
</style>
