'use strict';

var { app, BrowserWindow, Menu, ipcMain, dialog } = require('electron');
var ipc = ipcMain;
var { autoUpdater } = require('electron-updater');
var fs = require('fs');
var path = require('path');
var os = require('os');
var isInitUpdate = true;//是否已经初始化检查更新
var isUpdateing = false;//是否已经在下载中

let message = {
    error: '检查更新出错',
    updating: '正在下载更新......',
    updateNotAva: '现在使用的就是最新版本，不用更新',
    downloaded: '最新版本已下载，将在重启程序后更新'
}

function dialogWrapper(msg, detail, btns = ['OK']) {
    let dialog_obj = {
        type: 'info',
        title: app.getName(),
        buttons: btns,
        message: msg
    };
    if(detail) dialog_obj.detail = '\r' + detail
    return dialog.showMessageBox(mainWindow, dialog_obj);
}

function sendWebContent(eventStr, ...args){
    if(mainWindow) mainWindow.webContents.send(eventStr, {
        msg: args[0],
        info: args[1]
    });
}

/**
 * 菜单项
 */
let template = [{
    label: "文件",
    submenu: [
        {
            label: "创建账号", accelerator: "CmdOrCtrl+N", click: function () {
                BrowserWindow.getFocusedWindow().webContents.executeJavaScript("location.href='#/create-account';");
            }
        },
        {
            label: "退出", accelerator: "CmdOrCtrl+Q", click: function () {
                app.quit();
            }
        }
    ]
}, {
    label: "编辑",
    submenu: [
        { label: "剪切", accelerator: "CmdOrCtrl+X", selector: "cut:" },
        { label: "复制", accelerator: "CmdOrCtrl+C", selector: "copy:" },
        { label: "粘贴", accelerator: "CmdOrCtrl+V", selector: "paste:" },
        { label: "全选", accelerator: "CmdOrCtrl+A", selector: "selectAll:" }
    ]
}, {
    label: '查看',
    submenu: [
        {
            label: "前进", accelerator: "Alt+Right", click: function () {
                var curWin = BrowserWindow.getFocusedWindow();
                if (curWin.webContents.canGoForward()) {
                    curWin.webContents.goForward();
                }
            }
        },
        {
            label: "后退", accelerator: "Alt+Left", click: function () {
                var curWin = BrowserWindow.getFocusedWindow();
                if (curWin.webContents.canGoBack()) {
                    curWin.webContents.goBack();
                }
            }
        },
        {
            label: '重新加载',
            accelerator: 'CmdOrCtrl+R',
            click: function () {
                BrowserWindow.getFocusedWindow().reload();
            }
        },
        { type: "separator" },
        {
            label: '检查更新',
            accelerator: 'Alt+CmdOrCtrl+C',
            click() {
                if(!isUpdateing){
                    isInitUpdate = false;
                    autoUpdater.checkForUpdates();
                }else{
                    dialogWrapper(message.updating);
                }
            }
        },
        // { type: "separator" },
        // {
        //     label: '开发者工具',
        //     accelerator: 'Alt+CmdOrCtrl+I',
        //     click: function () {
        //         BrowserWindow.getFocusedWindow().toggleDevTools();
        //     }
        // }
    ]
}
];

autoUpdater.on('checking-for-update', () => {
 })
autoUpdater.on('update-available', info => {
 })
autoUpdater.on('update-not-available', info => {
    if(!isInitUpdate) dialogWrapper(message.updateNotAva);
})
autoUpdater.on('error', err => {
    dialogWrapper(message.error, err);
})
autoUpdater.on('download-progress', progressInfo => { 
    isUpdateing = true;
    sendWebContent('download-progress', 'download-progress', progressInfo);
})
autoUpdater.on('update-downloaded', info => {
    sendWebContent('update-downloaded', 'update-downloaded', info);
    isUpdateing = false;
    let index = dialogWrapper(message.downloaded, null, ['现在重启', '稍后重启']);
    if (index === 1) return;
    autoUpdater.quitAndInstall();
});

var mainWindow;

function createWindow(){
    mainWindow = new BrowserWindow({
        icon: __dirname + "/favicon.ico",
        width: 1180,
        height: 800,
        "node-integration": false,
        webPreferences: {
            nodeIntegration: false,
            preload: __dirname + '/preload.js'
        }
    });

    mainWindow.loadURL('file://' + __dirname + '/index.html');

    mainWindow.on('close', function () {
        mainWindow = null;
    });

    // mainWindow.webContents.session.setCertificateVerifyProc(function(hostname, cert, callback) {
    //     let allowHost = ['wallet.yoyow.org', 'api-bj.yoyow.org', 'api-hz.yoyow.org', 'download.yoyow.org'];
    //     if(callback) callback(allowHost.indexOf(hostname) >= 0);
    // });
}

app.on('ready', function () {

    createWindow();

    Menu.setApplicationMenu(Menu.buildFromTemplate(template));

    mainWindow.webContents.on('did-finish-load', function(){
        if(!isUpdateing) autoUpdater.checkForUpdates();
    });

});

app.on('window-all-closed', () => {
    app.quit();
});