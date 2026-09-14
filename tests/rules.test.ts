import {test} from 'node:test';
import assert from 'node:assert/strict';
import {resultFor,hitOutcome,shotDamage} from '../src/game/rules.ts';

test('correct target awards stars from actual accuracy and time',()=>{
 assert.equal(resultFor('target',20,1,1).stars,3);
 assert.equal(resultFor('target',20,2,1).stars,1);
 assert.equal(resultFor('target',90,1,1).stars,2);
 assert.equal(resultFor('target',20,0,0).accuracy,0);
});
test('civilians, unauthorized targets and timeout cannot earn rewards',()=>{
 for(const reason of ['civilian','wrong','timeout'] as const){const r=resultFor(reason,20,1,1);assert.equal(r.success,false);assert.equal(r.stars,0);assert.equal(r.reward,0);}
 assert.equal(hitOutcome('CIVILIAN'),'civilian');assert.equal(hitOutcome('HOSTILE'),'wrong');assert.equal(hitOutcome('TARGET'),'target');
});

test('armor requires two body hits or three limb hits but one headshot',()=>{assert(shotDamage('body')<160);assert(shotDamage('body')*2>=160);assert(shotDamage('arm')*2<160);assert(shotDamage('arm')*3>=160);assert(shotDamage('head')>=160);assert(shotDamage('body')>=80);});
