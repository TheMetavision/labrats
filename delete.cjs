const {createClient} = require('@sanity/client');
const c = createClient({projectId:'o9qrmykx',dataset:'production',apiVersion:'2026-04-10',useCdn:false,token:process.env.SANITY_TOKEN});

async function deleteAsset(ref) {
  const assetId = ref.replace('image-','').replace(/-(\w+)$/,'.$1').replace(/-/g,'');
  console.log('Deleting asset:', ref);
  // First unset the portrait on the character
  const docs = await c.fetch('*[_type=="character" && portrait.asset._ref==$ref]{_id}', {ref});
  for (const doc of docs) {
    await c.patch(doc._id).unset(['portrait']).commit();
    console.log('Cleared portrait on:', doc._id);
  }
  // Delete the asset
  const fullId = ref.replace('image-', 'image-').replace(/-(\d+x\d+)-(\w+)$/, '-$1-$2');
  await c.delete(fullId.replace('image-','image-'));
}
deleteAsset('image-57136a3a897f43e4b40c017e71b5a241964ac7d3-768x1152-jpg').catch(console.error);
