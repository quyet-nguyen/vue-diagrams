import { storiesOf } from "@storybook/vue";
import Diagram from "../src/components/Diagram";

// Add more stories here to live develop your components
storiesOf("Diagram", module).add("serialization/deserialization", () => ({
  data() {
    const diagramModel = new Diagram.Model();

    const node1 = diagramModel.addNode("trigger", "test2", 300, 200);
    const inPort = diagramModel.addPort(node1.id, "test", "in", "flow");
    diagramModel.addPort(node1.id, "testin2", "in", "ref");

    const node2 = diagramModel.addNode("trigger", "test", 10, 300, 144, 80);
    const node2OutPort = diagramModel.addPort(node2.id, "testOut", "out", "flow");
    diagramModel.addPort(node2.id, "test", "in", "flow");
    diagramModel.addPort(node2.id, "testOut2", "out", "ref");

    const node3 = diagramModel.addNode("trigger", "test3", 10, 100, 72, 100);
    const node3OutPort = diagramModel.addPort(node3.id, "testOut3", "out", "flow");

    diagramModel.addLink(node2OutPort.id, inPort.id);
    diagramModel.addLink(node3OutPort.id, inPort.id);

    const node4 = diagramModel.addNode("flow", "For", 200, 200, 200, 120);
    diagramModel.addPort(node4.id, "", "in", "flow");
    diagramModel.addPort(node4.id, "Loop", "out", "flow");
    diagramModel.addPort(node4.id, "Array", "in", "array", "ref");
    diagramModel.addPort(node4.id, "Key", "out", "value");
    diagramModel.addPort(node4.id, "Value", "out", "ref");
    diagramModel.addPort(node4.id, "Complete", "out", "flow");


    return {
      console,
      serializedModel: diagramModel.serialize(),
      model: diagramModel
    };
  },
  template: `<div>
    <diagram :model="model" width="1200" height="600"></diagram>
    <button @click="console.log(model.serialize())">serialize</button>
    <button @click="model.deserialize(serializedModel)">deserialize</button>
  </div>`
}));
