<template>
  <div style="padding: 40px">
    <button @click="openAdding=true">add_node</button>
    <button @click="serialize">serialize</button>
    <button @click="model.deserialize(origin)">deserialize</button>
    <button @click="saveData">save</button>
    <button @click="model.deserialize(model.serialize())">reactivity</button>
    
    <br/><br/>
    <div v-if="openAdding">
      <form  @submit.prevent="submit">

        <label for="country">Type</label>
        <select v-model="type" @input="() => {subtype = ''; inports = []; outports = []}"> 
          <option v-for="(val, id) in Object.keys(settings)" :key="id" :value="val" >{{val}}</option>
        </select>
        <br/><br/>

        <label for="country">Title</label>
        <input type="text" v-model="title"/> 
        <br/><br/>

        <label for="country">Sub Type</label>
        <select v-model="subtype" @input="() => {inports = []; outports = []}"> 
          <option v-for="(val, id) in (settings[type] ? settings[type] : []) " :key="id" :value="val" >{{val}}</option>
        </select>
        <br/><br/>

        <label for="country">In Port</label>
        <div v-for="(inport, id) in full_node.input" :key="id">
          <input type="checkbox" :value="inport" :id="id" v-model="inports">
          <label for="jack">{{inport.name ? inport.name : inport.type}}</label>
        </div>
        <br/><br/>


       <label for="country">Out Port</label>
        <div v-for="(outport, id) in full_node.output" :key="id">
          <input type="checkbox" :value="outport" :id="id" v-model="outports">
          <label for="jack">{{outport.name ? outport.name : outport.type}}</label>
        </div>
        <br/><br/>


        <div v-if="full_node.has_expressions">
          <label for="country">Expression</label>
          <input type="text" v-model="expression"/> 
        </div>
        <br/><br/>
    
        <input type="submit" value="Submit">
      </form>
    </div>

    {{event}}
  </div>
</template>
<script>
import axios from "axios";
export default {
  props: ["model", "origin"],
  data() {
    return {
      openAdding: false,
      settings: {},
      type: "",
      subtype: "",
      title: "",
      expression: "",
      inports: [],
      outports: [],
      current_node: {},
      full_node: {},
      pre_model: {},
      content_rule_id: 4
    };
  },
  computed: {
    event() {
      if (this.subtype && this.type) {
        // console.log(this.type, this.title, 824, 12, this.subtype)
        axios
          .get(
            `https://demo.eaera.com/blueprints/${
              this.content_rule_id
            }/add_node?type=${this.type}&subtype=${this.subtype}`
          )
          .then(res => {
            this.full_node = res.data;
          });
      }
    }
  },

  methods: {
    submit() {
      console.log(this.inports);
      console.log(this.outports);
      if (this.subtype && this.type) {
        let data = {};
        if (this.full_node.has_expressions) data.expression = this.expression;
        // addNode(type, title, x, y, subtype="", has_expressions=false, has_bindings=false, open_ended=false, data={}, logChange=true)
        this.current_node = this.model.addNode(
          this.type,
          this.title,
          824,
          12,
          this.subtype,
          this.full_node.has_expressions,
          this.full_node.has_bindings,
          this.full_node.open_ended,
          data
        );
      }

      // addPort(node_id, name, direction, type, subtype="", logChange=true)
      this.inports.forEach(x => {
        this.model.addPort(
          this.current_node.id,
          x.name,
          "in",
          x.type.split(".")[0],
          x.type
        );
      });
      this.outports.forEach(x => {
        this.model.addPort(
          this.current_node.id,
          x.name,
          "out",
          x.type.split(".")[0],
          x.type
        );
      });

      this.model.deserialize(this.model.serialize());
    },

    saveData() {
      axios
        .patch("https://demo.eaera.com/blueprints/" + this.content_rule_id, {
          blueprint: JSON.parse(this.model.serialize())
        })
        .then(res => {
          console.log("Ok");
        });
    },

    serialize() {
      console.log(this.model.serialize());
    }
  },
  mounted() {
    axios
      .get(
        "https://demo.eaera.com/blueprints/" +
          this.content_rule_id +
          "/get_setting"
      )
      .then(res => {
        this.settings = res.data;
      });

    axios
      .get("https://demo.eaera.com/blueprints/" + this.content_rule_id)
      .then(res => {
        this.current_node = JSON.stringify(
          res.data.blueprint.ports
            ? res.data.blueprint
            : { ports: {}, links: {}, nodes: {} }
        );
        this.model.deserialize(this.current_node);
      });
  }
};
</script>