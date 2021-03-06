import { storiesOf } from "@storybook/vue";
// import Diagram from "../src/components/Diagram";
import DiagramModel from "../src/DiagramModel";

// Add more stories here to live develop your components
storiesOf("Diagram", module).add("serialization/deserialization", () => ({
  data() {
    const diagramModel = new DiagramModel();

    // Example blueprint in developer notes
    const node1 = diagramModel.addNode("input", "Client Request: After Completed", 0, 248, "trigger")
    const from_port = diagramModel.addPort(node1.id, "", "out", "flow")
    diagramModel.addPort(node1.id, "Client Request", "out", "ref")

    const node2 = diagramModel.addNode("object", "Object Detail Client Request", 100, 440, "content.client_request")
    diagramModel.addPort(node2.id, "", "in", "ref")
    diagramModel.addPort(node2.id, "request_type", "out", "value")
    diagramModel.addPort(node2.id, "user", "out", "ref")

    const node3 = diagramModel.addNode("expression", "String Expression", 374, 14, "", true, true, false, {expression: "Request #{client_request.category} Completed"})
    diagramModel.addPort(node3.id, "client_request", "in", "binding")
    diagramModel.addPort(node3.id, "", "out", "value")

    const node4 = diagramModel.addNode("flow", "Switch on request.request_type", 374, 248, "", false, false, true, false )
    const to_port = diagramModel.addPort(node4.id, "", "in", "flow")
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

    diagramModel.addLink(from_port.id, to_port.id)

    return {
      console,
      serializedModel: diagramModel.serialize(),
      model: diagramModel
    };
  },
  template: `<div style="display: flex">
    <diagram :model="model" width="1100" height="770"></diagram>
  </div>`
}));
