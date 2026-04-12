const {createClient} = require('@sanity/client');
const c = createClient({projectId:'o9qrmykx',dataset:'production',apiVersion:'2026-04-10',useCdn:false});
c.fetch('*[_type=="character" && slug.current=="tank-cheddarbulk"][0]').then(r=>{Object.keys(r).forEach(k=>console.log(k,typeof r[k]==="object"&&r[k]?._type||""))});
