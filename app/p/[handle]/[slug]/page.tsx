import { SharedPage } from '@/components/shared-page';
export const dynamic = 'force-dynamic';
export const metadata = {title:'Pixel Dex',robots:{index:false,follow:false}};
export default async function Page({params}:{params:Promise<{handle:string;slug?:string}>}) {
 const {handle,slug}=await params;
 return <SharedPage handle={handle} slug={slug}/>;
}
