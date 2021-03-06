﻿# 见证人
见证人由一组股东投票通过的成员组成，见证人负责出块维护YOYOW链运行，同时获得相应的奖励。

## 见证人类型
- 主力见证人：由持币人直接投票产生，按得票数排名
- 备选见证人：按票数排名，除去主力见证人之外，按照得票数量加权，轮流上岗
- 矿工见证人：按抵押排名产生，按抵押金额加权，轮流上岗

## 见证人资格（抵押）
- 任意账户抵押一定数量的YOYO ，即可成为见证人。抵押最小值，当前值10000YOYO
- 见证人可随时调整抵押金额
- 降低抵押金额或者解除抵押时，押金延迟一段时间后退还，当前值1天

注：
1. 连续多次降低抵押时，金额累加一起退还，计划退还时间以最后一次降低时间为准进行延迟
2. 增加抵押时，如果当前账号有延迟退还的押金，优先从里面扣，不足部分从余额扣取


## 见证人工资：
- 每出一块，出块见证人获得相应工资/奖励，不设锁定期
- 见证人随时可以将“待领取”工资领取到余额中
- 不同类型见证人有不同金额的工资奖励

## 见证人选举
- 主力见证人 与 备选见证人，通过得票排名计算。投票规则详见[投票](vote.md)
- 矿工见证人，通过抵押排名计算。抵押排名规则详见[抵押](collateral.md)