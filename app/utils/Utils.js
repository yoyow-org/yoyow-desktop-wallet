import {Long} from 'bytebuffer';
import {encode, decode} from 'bs58';
import ByteBuffer from 'bytebuffer';
import globalParams from './GlobalParams';
import Validation from './Validation';
import {divide, round} from 'lodash';
import _ from 'lodash';

class Utils {

    /**
     * 计算可领取的币龄
     * @param statistics 账户的统计对象
     * @param window 币龄过期时间
     * @param now 头块时间
     * @returns {{new_coin_seconds_earned: number, new_average_coins: number}} 返回可领取的币龄和新的平均余额
     * remark
     * 时间之间的计算以秒为单位
     * 时间与其他的计算以分钟点的秒(向下取整的分钟秒数)为单位
     */
    static calcCoinSecondsEarned(statistics, window, now) {
        let new_average_coins = 0;
        let max_coin_seconds = 0;
        let effective_balance = Long.fromValue(statistics.core_balance).add(Long.fromValue(statistics.core_leased_in)).sub(Long.fromValue(statistics.core_leased_out));
        let nowTime = Long.fromNumber(new Date(now).getTime() / 1000); //头块时间 单位 秒
        nowTime -= nowTime % 60; // 转换成整分钟秒
        let averageUpdateTime = Long.fromNumber(new Date(statistics.average_coins_last_update).getTime() / 1000); //平均余额上次更新时间 单位 秒
        let earnedUpdateTime = Long.fromNumber(new Date(statistics.coin_seconds_earned_last_update).getTime() / 1000); //币龄采集上次更新时间 单位 秒
        if (nowTime <= averageUpdateTime) {
            new_average_coins = Long.fromValue(statistics.average_coins);
        } else {
            let delta_seconds = (nowTime - averageUpdateTime);
            if (delta_seconds >= window) {
                new_average_coins = effective_balance;
            } else {
                let old_seconds = window - delta_seconds;
                let old_coin_seconds = Long.fromValue(statistics.average_coins) * old_seconds;
                let new_coin_seconds = effective_balance * delta_seconds;
                max_coin_seconds = old_coin_seconds + new_coin_seconds;
                new_average_coins = Math.floor(max_coin_seconds / window);
            }
        }
        max_coin_seconds = new_average_coins * window;
        //检查可领取的币龄
        let new_coin_seconds_earned = 0;
        if (nowTime <= earnedUpdateTime) {
            new_coin_seconds_earned = Long.fromValue(statistics.coin_seconds_earned);
        } else {
            let delta_seconds = (nowTime - earnedUpdateTime);
            let delta_coin_seconds = effective_balance * delta_seconds;
            new_coin_seconds_earned = Long.fromValue(statistics.coin_seconds_earned).add(delta_coin_seconds);
        }
        if (new_coin_seconds_earned > max_coin_seconds) {
            new_coin_seconds_earned = max_coin_seconds;
        }

        return {new_coin_seconds_earned, new_average_coins};
    }

    static uint64ToBase58(val) {
        return encode(Long.fromValue(val).toBytesLE());
    }

    static base58ToUInt64(val58) {
        let uidBuf = ByteBuffer.fromBinary(Buffer.from(decode(val58)).toString("binary"), ByteBuffer.LITTLE_ENDIAN);
        let m = uidBuf.readUInt64();
        return m;
    }

    static encodeBackOwner(uid, owner) {
        if (typeof owner != "string") return null;
        if (owner.length != 51) return null;
        return owner + "" + Utils.uint64ToBase58(uid);
    }

    static decodeBackOwner(backOwner) {
        if (typeof backOwner != "string") return null;
        if (backOwner.length < 52) return null;
        let owner = backOwner.substr(0, 51);
        let uid = 0;
        try {
            uid = Utils.base58ToUInt64(backOwner.substr(51));
        } catch (e) {
            return null;
        }
        return {uid, owner};
    }

    /**
     * 核心资产类精度转换
     * @param {*} count 
     */
    static realCount(count) {
        let rc = global.walletConfig.retain_count;
        let real = Math.round(count / rc * rc) / rc;
        return this.formatAmount(real);
    }

    /**
     * 精确小数点后5位的有效数据
     * 5位是根据实际yoyo全局比例参数来
     * @param val 格式化原始值
     * @param retainLen 保留小数长度(含小数点)
     */
    static formatAmount(val, retainLen) {
        let valLen = val.toString().length;
        let pointLen = val.toString().indexOf('.');
        if (!retainLen) retainLen = global.walletConfig.retain_count.toString().length;
        if (pointLen >= 0 && valLen > pointLen + retainLen) {
            val = parseFloat(val.toString().substring(0, (pointLen + retainLen)));
        }
        return val;
    }

    /**
     * 将精度值转换成number
     * @param {Number} precision - 精度值
     * @returns {Number} 精度转换后的实际值 如 5 则返回 100000
     */
    static precisionToNum(precision){
        let result = [1];
        for(let p = 0; p < precision ; p++)
            result.push(0);
        return parseInt(result.join(''));
    }

    static formatToken(amount, precision){
        let div = amount / this.precisionToNum(precision);
        let res = round(div, precision);
        return res;
    }

    /**
     * 千位符
     * @param {*} num 
     * 将大数字用千位符标识
     */
    static thousandBit(num) {
        let tail = '';
        let result = '';
        num = (num || 0).toString()
        let p = num.indexOf('.');
        if(p >= 0){
            tail = num.substring(p, num.length);
            num = num.substring(0, p);
        }
        while (num.length > 3) {
            result = ',' + num.slice(-3) + result;
            num = num.slice(0, num.length - 3);
        }
        if (num) { result = num + result; }
        return result + tail;
    }

    static charCounter(str){
        if(Validation.isString(str)){
            let reg = /[\u4e00-\u9fa5]/g;
            let matchLen = str.match(reg) ? str.match(reg).length : 0;
            return matchLen * 2 + (str.length - matchLen);
        }else{
            return 0;
        }
    }

    /**
     * 格式化日期
     * @param dateStr 日期字符串 或 timestamp
     * @param GMT 时区差值
     * @returns {string}
     */
    static formatDate(dateStr, GMT) {
        let date = new Date(dateStr);
        if (Validation.isNumber(GMT) && GMT != 0) {
            date = new Date(date.getTime() + GMT * 60 * 60 * 1000);
        }
        return date.getFullYear() + '-' +
            this.autoFixed((date.getMonth() + 1)) + '-' +
            this.autoFixed(date.getDate()) + ' ' +
            this.autoFixed(date.getHours()) + ':' +
            this.autoFixed(date.getMinutes()) + ':' +
            this.autoFixed(date.getSeconds())
    }

    /**
     * 转换与api通讯时间值
     * @param dObj 日期字符串 或 timestamp
     * @returns {timestamp, dateStr} 转化后的时间戳 和 格式化日期
     */
    static transferApiDate(dObj){
        let now = new Date();
        let date = new Date(dObj);
        let timeOffset = - (now.getTimezoneOffset() * 60 * 1000);
        let timestamp = date.getTime() + timeOffset;
        let ua = navigator.userAgent.toLowerCase();
        // 某些浏览器修整了时区差值，比如猎豹
        if(ua.indexOf('lbbrowser') >= 0){
            timestamp -= timeOffset;
        }
        let dateStr = this.formatDate(timestamp);
        return {timestamp, dateStr};
    }

    static transferApiDateString(dateStr){
        try {
            let time = dateStr;
            let timeArr = [];
            let temp = time.split('T');
            
            timeArr = timeArr.concat(temp[0].split('-'));
            timeArr = timeArr.concat(temp[1].split(':'));

            let tempY = parseInt(timeArr[0]);
            let tempM = parseInt(timeArr[1]);
            let rangeMonth = 0;
            let maxDate = [1, 3, 5, 7, 8, 10, 12];
            let minDate = [4, 6, 9, 11];
            if(this.containerInArr(tempM, maxDate))
                rangeMonth = 31;
            else if(this.containerInArr(tempM, maxDate))
                rangeMonth = 30;
            else{
                if((tempY % 4 == 0 && tempY % 100 != 0) || tempY % 400 == 0){
                    rangeMonth = 29;
                }else{
                    rangeMonth = 28;
                }
            }
            let rangeArr = [12, rangeMonth, 24, 60, 60];
            let finalSec = new Date(`${tempY}-${this.autoFixed(tempM)}`).getTime() / 1000;
            
            // 年与月不参与计算 但参与索引递增
            timeArr[0] = 0;
            timeArr[1] = 0;
            // 抹去初始第一天
            timeArr[2] -= 1;
            
            for(let i = 0; i < 5; i++){
                let sec = parseInt(timeArr[i]);
                for(let j = i; j < 5; j++){
                    sec *= rangeArr[j];
                }
                finalSec += sec;
            }
            
            return finalSec;
        } catch (error) {
            return 0;
        }
    }

    /**
     * 自动补全数字
     * @param num
     * @param len
     * @returns {string}
     */
    static autoFixed(num, len = 2, symbol = 0) {
        let arr = [];
        let o = num.toString().split('');
        for (let i = 0; i < len - o.length; i++) {
            arr.push(symbol);
        }
        return arr.concat(o).join('');
    }

    static containerInArr(target, arr) {
        let flag = false;
        if(Validation.isArray(arr)){
            for(let t of arr){
                if(target == t){
                    return true;
                }
            }
        }
        return flag;
    }

    static hexToBase64(hex){
        return new Buffer(hex, 'hex').toString('base64');
    }
}

export default Utils;