
import alt from "../altInstance";
import {compress, decompress} from "lzma";
import {PrivateKey, PublicKey, Aes, key} from "yoyowjs-lib";
import WalletStore from "../stores/WalletStore";

class BackupActions {

    incommingWebFile(file) {
        return (dispatch) => {
            let reader = new FileReader();
            reader.onload = evt => {
                let contents = new Buffer(evt.target.result, "binary");
                let name = file.name;
                let last_modified = file.lastModifiedDate.toString();

                dispatch({name, contents, last_modified});
            };
            reader.readAsBinaryString(file);
        };
    }

    incommingBuffer(params) {
        return params;
    }

    reset() {
        return true;
    }
}

export default alt.createActions(BackupActions);

/**
 * 创建账号备份
 * @param backup_pubkey
 * @param compression_mode 压缩模式，可设置1-9，越大越慢，可能压缩比越大
 * @param entropy
 * @returns {Promise}
 */
export function createAccountBackup(backup_pubkey, compression_mode, entropy) {
    let wallet_object = WalletStore.getWallet();
    return new Promise(resolve => {
        let public_key = PublicKey.fromPublicKeyString(backup_pubkey);
        let onetime_private_key = key.get_random_key(entropy);
        let walletString = JSON.stringify(wallet_object, null, 0);
        walletString = "YOYOW" + walletString;
        compress(walletString, compression_mode, compressedBytes => {
            let backup_buffer = Aes.encrypt_with_checksum(onetime_private_key, public_key, null, compressedBytes);
            let onetime_public_key = onetime_private_key.toPublicKey();
            let backup = Buffer.concat([onetime_public_key.toBuffer(), backup_buffer]);
            resolve(backup);
        });
    });
}

/**
 * 备份账号
 * @param backup_pubkey 用于校验的password_pubkey
 * @returns {Promise}
 */
export function backupAccount(backup_pubkey) {
    return new Promise(resolve => {
        resolve(createAccountBackup(backup_pubkey, 1));
    });
}

/**
 * 解密账号文件
 * @param backup_wif password 私钥
 * @param backup_buffer 文件buffer
 * @returns {Promise}
 */
export function decryptAccountBackup(backup_wif, backup_buffer) {
    return new Promise((resolve, reject) => {
        if (!Buffer.isBuffer(backup_buffer))
            backup_buffer = new Buffer(backup_buffer, "binary");

        let private_key = PrivateKey.fromWif(backup_wif);
        let public_key;
        try {
            public_key = PublicKey.fromBuffer(backup_buffer.slice(0, 33));
        } catch (e) {
            console.error(e, e.stack);
            //throw new Error("Invalid backup file");
            reject("Invalid backup file");
        }

        backup_buffer = backup_buffer.slice(33);
        try {
            backup_buffer = Aes.decrypt_with_checksum(
                private_key, public_key, null, backup_buffer);
        } catch (error) {
            console.error("Error decrypting wallet", error, error.stack);
            reject("invalid_decryption_key");
            return;
        }

        try {
            decompress(backup_buffer, wallet_string => {
                try {
                    if (!wallet_string.startsWith("YOYOW")) {
                        reject("文件格式不正确");
                        return;
                    }
                    wallet_string = wallet_string.substr(5);
                    let wallet_object = JSON.parse(wallet_string);
                    resolve(wallet_object);
                } catch (error) {
                    if (!wallet_string) wallet_string = "";
                    console.error("Error parsing wallet json",
                        wallet_string.substring(0, 10) + "...");
                    reject("Error parsing wallet json");
                }
            });
        } catch (error) {
            console.error("Error decompressing wallet", error, error.stack);
            reject("Error decompressing wallet");
            return;
        }
    });
}