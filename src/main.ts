import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import './style.css';
import agentation from './agentation';

const app = createApp(App);
app.use(createPinia());
app.use(agentation);
app.mount('#app');
