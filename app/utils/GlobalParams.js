import FetchApi from '../api/FetchApi';
import ChainApi from '../api/ChainApi';
import Utils from '../utils/Utils';

// 参数定义时注意不要与链上或水龙投参数键重复，除非想要被替换的，如目前的网关参数和最小抵押参数
global.walletConfig = {
    // 本地参数
    balance_task_timeout: 30000, // 资产定时任务刷新间隔
    history_page_size: 20, // 近期活动每页显示数
    csaf_param: 100, // 币天及积分积累 最终现实转换参数
    retain_count: 100000, // 核心资产精度参数
    // 网关参数 从水龙头获取
    bts_fees: 1, // bts网关转出手续费
    bts_master: 43752382, // bts网关账号
    erc20_fees: 50, // erc20网关转出手续费
    erc20_master: 43752382, // erc20网关账号
    // 链上参数 从链上获取 
    coin_unit: '', // 货币单位
    min_witness_pledge: 0, // 见证人最小抵押
    min_committee_member_pledge: 0 // 理事会成员最小抵押
};

class GlobalParams {

    constructor() {
        /**
         * 需要进行核心资产精度转换的参数 
         * 若不在此处转换则使用的时候自行转换亦可
         */
        this.need_transfer = [
            'min_witness_pledge',
            'min_committee_member_pledge'
        ]
    }

    init() {
        // let fetchFaucet = new Promise((resolve, reject) => {
        //     FetchApi.get('sys/sysConf/walletConfigs').then(res => {
        //         if (res.code == 0) {
        //             resolve(res.data);
        //         } else if (__DEBUG__) {
        //             console.error('get wallet config error...');
        //             console.log(res.msg);
        //             resolve();
        //         }
        //     }).catch(() => {
        //         resolve();
        //     });
        // });

        let fetchChain = new Promise((resolve, reject) => {
            ChainApi.getParameters().then(({ params, dynamicParams }) => {
                resolve(params);
            }).catch(err => {
                if(__DEBUG__){
                    console.error('get chain config error...');
                    console.log(err.message); 
                }
                resolve();
            });
        });

        return new Promise((resolve, reject) => {
            Promise.all([fetchChain]).then(res => {
                for(let paramsObj of res)
                    if(paramsObj)
                        for(let key in paramsObj){
                            let val = paramsObj[key];
                            if(Utils.containerInArr(key, this.need_transfer)){
                                val = Utils.realCount(val);
                            }
                                
                            this.setConf(key, val);
                        }
                       
                resolve(global.walletConfig);
            });
        });
    }

    setConf(key, val) {
        global.walletConfig[key] = val;
    }
}

export default new GlobalParams();