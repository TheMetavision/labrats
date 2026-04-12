const {createClient} = require('@sanity/client');
const c = createClient({projectId:'o9qrmykx',dataset:'production',apiVersion:'2026-04-10',useCdn:false});
c.fetch('*[_type=="character" && slug.current in ["sprocket-sparksqueak","tank-cheddarbulk"]]{name,"ref":portrait.asset._ref}').then(r=>console.log(JSON.stringify(r,null,2)));
