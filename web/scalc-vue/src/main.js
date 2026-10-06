import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import './assets/chrome.css'
import './assets/index.css'
import './assets/tool-page.css'

const app = createApp(App)

app.use(router)

app.mount('#app')
