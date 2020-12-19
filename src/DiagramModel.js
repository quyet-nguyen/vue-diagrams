var jsondiffpatch = require('jsondiffpatch').create({
  objectHash: function(obj) {
      return obj.id;
  },
  arrays: {
    // default true, detect items moved inside the array (otherwise they will be registered as remove+add)
    detectMove: true,
    // default false, the value of items moved is not included in deltas
    includeValueOnMove: false
  },
  propertyFilter: function(name, conext) {
    return !name.startsWith("_")
  },
  cloneDiffValues: true
});

/**
 * @class DiagramModel
 */
class DiagramModel {
  /**
   */
  constructor() {
    this._model = {
      nodes: {},
      links: {},
      ports: {}
    };
    this.old = JSON.parse(JSON.stringify(this._model), jsondiffpatch.dateReviver);
    this.node_count = 0
    this.link_count = 0
    this.port_count = 0
    this.undos = []
    this.redos = []
  }

  generateId(type) {
    return this[`${type}_count`]++;
  };
  
  /**
   * Adds a node to the diagram
   * @param {String} type  Node's type
   * @param {String} title  The title of the node
   * @param {Integer} x      X coordinate
   * @param {Integer} y      Y Coordinate
   * @param {Integer} width  Width
   * @param {Integer} height Height
   * @param {String} subtype  Node subtype
   * @param {Boolean} has_expressions  Has expression field
   * @param {Boolean} has_bindings  Can add new input ports
   * @param {Boolean} open_ended  Can add new output ports
   * @param {Object} data Custom data
   * @return {Node} The node created
   */
  addNode(type, title, x, y, width, height, subtype="", has_expressions=false, has_bindings=false, open_ended=false, data={}) {
    const newNode = {
      id : this.generateId("node"), inports: [], outports: [],
      title, x, y, width, height, type, subtype, has_bindings, has_expressions, open_ended, data
    };
    this._model.nodes[newNode.id] = newNode;

    this.logChange()
    return newNode;
  }

  /**
   * Adds a port to a node
   * @param {Integer} node_id The node id 
   * @param {String} name Port name
   * @param {String} direction "in" or "out"
   * @param {String} type "flow", "value", "reference", "array"
   * @param {String} subtype subtype if have
   * @return {Object} The node created
   */
  addPort(node_id, name, direction, type, subtype="") {
    const node = this._model.nodes[node_id]
    if (!node) {
      console.log(`Unable to find node ${node_id}`, this)
      return
    }
    const newPort = {
      id : this.generateId("port"),
      node_id, name, direction, type, subtype
    }
    this._model.ports[newPort.id] = newPort;
    node[`${direction}ports`].push(newPort.id)

    this.logChange()
    return newPort
  }

  /**
   * Adds a link between two ports
   * @param {Integer} from   Port id. Must be an out port
   * @param {Integer} to     Port id. Must be an in port
   */
  addLink(from, to) {
    const newLink = {id:this.generateId("link"), from, to}
    this._model.links[newLink.id] = newLink
    this.logChange()
    return newLink
  }

  deleteNode(node_id) {
    node = this.findNode(node_id)
    node.inports.forEach(port_id => this.deletePort(port_id));
    delete this._model.nodes[node_id]
    this.logChange()
  }

  deletePort(port_id) {
    delete this._model.ports[port_id]
    this.getLinks(link => {link.from == port_id || link.to == port_id }).forEach(link => this.deleteLink(link.id) )
    this.logChange()
  }

  deleteLink(link_id) {
    delete this._model.links[link_id]
    this.logChange()
  }

  getNodes(filters) {
    if (filters) return Object.values(this._model.nodes).filter(filters)
    return Object.values(this._model.nodes)
  }

  getPorts(filters) {
    if (filters) return Object.values(this._model.ports).filter(filters)
    return Object.values(this._model.ports)
  }

  getLinks(filters) {
    if (filters) return Object.values(this._model.links).filter(links)
    return Object.values(this._model.links)
  }

  findBy(type, id) { return this._model[`${type}s`][id.toString()] }
  findPort(id) { return this.findBy('port', id) }
  findNode(id) { return this.findBy('node', id) }
  findLink(id) { return this.findBy('link', id) }

  canConnect(id1, id2) {
    let port1 = this.findPort(id1)
    let port2 = this.findPort(id2)

    if (port1.direction === port2.direction) return false
    if (port1.direction != "in") {
      let x = port1
      port1 = port2
      port2 = x
    }
    // TODO: Check more
    // Flow can't have multiple outs
    // 
    return true
  }

  logChange() {
    const delta = jsondiffpatch.diff(this.old, this._model)
    console.log(JSON.stringify(delta))
    if (delta) {
      jsondiffpatch.patch(this.old, delta)
      this.undos.push(delta);
      this.redos.length = 0
    }
  }

  undo() {
    if (this.undos.length > 0) {
      const delta = this.undos.pop()
      jsondiffpatch.unpatch(this._model, delta)
      jsondiffpatch.unpatch(this.old, delta)
      this.redos.push(delta)
    } 
  }

  redo() {
    if (this.redos.length > 0) {
      const delta = this.redos.pop()
      jsondiffpatch.patch(this._model, delta)
      jsondiffpatch.patch(this.old, delta)
      this.undos.push(delta)
    }    
  }

  /**
   * Serializes the diagram model into a JSON object
   * @return {Object} The diagram model
   */
  serialize() {
    return JSON.stringify(this._model, (key, val) => { return key.startsWith("_") ? null : val});
  }

  /**
   * Load into the diagram model a serialized diagram
   * @param  {Object} serializedModel
   */
  deserialize(serializedModel) {
    this._model = JSON.parse(serializedModel);
    this.old = JSON.parse(serializedModel);
    this.node_count = Object.keys(this._model.nodes).reduce((i, max) => {return i > max ? i : max}, -1) + 1 
    this.port_count = Object.keys(this._model.ports).reduce((i, max) => {return i > max ? i : max}, -1) + 1
    this.link_count = Object.keys(this._model.links).reduce((i, max) => {return i > max ? i : max}, -1) + 1
    this.undos = []
    this.redos = []
  }

}

export default DiagramModel;
