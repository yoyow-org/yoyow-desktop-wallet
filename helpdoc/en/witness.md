# Witness
Voted by shareholders, witnesses are responsible for block production and maintaining the blockchain, receiving corresponding rewards at the same time.

## Types of Witness
- Top witnesses: directly voted in by token holders, ranked according to the number of votes.
- Standby witnesses: ranked according to the number of votes and weighted according to the number of votes. Take turns to work alongside the top witnesses.
- Miner witnesses: generated according to the ranking of collateral and weighted according to the collateral amounts. Take turns to work.


## Witness Qualification (collateral)
- Any account with collateral over a certain amount of YOYO can become a witness. Current minimum value for collateral: 10,000 YOYO.
- Witnesses are free to adjust the amount of collateral at any time.
- The refunding of collateral deposits will be delayed for a certain period of time when the collateral amount is decreased or the collateral is cancelled. Current value: 1 day.


Notes:
1. When there are continuous decreases in collateral, the amount will be accumulated and refunded in one lump sum. The time of refund will be delayed on the basis of the time of the last decrease.
2. For collateral increases, if there is a collateral deposit to be returned to the current account, that refund will be deducted first, and then the remaining amount will be deducted from the balance of the account.



## Rewards of Witnesses
- Witnesses will receive corresponding rewards for each block produced with NO vesting period.
- Witnesses can withdraw “available” rewards into their balance at any time.
- The amount of rewards accrued will depend on the type of witness.


## Witness Election
- Top witnesses and standby witnesses are determined according to rankings based on their number of votes. For voting regulation, please refer to [vote] (vote.md).
- Miners are determined according to rankings based on collateral. For regulation on collateral ranking, please refer to [collateral] (collateral.md)
