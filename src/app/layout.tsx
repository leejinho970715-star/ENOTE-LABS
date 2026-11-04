import type { Metadata } from 'next';
import './globals.css';
export const metadata:Metadata={title:'AI UNIVERSE · CEO Command Center',description:'인간 CEO와 AI 임원진이 함께 운영하는 기업'};
export default function Layout({children}:{children:React.ReactNode}){return <html lang="ko"><body>{children}</body></html>;}
