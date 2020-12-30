import { storiesOf } from "@storybook/vue";
// import Diagram from "../src/components/Diagram";
import DiagramModel from "../src/DiagramModel";

// Add more stories here to live develop your components
storiesOf("Diagram", module).add("Axios", () => ({
  data() {
    const diagramModel = new DiagramModel();

    return {
      console,
      serializedModel: diagramModel.serialize(),
      model: diagramModel
    };
  },
  template: `<div style="display: flex">
    <diagram :model="model" width="1100" height="770"></diagram>
    <action-control :model="model" :origin="serializedModel"/>
  </div>`
}));
