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
      ports: {},
      variables: {},
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
  addNode(type, title, x, y, subtype="", has_expressions=false, has_bindings=false, open_ended=false, data={}, logChange=true) {
    const newNode = {
      id : this.generateId("node"), inports: [], outports: [],
      title, x, y, type, subtype, has_bindings, has_expressions, open_ended, data
    };
    this._model.nodes[newNode.id] = newNode;

    if (logChange) this.logChange()
    return newNode;
  }

  /**
   * Adds a port to a node
   * @param {Integer} node_id The node id 
   * @param {String} name Port name
   * @param {String} direction "in" or "out"
   * @param {String} type "flow", "value", "ref", "array"
   * @param {String} subtype subtype if have
   * @return {Object} The node created
   */
  addPort(node_id, name, direction, type, subtype="", logChange=true) {
    const node = this._model.nodes[node_id]
    if (!node) {
      console.log(`Unable to find node ${node_id}`, this)
      return
    }
    const newPort = {
      id : this.generateId("port"), links: [],
      node_id, name, direction, type, subtype
    }
    this._model.ports[newPort.id] = newPort;
    node[`${direction}ports`].push(newPort.id)

    if (logChange) this.logChange()
    return newPort
  }

  /**
   * Adds a link between two ports
   * @param {Integer} from   Port id. Must be an out port
   * @param {Integer} to     Port id. Must be an in port
   */
  addLink(from, to, logChange=true) {
    const fport = this.findPort(from)
    const tport = this.findPort(to)
    if (fport && tport)
    {
      const newLink = {id:this.generateId("link"), from, to}
      this._model.links[newLink.id] = newLink
      fport.links.push(newLink.id)
      tport.links.push(newLink.id)
      if (logChange) this.logChange()
      return newLink
    }
    console.log(this, `Unable to find port ${fport ? to : from}`)
  }

  delete(type, id) {
    const fname = `delete${type.replace(/^\w/, (c) => c.toUpperCase())}`
    if (this[fname]) this[fname](id)
  }

  deleteNode(node_id, logChange=true) {
    const node = this.findNode(node_id)
    if (!node) return console.log(`Node ${node_id} not found.`)
    let ports = [...node.inports]
    ports.forEach(port_id => this.deletePort(port_id, logChange=false))
    ports = [...node.outports]
    ports.forEach(port_id => this.deletePort(port_id, logChange=false))
    delete this._model.nodes[node_id]
    if (logChange) this.logChange()
  }

  deletePort(port_id, logChange=true) {
    const port = this.findPort(port_id)
    if (!port) return console.log(`Port ${port_id} not found.`)
    const links = [...port.links]
    links.forEach(link_id => this.deleteLink(link_id, logChange=false));
    delete this._model.ports[port_id]
    if (logChange) this.logChange()
  }

  deleteLink(link_id, logChange=true) {
    const link = this.findLink(link_id)
    let links = this.findPort(link.from).links
    links.splice(links.indexOf(link_id), 1)
    links = this.findPort(link.to).links
    links.splice(links.indexOf(link_id), 1)
    delete this._model.links[link_id]
    if (logChange) this.logChange()
  }

  constructNode(schema) {
    // Create nodes and port from a schema
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

    // Must be one in and one out
    let from = this.findPort(id1)
    let to = this.findPort(id2)
    if (from.direction === to.direction) return false
    if (from.direction != "out") { let x = from; from = to; to = x }
    
    // Flow: single out / multiple in 
    // Other: multiple out / single in
    if (from.type == 'flow' && from.links.length > 0) return false
    if (from.type != 'flow' && to.links.length > 0) return false

    // Only to can be binding, binding can connect to everything except flow
    if (from.type == 'binding') return false
    if (to.type == 'binding') return from.type != 'flow'

    // Other than binding, in and out must match both type and subtype
    return from.type == to.type && from.subtype == to.subtype
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
      return delta
    } 
  }

  redo() {
    if (this.redos.length > 0) {
      const delta = this.redos.pop()
      jsondiffpatch.patch(this._model, delta)
      jsondiffpatch.patch(this.old, delta)
      this.undos.push(delta)
      return delta
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
