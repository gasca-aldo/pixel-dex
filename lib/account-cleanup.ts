type Store=Pick<Storage,'getItem'|'removeItem'>;
export function clearDeletedAccount(store:Store,userId:string,sessionKey:string){
 store.removeItem('pixel-dex:account-draft:'+userId);
 const stored=JSON.parse(store.getItem(sessionKey)||'null');
 if(stored?.user?.id===userId){store.removeItem(sessionKey);store.removeItem(sessionKey+'-code-verifier');}
}
