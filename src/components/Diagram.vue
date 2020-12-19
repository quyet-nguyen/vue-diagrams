<template>
  <div tabindex="-1" @keyup.ctrl.z.exact="undo" @keyup.ctrl.shift.z.exact="redo" >
   <SvgPanZoom
      :style="{ width: width + 'px', height: height + 'px', border:'1px solid black'}"
      xmlns="http://www.w3.org/2000/svg"
      :zoomEnabled="zoomEnabled"
      id="svgroot"
      :panEnabled="panEnabled"
      :controlIconsEnabled="true"
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
        <pattern id="smallGrid" width="16" height="16" patternUnits="userSpaceOnUse">
          <path d="M 16 0 L 0 0 0 16" fill="none" stroke="gray" stroke-width="0.5"/>
        </pattern>
        <pattern id="grid" width="80" height="80" patternUnits="userSpaceOnUse">
          <rect width="80" height="80" fill="url(#smallGrid)"/>
          <path d="M 80 0 L 0 0 0 80" fill="none" stroke="gray" stroke-width="1"/>
        </pattern>
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
      <g ref="viewPort" id="viewport" x="50" y="50">
        <DiagramLink
          :ref="'link-' + link.id"
          :positionFrom="getPortHandlePosition(link.from)"
          :positionTo="getPortHandlePosition(link.to)"
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
          :deletable="node.deletable"
          :selected="selectedItem.type === 'node' && selectedItem.id === node.id"
          :id="node.id"
          v-for="node in model.getNodes()"
          :key="'node-' + node.id"
          @onStartDrag="startDragItem"
          @delete="model.deleteNode(node)"
        >
          <DiagramPort
            v-for="port in model.getPorts(port => port.node_id == node.id)"
            :key="'port-' + port.id"
            :ref="'port-' + port.id"
            :id="port.id"
            :nodeId="node.id"
            :handlePos="getPortHandlePosition(port.id, relative=true)"
            :nodeWidth="node.width"
            :type="port.type"
            :direction="port.direction"
            :name="port.name"
            :editable="port.editable"
            @onStartDragNewLink="startDragNewLink"
            @mouseUpPort="mouseUpPort"
            @mouseEnterPort="mouseEnterPort"
            @mouseLeavePort="mouseLeavePort"
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

import {curve} from "../SVGUtils"

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
      default: 1
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
  components: {
    DiagramNode,
    DiagramLink,
    DiagramPort,
    SvgPanZoom
  },

  methods: {
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

    getPortHandlePosition(portId, relative=false) {
      const port = this.model.findPort(portId)
      if (port) {
        const node = this.model.findNode(port.node_id)
        const index = node[`${port.direction}ports`].indexOf(port.id)
        
        const pos = { 
          x: port.direction === "in" ? 10 : node.width - 1, 
          y: index*20 + 65 
        };
        if (relative) return pos
        else return {x: pos.x + node.x, y: pos.y + node.y}

      } else {
        console.warn(
          `port "${portId}" not found. you must call this method after the first render`
        );
        return 0;
      }
    },

    mouseMove(pos) {
      this.mouseX = pos.x;
      this.mouseY = pos.y;
      if (this.draggedItem) {
        let coords = this.convertXYtoViewPort(this.mouseX, this.mouseY);
        coords.x = snapToGrip(coords.x, this.gridSnap) - this.gridSnap / 2;
        coords.y = snapToGrip(coords.y, this.gridSnap);

        const obj = this.model.findBy(this.draggedItem.type, this.draggedItem.id) 
        obj.x = coords.x - this.initialDragX;
        obj.y = coords.y - this.initialDragY;
      }
    },

    mouseUp() {
      this.draggedItem = undefined;
      this.newLink = undefined;
      this.model.logChange()
    },

    mouseEnterPort(portId) {
      if (this.newLink !== undefined) {
        let port1 = this.$refs[`port-${this.newLink.startPortId}`][0]
        let port2 = this.$refs[`port-${portId}`][0]
        this.newLinkStroke = this.model.canConnect(port1.id, port2.id) ? "green" : "red"
      }
    },

    mouseLeavePort(portId) {
      this.newLinkStroke="black"
    },

    mouseUpPort(portId) {
      if (this.newLink !== undefined) {

        let port1 = this.$refs[`port-${this.newLink.startPortId}`][0]
        let port2 = this.$refs[`port-${portId}`][0]

        if (this.model.canConnect(port1.id, port2.id)) {
          if (port1.direction === "in") this.model.addLink(port2.id, port1.id)
          else this.model.addLink(port1.id, port2.id)
        }
      }
    },

    startDragItem(item, x, y) {
      this.panEnabled = false;
      this.draggedItem = item;
      this.selectedItem = item;
      this.initialDragX = x;
      this.initialDragY = y;
    },

    handleKeyPressed(e) {
      console.log(e)
    },

    undo(e) {
      console.log("Undo")
      this.model.undo()
    },
    
    redo(e) {
      console.log("Redo")
      this.model.redo()
    }
  },
  computed: {
    newLinkPath() {
      let start = this.getPortHandlePosition(this.newLink.startPortId)
      let end = this.convertXYtoViewPort(this.mouseX, this.mouseY)
      return curve(start.x, start.y, end.x, end.y)
    },
    


  },

};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
  svg{
    user-select: none;
    /* font-family: "Helvetica"; */
    font-family: "Segoe UI";
  }
</style>
