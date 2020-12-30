import Diagram from "./components/Diagram";
import DiagramModel from "./DiagramModel";
import ActionControl from "./components/ActionControl";

const LibraryModule = {
  Diagram,

  install(Vue) {
    // Register components with vue
    Vue.component("diagram", Diagram);
    Vue.component("action-control", ActionControl);
  }
};

// Export library
export default LibraryModule;

// Export components
export { Diagram };
export { DiagramModel };
