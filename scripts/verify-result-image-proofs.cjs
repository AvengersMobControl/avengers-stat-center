#!/usr/bin/env node
'use strict';
// Reviewer-side only: bind a private, original-CDN-byte receipt to the final
// screenshot entry it was visually matched with. This does NOT retrieve images,
// verify their game content or authorize publication.
const KEY=/^[A-Za-z0-9_-]{1,64}$/;
const SHA=/^[a-f0-9]{64}$/i;
const TYPES=new Set(['image/jpeg','image/png','image/gif','image/webp']);
const MAX_BYTES=25*1024*1024;
function requireThat(ok,message){if(!ok)throw Error(message);}
function bindOriginalProofs(review,manifest){
  requireThat(review?.schemaVersion===1&&Array.isArray(review.screens),'Expected parsed review with screens');
  requireThat(manifest?.schemaVersion===1&&Array.isArray(manifest.receipts)&&manifest.receipts.length>0,
    'Private original-byte receipt manifest required');
  const proofs=new Map();
  for(const item of manifest.receipts){
    const key=item?.reviewKey,proof=item?.proof;
    requireThat(typeof key==='string'&&KEY.test(key),'Invalid private reviewKey');
    requireThat(!proofs.has(key),'Duplicate private original-image receipt key');
    requireThat(proof&&typeof proof==='object'&&!Array.isArray(proof),'Missing original-byte receipt');
    requireThat(proof.provenance==='authorized-original-discord-cdn-response',
      'Receipt is not from original authorized Discord CDN retrieval');
    requireThat(typeof proof.imageSha256==='string'&&SHA.test(proof.imageSha256),
      'Invalid source-image SHA-256 receipt');
    requireThat(Number.isSafeInteger(proof.byteLength)&&proof.byteLength>0&&proof.byteLength<=MAX_BYTES,
      'Invalid original-image byte count');
    requireThat(TYPES.has(proof.contentType),'Unsupported original image content type');
    requireThat(proof.verifiedFinal===false&&proof.approved===false,
      'Byte retrieval receipt cannot certify final results or approval');
    proofs.set(key,proof);
  }
  const consumed=new Set();
  const screens=review.screens.map(screen=>{
    requireThat(screen&&typeof screen==='object'&&!Array.isArray(screen),'Invalid screenshot entry');
    if(screen.classification!=='final-claim'){
      requireThat(screen.reviewKey===undefined,
        'Only final-claim screenshots can bind original-image receipts');
      return screen;
    }
    const key=screen.reviewKey;
    requireThat(typeof key==='string'&&KEY.test(key),'Final screenshot missing private reviewKey');
    requireThat(!consumed.has(key),'One original-image receipt cannot stand for two review entries');
    const receipt=proofs.get(key);
    requireThat(receipt,'Missing original-byte receipt for final screenshot');
    requireThat(screen.imageSha256===undefined||
      (typeof screen.imageSha256==='string'&&screen.imageSha256.toLowerCase()===receipt.imageSha256.toLowerCase()),
      'Screenshot digest does not match original-byte receipt');
    consumed.add(key);
    const {reviewKey,...sanitized}=screen;
    return {...sanitized,imageSha256:receipt.imageSha256.toLowerCase()};
  });
  requireThat(consumed.size===proofs.size,
    'Unused original-image receipt: review/provenance coverage mismatch');
  // Never copy the receipt manifest (or private review keys) into candidate.
  return {...review,screens};
}
module.exports={bindOriginalProofs};
