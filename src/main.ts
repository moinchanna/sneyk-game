import './styles/base.css';
import './styles/landing.css';
import './styles/game.css';
import './styles/responsive.css';

import { AppController } from './ui/AppController';

// Initialize the Sneyk App once DOM content is fully loaded
document.addEventListener('DOMContentLoaded', () => {
  try {
    new AppController();
  } catch (err) {
    console.error('Failed to initialize Sneyk application:', err);
  }
});
