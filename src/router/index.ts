import { createRouter, createWebHashHistory } from 'vue-router';
import GalleryPage from '../views/gallery/GalleryPage.vue';
import CanvasPage from '../views/canvas/CanvasPage.vue';

const routes = [
  {
    path: '/',
    name: 'Gallery',
    component: GalleryPage
  },
  {
    path: '/canvas',
    name: 'Canvas',
    component: CanvasPage
  }
];

const router = createRouter({
  history: createWebHashHistory(),
  routes
});


export default router;
