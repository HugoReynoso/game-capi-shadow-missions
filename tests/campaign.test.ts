import {test} from 'node:test';
import assert from 'node:assert/strict';
import {load} from '../src/services/save.ts';
import {missions} from '../src/data/missions.ts';
function stored(value:unknown){Object.defineProperty(globalThis,'localStorage',{configurable:true,value:{getItem:()=>JSON.stringify(value)}});return load();}
test('legacy progress migrates into mission one without unlocking the whole campaign',()=>{const p=stored({stars:3,bestTime:22,bestAccuracy:100,credits:1000});assert.deepEqual(Object.keys(p.completed),['1']);assert.equal(p.completed[1].stars,3);});
test('save validation keeps consecutive completed missions and rejects gaps',()=>{const p=stored({completed:{1:{stars:3,time:15,accuracy:100},2:{stars:2,time:30,accuracy:80},4:{stars:3,time:2,accuracy:100}}});assert.deepEqual(Object.keys(p.completed),['1','2']);assert.equal(p.stars,5);});
test('campaign difficulty increases with bounded timers and reachable target counts',()=>{assert.equal(missions.length,10);for(let i=1;i<missions.length;i++){assert(missions[i].timeLimit<missions[i-1].timeLimit);assert(missions[i].speed>missions[i-1].speed);assert(missions[i].targets>=missions[i-1].targets);assert(missions[i].targets<=5);}assert.equal(missions[9].timeLimit,63);});
