import test from 'node:test';
import assert from 'node:assert/strict';
import {cachedQuery, clearQueryCache} from '../src/lib/queryCache.js';
test('tab reads share pending requests and cached results; edits and expiry fetch fresh data', async () => {
 clearQueryCache(); let calls=0;
 const load=async()=>++calls;
 const first=cachedQuery('journal:1',load);
 assert.equal(cachedQuery('journal:1',load),first);
 assert.equal(await first,1);
 assert.equal(await cachedQuery('journal:1',load),1);
 assert.equal(await cachedQuery('journal:2',load),2);
 assert.equal(await cachedQuery('journal:1',load,Date.now()+31_000),3);
 clearQueryCache(); assert.equal(await cachedQuery('journal:1',load),4);
});
test('failed requests retry and invalidated pending results cannot refill cache', async()=>{
 clearQueryCache();
 await assert.rejects(cachedQuery('a',()=>Promise.reject(new Error('offline'))));
 assert.equal(await cachedQuery('a',()=>5),5);
 const pending=cachedQuery('b',()=>1); clearQueryCache(); await pending;
 assert.equal(await cachedQuery('b',()=>2),2);
});
