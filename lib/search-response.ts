import type {CatalogItem} from './tracker';
export async function readSearchResponse(response:Response):Promise<{results:CatalogItem[];enrich?:boolean}> {
 // Malformed responses must not surface cryptic browser/parser messages.
 // Never display raw browser/parser errors as product messages.
 const text=await response.text();
 let body: {results?:CatalogItem[];enrich?:boolean};
 try{body=JSON.parse(text);}catch{throw new Error('Game search could not load. Please try again.');}
 if(!response.ok||!body||!Array.isArray(body.results))throw new Error('Game search is temporarily unavailable. Please try again.');
 return {results:body.results,enrich:body.enrich===true};
}
