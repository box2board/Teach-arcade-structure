export async function teacherSetsRequest(action,body,params={}){
 const query=new URLSearchParams({action,...params});const response=await fetch('/api/teacher-sets?'+query,{method:body?'POST':'GET',credentials:'same-origin',cache:'no-store',headers:body?{'Content-Type':'application/json'}:{},...(body?{body:JSON.stringify(body)}:{})});
 const data=await response.json();if(!response.ok){const error=new Error(data.error||'Question sets are unavailable.');error.status=response.status;throw error;}return data;
}
