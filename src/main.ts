import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';

import './assets/main.less'; // We will port global CSS to LESSS

import router from './router';

const app = createApp(App);

app.use(createPinia());
app.use(router);
app.mount('#app');
