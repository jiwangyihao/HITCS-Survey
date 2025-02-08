import './assets/main.css'

import { createApp } from 'vue'
import PrimeVue from 'primevue/config'
import Aura from '@primevue/themes/aura'
import App from './App.vue'
import { definePreset } from '@primevue/themes'

const app = createApp(App)

const MyPreset = definePreset(Aura, {
  semantic: {
    primary: {
      50: '#f2f6f8',
      100: '#c2d6de',
      200: '#91b5c4',
      300: '#6194a9',
      400: '#30748f',
      500: '#005375',
      600: '#004763',
      700: '#003a52',
      800: '#002e40',
      900: '#00212f',
      950: '#00151d',
    },
  },
})

app.use(PrimeVue, {
  theme: {
    preset: MyPreset,
  },
})
app.mount('#app')
