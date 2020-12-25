import { storiesOf } from "@storybook/vue";
import Diagram from "../src/components/Diagram";

// Add more stories here to live develop your components
storiesOf("Diagram", module).add("serialization/deserialization", () => ({
  data() {
    const diagramModel = new Diagram.Model();

    // const node1 = diagramModel.addNode("trigger", "test2", 300, 200);
    // const inPort = diagramModel.addPort(node1.id, "test", "in", "flow");
    // diagramModel.addPort(node1.id, "testin2", "in", "ref");

    // const node2 = diagramModel.addNode("trigger", "test", 10, 300, 144, 80);
    // const node2OutPort = diagramModel.addPort(node2.id, "testOut", "out", "flow");
    // diagramModel.addPort(node2.id, "test", "in", "flow");
    // diagramModel.addPort(node2.id, "testOut2", "out", "ref");

    // const node3 = diagramModel.addNode("trigger", "test3", 10, 100, 72, 100);
    // const node3OutPort = diagramModel.addPort(node3.id, "testOut3", "out", "flow");

    // diagramModel.addLink(node2OutPort.id, inPort.id);
    // diagramModel.addLink(node3OutPort.id, inPort.id);

    // const node4 = diagramModel.addNode("flow", "For", 500, 200, 200, 120);
    // diagramModel.addPort(node4.id, "", "in", "flow");
    // diagramModel.addPort(node4.id, "Loop", "out", "flow");
    // diagramModel.addPort(node4.id, "Array", "in", "array", "ref");
    // diagramModel.addPort(node4.id, "Key", "out", "value");
    // diagramModel.addPort(node4.id, "Value", "out", "ref");
    // diagramModel.addPort(node4.id, "Complete", "out", "flow");

    // Example blueprint in developer notes
    const node1 = diagramModel.addNode("trigger", "Client Request: After Completed", 0, 248, "content.client_request.after_completed")
    diagramModel.addPort(node1.id, "", "out", "flow")
    diagramModel.addPort(node1.id, "Client Request", "out", "ref")

    const node2 = diagramModel.addNode("object", "Object Detail Client Request", 100, 440, "content.client_request")
    diagramModel.addPort(node2.id, "", "in", "ref")
    diagramModel.addPort(node2.id, "request_type", "out", "value")
    diagramModel.addPort(node2.id, "user", "out", "ref")

    const node3 = diagramModel.addNode("expression", "String Expression", 374, 14, "", true, true, false, {expression: "Request #{client_request.category} Completed"})
    diagramModel.addPort(node3.id, "client_request", "in", "binding")
    diagramModel.addPort(node3.id, "", "out", "value")

    const node4 = diagramModel.addNode("flow", "Switch on request.request_type", 374, 248, "", false, false, true, false )
    diagramModel.addPort(node4.id, "", "in", "flow")
    diagramModel.addPort(node4.id, "request_type", "in", "value")
    diagramModel.addPort(node4.id, "deposit", "out", "flow")
    diagramModel.addPort(node4.id, "withdrawal", "out", "flow")
    diagramModel.addPort(node4.id, "account", "out", "flow")
    diagramModel.addPort(node4.id, "verification", "out", "flow")

    const node5 = diagramModel.addNode("action", "Action Send Mail", 824, 248, "send_mail", false, true)
    diagramModel.addPort(node5.id, "", "in", "flow")
    diagramModel.addPort(node5.id, "template", "in", "value")
    diagramModel.addPort(node5.id, "Client Request", "in", "ref")
    diagramModel.addPort(node5.id, "Recipient", "in", "ref")
    diagramModel.addPort(node5.id, "", "out", "flow")
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
