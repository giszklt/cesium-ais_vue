import Vue from 'vue'
import App from './App.vue'
// import ElementUI from 'element-ui';
import { Table, TableColumn, Button, Icon } from 'element-ui';
import 'element-ui/lib/theme-chalk/index.css';
// Vue.use(ElementUI);
Vue.use(Table)
Vue.use(TableColumn)
Vue.use(Button)
Vue.use(Icon)
Vue.config.productionTip = false


new Vue({
  render: h => h(App),
}).$mount('#app')
