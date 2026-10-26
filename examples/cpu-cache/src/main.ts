import '@fontsource/ibm-plex-sans/latin-400.css';
import '@fontsource/ibm-plex-sans/latin-500.css';
import '@fontsource/ibm-plex-sans/latin-600.css';
import './style.css';
import { mountLesson } from './runtime';
import { lesson } from './lesson';

mountLesson(document.querySelector<HTMLDivElement>('#app')!, lesson);
