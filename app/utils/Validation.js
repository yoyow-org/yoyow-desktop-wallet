
import createKeccakHash from "keccak";
export default {

    base(obj, vType){
        return Object.prototype.toString.call(obj) === `[object ${vType}]`;
    },

    isArray(obj){ return this.base(obj, 'Array'); },

    isFunction(obj){ return this.base(obj, 'Function'); },

    isString(obj){ return this.base(obj, 'String'); },

    isObject(obj){ return this.base(obj, 'Object'); },

    isNumber(obj){
        let n = Number(obj);
        return this.base(n, 'Number') && !isNaN(n);
    },

    isEmptyObject(obj){
        for (var t in obj)
            return false;
        return true;
    },

    isEmpty(obj){
        let flag = obj == undefined || obj == null || obj == 'null' || obj == '' || obj.length == 0;
        if(this.isObject(obj)){
            flag = this.isEmptyObject(obj);
        }
        return flag;
    },

    whatType(obj){
        let t = Object.prototype.toString.call(obj);
        return t.substring(t.indexOf(' ')+1, t.length-1);
    },

    validateEtherAddress(address){
        if(address){
            if(address == "0x0000000000000000000000000000000000000000") return false;
            else{
                if (!/^(0x)?[0-9a-f]{40}$/i.test(address)) {
                    // check if it has the basic requirements of an address
                    return false;
                } else if (/^(0x)?[0-9a-f]{40}$/.test(address) || /^(0x)?[0-9A-F]{40}$/.test(address)) {
                    // If it's all small caps or all all caps, return true
                    return true;
                } else {
                    return address == this.checksumAddress(address);
                }
            }
        }
        return false;
    },

    checksumAddress(address){
        address = address.toLowerCase().replace('0x','');
        var hash = createKeccakHash('keccak256').update(address).digest('hex')
        var ret = '0x'
      
        for (var i = 0; i < address.length; i++) {
          if (parseInt(hash[i], 16) >= 8) {
            ret += address[i].toUpperCase()
          } else {
            ret += address[i]
          }
        }
        return ret
    }
};