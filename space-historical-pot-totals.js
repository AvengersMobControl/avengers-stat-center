(function(){
  'use strict';
  const D=window.AVENGERS_DATA;
  if(!D?.space) return;

  // Pot-star totals reconstructed from the final-result reward/share rows in the
  // historical Space Race review. These are lobby pots, not merely tracked player rewards.
  D.space.historicalPotTotals=Object.assign({},D.space.historicalPotTotals||{},{
    '2026-03-11':{groups:2,potStars:692500,source:'Final Space Race review screenshots'},
    '2026-03-18':{groups:3,potStars:2948512,source:'Final Space Race review screenshots'},
    '2026-03-21':{groups:2,potStars:2256930,source:'Final Space Race review screenshots'},
    '2026-03-25':{groups:3,potStars:1016815,source:'Final Space Race review screenshots'},
    '2026-03-28':{groups:2,potStars:1062348,source:'Final Space Race review screenshots'},
    '2026-06-07':{groups:3,potStars:3289400,source:'Final Space Race review screenshots'},
    '2026-06-11':{groups:3,potStars:2377580,source:'Final Space Race review screenshots'},
    '2026-06-19':{groups:5,potStars:7483080,source:'Final Space Race review screenshots'},
    '2026-06-24':{groups:6,potStars:5154875,source:'Final Space Race review screenshots'},
    '2026-07-09':{groups:4,potStars:7524189,source:'Final Space Race review screenshots'},
    '2026-07-19':{groups:5,potStars:24174432,source:'Final Space Race review screenshots'},
    '2026-07-24':{groups:5,potStars:20181053,source:'Final Space Race review screenshots'},
    '2026-07-30':{groups:5,potStars:34131020,source:'Final Space Race review screenshots'},
    '2026-08-07':{groups:6,potStars:37973127,source:'Final Space Race review screenshots'},
    '2026-08-13':{groups:6,potStars:48391872,source:'Final Space Race review screenshots'},
    '2026-08-21':{groups:6,potStars:59353912,source:'Final Space Race review screenshots'}
  });
})();