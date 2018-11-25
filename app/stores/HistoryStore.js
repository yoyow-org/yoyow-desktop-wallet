import alt from "../altInstance";
import BaseStore from "./BaseStore";
import HistoryActions from "../actions/HistoryActions";
import validation from "../utils/Validation";
import globalParams from "../utils/GlobalParams";
import Utils from "../utils/Utils";
import { find, round } from 'lodash';

class HistoryStore extends BaseStore {

    constructor() {
        super();
        this.state = {
            isEnd: false,
            isLoading: false,
            type: 0,
            source: [],
            history: [],
            searchStart: 0
        };
        this.bindActions(HistoryActions);
    }

    onGetHistoryByUid(dt) {
        let { uid, data, start, tokens, err } = dt;
        if (start == 0) {
            this.setState({
                history: [],
                source: []
            })
        }
        if (!err) {
            let token;
            let source = [];
            if(!data) {
                data = [];
            };
            for (let op of data) {
                if (op.type == 0)
                    token = find(tokens, t => { return t.asset_id == op.amount.asset_id });
                if (op.type == 25)
                    token = find(tokens, t => { return t.symbol == op.symbol });
                let obj = {
                    changeMemo: [],
                    transferMemo: '',
                    csaf: 0,
                    feesMemo: 'none',
                    time: op.time,
                    memo: op.memo,
                    from: op.from,
                    to: op.to,
                    inx: op.inx
                };

                let feeOptions = op.fee.options;
                if (feeOptions && uid == op.from) {
                    // 手续费何处支付
                    if (feeOptions.from_balance) {
                        obj.feesMemo = 'balance';
                    } else if (feeOptions.from_prepaid) {
                        obj.feesMemo = 'prepaid';
                    } else if (feeOptions.from_csaf) {
                        obj.feesMemo = 'csaf';
                    }
                    // 多少积分用于支付手续费 仅对发起交易人为自己时
                    if (feeOptions.from_csaf && uid == op.from) {
                        obj.csaf -= Utils.realCount(feeOptions.from_csaf.amount);
                    }
                } else if (!feeOptions) {
                    //用命令行转出的时，无此参数，默认使用的余额
                    obj.feesMemo = 'balance';
                }

                if (op.type == 25) {
                    obj.type = '4';
                    obj.from = '217895094';
                    obj.to = '217895094';
                    obj.transferType = 'create_token';
                    obj.feesMemo = 'balance';
                    obj.transferMemo = op.symbol;
                    obj.changeMemo.push({
                        mark: 'balance',
                        amount: round(op.fee.total.amount / 100000, 5),
                        symbol: '-'
                    });
                    obj.changeMemo.push({
                        mark: op.symbol,
                        amount: Utils.formatToken(op.common_options.max_supply, op.precision),
                        symbol: '+'
                    });
                } else if (op.type == 6) {
                    // obj.typeMemo = '领取积分';
                    obj.type = '3';
                    obj.transferMemo = `${Utils.realCount(op.amount.amount * global.walletConfig.csaf_param)}`;
                    obj.transferType = 'collect_csaf';
                    // 仅领取的积分为自己的才计算积分变动
                    if (op.to == uid) {
                        obj.csaf += Utils.realCount(op.amount.amount);
                    }
                    // 作为发起人 并用零钱支付
                    if (op.from == uid && (op.fee.options.from_prepaid || op.fee.options.from_balance)){
                        obj.changeMemo.push({
                            mark: op.fee.options.from_balance ? 'balance' : 'prepaid',
                            amount: round(op.fee.total.amount / 100000, 5),
                            symbol: '-'
                        });
                    }
                } else {
                    let realTransfer = Utils.formatToken(op.amount.amount, token.precision);
                    obj.transferMemo = `${realTransfer}${token.symbol}`;
                    obj.transferType = 'outer_transfer';
                    if (uid == op.to) {
                        // 目标为自己 则为转入
                        // 转入的情况，记录资金到自己的数额
                        // obj.typeMemo = '转入';
                        obj.type = '1'
                        this.__buildChangeObj(op.extensions, 'to', obj.changeMemo);
                        // 转入的特殊情况 发起人和目标都是自己 此为内部互转
                        // 内部互转的情况 同时记录自己从自己流走的数额
                        if (op.to == op.from) {
                            this.__buildChangeObj(op.extensions, 'from', obj.changeMemo);
                            if (op.extensions.from_balance) {
                                obj.transferMemo = `${realTransfer}${token.symbol}`;
                                obj.transferType = 'inner_transfer_from_balance';
                            } else {
                                obj.transferMemo = `${realTransfer}${token.symbol}`;
                                obj.transferType = 'inner_transfer_from_balance';
                            }

                        }
                    } else if (uid == op.from) {
                        // 发起者为自己 则为转出
                        // obj.typeMemo = '转出';
                        obj.type = '2';
                        // 转出的情况，记录资金从自己流走的数额
                        this.__buildChangeObj(op.extensions, 'from', obj.changeMemo);
                    }
                }

                // 格式化积分及变化符号
                obj.csaf = Math.round(obj.csaf * global.walletConfig.retain_count) / global.walletConfig.retain_count;
                obj.csaf = Utils.formatAmount(obj.csaf * global.walletConfig.csaf_param);
                if (obj.csaf > 0) obj.csaf = '+' + obj.csaf;

                // 若无extention拓展参数信息，默认消息为到余额
                // 非领取积分动作
                if ((!op.extensions && op.type != 6 && op.type != 25) || (op.extensions && op.type == 0 && op.amount && op.amount.asset_id != 0)) {
                    obj.changeMemo.push({
                        mark: op.amount.asset_id == 0 ? 'balance' : token.symbol,
                        amount: Utils.formatToken(op.amount.amount, token.precision),
                        symbol: obj.type == 2 ? '-' : '+'
                    });
                }
                // 处理非核心资产转账 手续费
                if (obj.type == 2 && op.type == 0 && op.amount.asset_id != 0 && op.fee.options.from_balance) {
                    obj.changeMemo.push({
                        mark: 'balance',
                        amount: Utils.realCount(op.fee.options.from_balance.amount),
                        symbol: obj.type == 2 ? '-' : '+'
                    });
                }

                source.push(obj);
            }

            if (start != 0) {
                source = this.state.source.concat(source);
            }

            let history = this.__filterWithType(this.state.type, source);
            this.setState({
                history: history,
                source: source,
                isLoading: false,
                start: start,
                //编号为1的数据为创建帐号生成的，编号为2的就是第一条记录，当到达此记录时，说明无数据可检查
                //原始数据数组长度为0的情况说明无数据，也到达end
                isEnd: source.length == 0 || source[source.length - 1].inx == 2,
            });
        }
    }

    onChangeOpType(type) {
        let history = this.__filterWithType(type, this.state.source);
        this.setState({
            type: type,
            history: history
        });
    }

    __filterWithType(type, source) {
        let result = [];
        if (type == 0) {
            result = source;
        } else {
            for (let h of source) {
                if (h.type == type)
                    result.push(h);
            }
        }
        return result;
    }

    __buildChangeObj(extensions, direct, arr) {
        if ((!extensions) || (extensions.from_balance && extensions.from_balance.asset_id != 0))
            return;
        let assets = ['balance', 'prepaid'];
        for (let asset of assets) {
            let ext = extensions[`${direct}_${asset}`];
            let mark = asset == 'balance' ? 'balance' : 'prepaid';
            let symbol = direct == 'to' ? '+' : '-';
            if (ext) {
                arr.push({
                    mark: mark,
                    amount: Utils.realCount(ext.amount),
                    symbol: symbol
                });
            }
        }

    }

    onChangeAccount() {
        this.setState({
            isEnd: false,
            isLoading: false,
            type: 0,
            source: [],
            history: [],
            searchStart: 0
        });
    }

    onClear() {
        this.setState({
            isEnd: false,
            isLoading: false,
            type: 0,
            source: [],
            history: [],
            searchStart: 0
        });
    }

    onLodding() {
        this.setState({ isLoading: true });
    }

}

export default alt.createStore(HistoryStore, 'HistoryStore');