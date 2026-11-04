import {createRoot} from 'react-dom/client';
import CommandCenter from '../components/command-center';
import '../app/globals.css';
createRoot(document.getElementById('app')!).render(<CommandCenter/>);
