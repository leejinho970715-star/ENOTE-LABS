import type {Metadata} from 'next';
import AdminPortal from '../../components/admin-portal';
export const metadata:Metadata={title:{absolute:'관리자 입장 | ENOTE-LABS'},robots:{index:false,follow:false}};
export default function Page(){return <AdminPortal/>}
