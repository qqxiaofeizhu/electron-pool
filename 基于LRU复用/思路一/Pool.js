import LRU from './LRU';
import PoolItem from './PoolItem';
class Pool {
    constructor(initialMaxPoolInstance = 2, initialUrl = '/') {
        this.windowPool = {};
        this.freeIds = new Set();
        this.initialUrl = initialUrl;
        this.maxPoolInstance = initialMaxPoolInstance;
        this.lru = new LRU(this.maxPoolInstance);

        this.use = (params, url, message = null) => {
            // 获取可以使用的空闲窗口池
            return new Promise(resolve => {
                // 判断下是否还有可用的资源，回收最远的使用频率低的资源
                console.log(this.freeIds.size, this.freeIds.size === 0, '剩余的窗口数量');
                if (this.freeIds.size === 0) {
                    // 取最远未使用的数据，将其删除
                    const recycleFreeId = Array.from(this.lru.cache.keys()).shift();
                    // 先将其进行回收
                    const freeWindow = this.windowPool[recycleFreeId];
                    // 先注册一个回收事件，用于接收窗口回收成功
                    freeWindow.window.emitter.once('recycled', () => {
                        console.log('窗口回收完成', Date.now());
                        const freeId = this.getFreeWindowId(freeWindow.window.id);
                        const window = this.setFreeWindow(freeId, params, url, message);
                        console.log(freeId, '获取到的空闲id');
                        resolve(window);
                    });
                    // 触发其回收函数
                    freeWindow.window.recycle();
                } else {
                    const freeId = this.getFreeWindowId();
                    const window = this.setFreeWindow(freeId, params, url, message);
                    resolve(window);
                }
            });
        };
        // 初始化
        this.init = () => {
            for (let i = 0; i < this.maxPoolInstance; i++) {
                this.createPoolWindowItem();
            }
        };
        this.setFreeWindow = (freeId, params, url, message) => {
            // 取出空闲的资源
            const freeWindow = this.windowPool[freeId];
            // 更新窗口配置
            freeWindow.updateParams(params);
            // 重新加载网页
            freeWindow.loadUrl(url);
            // 重新设置缓存淘汰算法
            this.lru.get(freeId);
            // 发送信息
            freeWindow.window.webContents.send(message.ipcName, message.chunkJson);
            freeWindow.window.ipcName = message.ipcName;
            // 最新的缓存数据的排序
            console.log('最新的缓存数据的排序', Array.from(this.lru.cache.keys()));
            return freeWindow.window;
        };
        // 回收窗口池子资源
        this.recycleWindow = id => {
            // 对回收的数据进行一个标识，因为它的生命周期不会重新执行
            const recycleWindow = this.windowPool[id];
            const window = recycleWindow.window;
            // 重置下路由操作
            window.webContents.send(window.ipcName, {path: '/'});
            setTimeout(() => {
                // 触发自绑定的recycle事件
                window.emitter.emit('recycle');

                // 设置复用标记
                window.reuse = true;
                window.ipcName = null;
                // 将当前的窗口id 放入空闲池子中
                this.freeIds.add(id);
                // 如果存在回收监听事件，那么需要主动触发recycled回收成功事件
                if (window.emitter.listeners('recycled').length) {
                    // 注意：emit callback 为同步事件，则emit 为同步
                    window.emitter.emit('recycled');
                    recycleWindow.beingRecycled = false;
                    console.log(
                        `${id}为窗口被 recycled，剩余的窗口为：${this.freeIds.size}，${Array.from(this.freeIds)}`
                    );
                    // 先绑定监听窗口关闭事件
                    this.removeCustomEvents(window);
                } else {
                    recycleWindow.beingRecycled = false;
                    this.removeCustomEvents(window);
                    console.log(`${id}为窗口被回收，剩余的窗口为：${this.freeIds.size}，${Array.from(this.freeIds)}`);
                }
                // 窗口关闭
                window.hide();
            }, 100);
        };
        // 移除窗口
        this.removeWindow = id => {
            delete this.windowPool[id];
            this.freeIds.delete(id);
            console.log(`${id}为窗口被移除，剩余的窗口为${this.freeIds.size}，${Array.from(this.freeIds)}`);
        };
        // 创建窗口
        this.createPoolWindowItem = () => {
            const poolInstanceItem = new PoolItem({
                removeWindow: this.removeWindow,
                recycleWindow: this.recycleWindow
            });
            const {id} = poolInstanceItem;
            this.windowPool[id] = poolInstanceItem;
            this.freeIds.add(id);
            this.lru.put(id, id);
            poolInstanceItem.loadUrl(this.initialUrl);
            poolInstanceItem.window.reuse = true;
            console.log(`创建窗口成功：${this.freeIds.size}，${Array.from(this.freeIds)}`);
        };
        // 获取的空闲的窗口id
        this.getFreeWindowId = (id = null) => {
            if (!id) {
                id = Array.from(this.freeIds).shift(); // 从空闲的窗口池堆栈里面取出一个空闲的窗口
            }
            this.freeIds.delete(id);
            console.log(`获取的空闲的窗口${id}, 窗口：${this.freeIds.size}，${Array.from(this.freeIds)}`);
            return id;
        };
        // 删除所有的窗口
        this.removeAllWindow = () => {
            for (const key in this.windowPool) {
                this.windowPool[key].window.close();
            }
        };
        // 回收自定义事件
        this.removeCustomEvents = window => {
            window.emitter.removeAllListeners();
        };
        // 初始化
        this.init();
    }
}

export default Pool;
