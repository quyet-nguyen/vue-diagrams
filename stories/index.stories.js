import { storiesOf } from "@storybook/vue";
import Diagram from "../src/components/Diagram";

// Add more stories here to live develop your components
storiesOf("Diagram", module).add("Simple diagram", () => ({
  data() {
    const diagramModel = new Diagram.Model();

    const node1 = diagramModel.addNode("trigger", "test2", 300, 200);
    const inPort = diagramModel.addPort(node1.id, "test", "in", "flow");

    const node2 = diagramModel.addNode("action", "test", 10, 300, 144, 80);
    const node2OutPort = diagramModel.addPort(node2.id, "testOut", "out", "flow");
    const node2OutPort2 = diagramModel.addPort(node2.id, "testOut2", "out", "flow");
    node2.color = "#00cc66";

    const node3 = diagramModel.addNode("action", "test3", 10, 100, 72, 100);
    const node3OutPort = diagramModel.addPort(node3.id, "testOut3", "out", "flow");
    node3.color = "#cc6600";
    node3.deletable = false;

    diagramModel.addLink(node2OutPort.id, inPort.id);
    diagramModel.addLink(node3OutPort.id, inPort.id);

    return {
      model: diagramModel
    };
  },
  template: `<diagram :model="model" width="1200" height="800"></diagram>`
}));
