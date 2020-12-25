import { configure } from '@storybook/vue';
import Vue from 'vue';

// Import your custom components.
import ModuleLibrary from '@/index';
import VueInputAutowidth from 'vue-input-autowidth'

// Install this library
Vue.use(ModuleLibrary);
Vue.use(VueInputAutowidth)

// Install Vue plugins
// ex: Vue.use(vuex)

// Load stories
const req = require.context("../stories", true, /\.stories\.js$/);
function loadStories() {
  req.keys().forEach(filename => req(filename));
}
configure(loadStories, module);