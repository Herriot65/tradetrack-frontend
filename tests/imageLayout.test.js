import test from 'node:test';
import assert from 'node:assert/strict';
import {imageRows,placeImage,restoreImageLayout,serializeImageLayout,imageSectionOwners} from '../src/lib/imageLayout.js';
const image=(id,width=100)=>({id,screenshotId:id,width,file:null,preview:`image-${id}`});
const rowIds=images=>imageRows(images).map(row=>row.map(item=>item.id));
test('manual Below keeps small images on separate rows; Beside fits full-size images without changing the source',()=>{
 const original=[{id:'before',images:[image(1),image(2)]}];
 const beside=placeImage(original,{sectionId:'before',imageId:2},{sectionId:'before',imageId:1,placement:'right'});
 assert.deepEqual(rowIds(beside.sections[0].images),[[1,2]]);
 assert.deepEqual(beside.sections[0].images.map(item=>item.width),[50,50]);
 assert.deepEqual(original[0].images.map(item=>item.width),[100,100]);
 const below=placeImage(beside.sections,{sectionId:'before',imageId:1},{sectionId:'before',imageId:2,placement:'below'});
 assert.deepEqual(rowIds(below.sections[0].images),[[2],[1]]);
 assert.deepEqual(below.sections[0].images.map(item=>item.width),[50,50]);
});
test('moves between sections preserve image identity and an explicit saved row order',()=>{
 const file={name:'new.png'},moving={...image(1,43),file};
 const result=placeImage([{id:'before',images:[moving,image(2,43)]},{id:'after',images:[]}],{sectionId:'before',imageId:1},{sectionId:'after',imageId:null,placement:'below'});
 assert.deepEqual(rowIds(result.sections[0].images),[[2]]);
 assert.equal(result.sections[1].images[0].file,file);
 const saved=serializeImageLayout([{...image(3,43),startRow:true},{...image(2,43),startRow:true}]);
 assert.deepEqual(saved,[['3'],['2']]);
 assert.deepEqual(rowIds(restoreImageLayout([image(2,43),image(3,43)],saved)),[[3],[2]]);
});
test('unknown and repeated references never lose or duplicate saved images',()=>{
 const restored=restoreImageLayout([image(1),image(2)],[['2','2','not-found'],null]);
 assert.deepEqual(restored.map(item=>item.id),[2,1]);
 assert.deepEqual(imageSectionOwners([{id:'after',image_layout:[['2']]},{id:'before',image_layout:[['2','1']]}]).get('2'),'after');
 assert.deepEqual(serializeImageLayout([{id:'temporary',width:100,file:{}}]),[]);
});
test('rows respect existing minimum widths and reject a fifth adjacent image without dropping it',()=>{
 const sections=[{id:'before',images:[image(1,25),image(2,25),image(3,25),image(4,25),image(5,25)]}];
 const result=placeImage(sections,{sectionId:'before',imageId:5},{sectionId:'before',imageId:1,placement:'left'});
 assert.equal(result.full,true);assert.equal(result.sections,sections);
 assert.equal(sections[0].images.length,5);
});
