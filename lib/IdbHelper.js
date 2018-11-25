/**
 * 数据库事件
 */
class ChainEvent {
    constructor(existing_on_event, callback) {
        this.event = function(event){
            if (event.target.error)
                console.error("transaction error:", event.target.error);
            callback(event)
            if (existing_on_event)
                existing_on_event(event);
        }
    }
}
/**
 * indexedDB操作类
 */
class IdbHelper {
    constructor(impl = null, databaseName = "yoyow_db", onUpgrade = null) {
        /**
         * indexedDB实例
         */
        this.impl = impl;
        /**
         * 打开的数据库对象
         * @type {null}
         */
        this.db = null;
        /**
         * 数据库名称
         * @type {string}
         */
        this.databaseName = databaseName;
        /**
         * 数据库需要更新时调用
         */
        this.onUpgrade = onUpgrade;
    }

    /**
     * 设置更新回调
     * @param f
     */
    setOnUpgrade(f) {
        this.onUpgrade = f;
    }

    /**
     * 设置数据库实例
     * @param impl
     */
    setImpl(impl) {
        this.impl = impl;
    }

    /**
     * 设置数据库名
     * @param name
     */
    setDatabaseName(name) {
        this.databaseName = name;
    }

    /**
     * 打开数据库
     * @param version
     * @returns {*}
     */
    open(version) {
        if (this.db) return Promise.resolve(this.db);
        return new Promise((resolve, reject) => {
            var openRequest = this.impl.open(this.databaseName, version)
            openRequest.onupgradeneeded = (e) => {
                this.db = e.target.result;
                if (this.onUpgrade) this.onUpgrade(e.target.result, e.oldVersion);
            };
            openRequest.onsuccess = (e) => {
                this.db = e.target.result;
                resolve(this.db);
            };
            openRequest.onerror = (e) => {
                reject(e.target.error);
            };
        })
    }

    /**
     * 关闭数据库
     */
    close() {
        if (this.db) {
            this.db.close();
            this.db = null;
        }
    }

    /**
     * 删除数据库
     * @param sure
     * @returns {string}
     */
    deleteDatabase(sure = false) {
        if (!sure) return "Are you sure?";
        if (__DEBUG__) console.log("deleting", this.databaseName);
        var req = this.impl.deleteDatabase(this.databaseName);
        return req.result
    }

    /**
     * 获取能读写的事务对象
     * @param objectStores store name数组或单个名称
     * @returns {*|IDBTransaction}
     */
    getTransaction(objectStores) {
        if (Array.isArray(objectStores)) {
            return this.db.transaction(objectStores, "readwrite");
        }
        return this.db.transaction([objectStores], "readwrite");
    }

    getTransactionOnly(objectStores) {
        if (Array.isArray(objectStores)) {
            return this.db.transaction(objectStores, "readonly");
        }
        return this.db.transaction([objectStores], "readonly");
    }

    /**
     * 返回指定请求的promise
     * @param request
     * @returns {Promise}
     */
    static onRequested(request) {
        return new Promise((resolve, reject) => {
            request.onsuccess = new ChainEvent(request.onsuccess, resolve).event;
            request.onerror = new ChainEvent(request.onerror, reject).event;
        });
    }

    /**
     * 返回指定transactionr的promise
     * @param transaction
     * @returns {Promise}
     */
    static onTransactionEnd(transaction) {
        return new Promise((resolve, reject) => {
            transaction.oncomplete = new ChainEvent(transaction.oncomplete, resolve).event;
            transaction.onabort = new ChainEvent(transaction.onabort, reject).event;
        });
    }

    /**
     * 添加数据
     * @param store store名称
     * @param object 要存储的对象
     * @param event_callback 事件回调
     * @returns 返回事务的处理Promise
     */
    static add(store, object, event_callback) {
        let request = store.add(object);
        let event_promise = null;
        if (event_callback)
            request.onsuccess = new ChainEvent(request.onsuccess, event => {
                    event_promise = event_callback(event);
                }
            ).event;
        let request_promise = this.onRequested(request).then(event => {
            if (event.target.result != void 0) {
                object.id = event.target.result;
            }
            return [object, event];
        });
        if (event_promise)
            return Promise.all([event_promise, request_promise]);
        return request_promise;
    }

    /**
     * 获取指定store_name的游标
     * @param store_name
     * @param callback 处理回调，返回false时，停止迭代
     * @param transaction 事务对象
     * @returns {Promise.<TResult>}
     */
    cursor(store_name, callback, transaction) {
        return new Promise((resolve, reject) => {
            if (!transaction) {
                transaction = this.db.transaction([store_name], "readonly");
                transaction.onerror = (error) => {
                    console.error("ERROR idbHelper.cursor transaction", error);
                    reject(error);
                }
            }

            let store = transaction.objectStore(store_name);
            let request = store.openCursor();
            request.onsuccess = e => {
                let cursor = e.target.result;
                var ret = callback(cursor, e);
                if (ret === false) resolve();
                if (!cursor) resolve(ret);
            };
            request.onerror = (e) => {
                var error = {
                    error: e.target.error.message,
                    data: e
                };
                console.log("ERROR idbHelper.cursor request", error);
                reject(error);
            };
        }).then();
    }

    /**
     * 创建自增objectStore，并且带索引
     * @param db 数据库对象
     * @param table_name 表名
     * @param unique_index 唯一索引属性
     * @returns {IDBIndex}
     */
    static autoIncrementUnique(db, table_name, unique_index) {
        return db.createObjectStore(table_name, {keyPath: "id", autoIncrement: true})
            .createIndex("by_" + unique_index, unique_index, {unique: true});
    }
}

export default IdbHelper;