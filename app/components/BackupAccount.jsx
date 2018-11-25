
import React from "react";
import BaseComponent from "./BaseComponent";
import BackupStore from "../stores/BackupStore";
import WalletStore from "../stores/WalletStore";
import {connect} from "alt-react";
import NotificationActions from "../actions/NotificationActions";
import BackupActions, {backupAccount} from "../actions/BackupActions";
import WalletActions from "../actions/WalletActions";
import {saveAs} from "file-saver";

class BackupAccount extends BaseComponent {
    constructor(props) {
        super(props);

    }

    __getBackupName(name) {
        let date = new Date();
        let month = date.getMonth() + 1;
        let day = date.getDate();
        let stampedName = `${name}_${date.getFullYear()}${month >= 10 ? month : "0" + month}${day >= 10 ? day : "0" + day}`;
        name = stampedName + ".bin";
        return name;
    }

    download() {
        let isFileSaverSupported = false;
        try {
            isFileSaverSupported = !!new Blob;
        } catch (e) {
        }
        if (!isFileSaverSupported) {
            NotificationActions.error("浏览器不支持blob操作");
            return;
        }

        let blob = new Blob([this.props.backup.contents], {
            type: "application/octet-stream; charset=us-ascii"
        })

        if (blob.size !== this.props.backup.size) {
            NotificationActions.error('备份无效');
            return;
        }
        this.saveFile(blob, this.props.backup.name);
        WalletActions.setBackupDate();
        BackupActions.reset();
    }

    /**
     * 兼容文件下载
     * @param obj
     * @param name
     */
    saveFile(obj, name) {
        if (window.requestFileSystem !== undefined) {
            console.debug('use window.requestFileSystem');
            window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, function (fileSystem) {
                fileSystem.root.getDirectory('Download', {create: true}, function (dirTry) {
                    dirTry.getFile(name, {create: true, exclusive: false}, function (entry) {
                        let fileUrl = entry.toURL();
                        entry.createWriter(function (writer) {
                            writer.onwriteend = function (evt) {
                                NotificationActions.success("成功保存文件到： " + fileUrl);
                            };
                            // Write to the file
                            writer.write(obj);
                        }, function (error) {
                            NotificationActions.error("不能创建文件写入器:" + error.code);
                        });
                    }, function (error) {
                        NotificationActions.error("不能创建文件：" + error.code);
                    });
                }, function (error) {
                    NotificationActions.error("不能创建目录：" + error.code);
                });
            }, function (evt) {
                NotificationActions.error("不能访问文件系统：" + evt.target.error.code);
            });
        } else {
            if (__DEBUG__) console.debug('not window.requestFileSystem');
            saveAs(obj, name);
        }
    }

    onBackup(e) {
        if (this.props.backup.sha1) {
            this.download();
        } else {
            this.createBackup();
        }
    }

    createBackup() {
        let backup_pubkey = this.props.wallet.password_pubkey;
        backupAccount(backup_pubkey).then(contents => {
            let name = this.__getBackupName(this.props.wallet.public_name);
            BackupActions.incommingBuffer({name, contents})
        });
    }

    render() {
        let btnVal = "", msg = null;
        if (this.props.backup.sha1) {
            btnVal = "下载";
            msg = (<div className="msg"><p>{this.props.backup.name}({this.props.backup.size} bytes)</p>
                <p>SHA1:{this.props.backup.sha1}</p>
            </div>);
        } else {
            btnVal = this.translate("backup_account.button");
        }
        return (
            <div className="layer-settings">
                <h3>{this.translate("backup_account.title")}</h3>
                {msg}
                <input className="button" type="button" value={btnVal} onClick={this.onBackup.bind(this)}/>
                <p>
                    {this.translate("backup_account.tips_content")}
                </p>
                <p>
                    {this.props.wallet.backup_date?`${this.translate("backup_account.label_name")}：${this.translate("backup_account.time")?this.props.wallet.backup_date.toLocaleString():this.props.wallet.backup_date.toUTCString()}`:this.translate("backup_account.not_backup")}
                </p>
            </div>
        );
    }
}

export default connect(BackupAccount, {
    listenTo() {
        return [WalletStore, BackupStore];
    },
    getProps() {
        return {wallet: WalletStore.getState().wallet, backup: BackupStore.getState()};
    }
});
 