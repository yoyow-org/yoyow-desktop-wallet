# Collateral
The quota of miner witnesses for each issue shall be selected according to the collateral rate of each witness.


## Rules for Collateral Ranking 
- The basic idea is to rank according to the arrangement of valid collateral of each account. For example, if A, B and C all deposit collateral, and A has six tokens of valid collateral, B has three tokens of valid collateral, and C has one token of valid collateral, then, for the following 100 blocks, it should be arranged that A produces 60 blocks, B produces 30 blocks and C produces 10 blocks.
- The valid collateral will be the average collateral over seven days, or the current collateral (whichever is smaller). That is to say, when the collateral is increased, the valid collateral will increase gradually, and when the collateral decreases or is canceled, the valid collateral will immediately decrease.
