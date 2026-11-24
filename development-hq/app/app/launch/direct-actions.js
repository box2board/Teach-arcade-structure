'use server';
import {requireAdmin} from '../../lib/neon';
import {connectPublicPreview} from '../../lib/direct-vercel';
import {redirect} from 'next/navigation';
export async function setupPublicPreview(form){
 await requireAdmin();
 if(form.get('confirm')!=='CONNECT PREVIEW')redirect('/launch?direct=invalid');
 let result='failed';
 try{result=await connectPublicPreview();}catch{/* No secret-bearing errors or automatic retries. */}
 redirect('/launch?direct='+result);
}
