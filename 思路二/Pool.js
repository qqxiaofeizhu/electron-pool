import PoolItem from './PoolItem';
class Pool {
    constructor(initialMaxPoolInstance = 2, initialUrl = '/') {
        this.windowPool = {};
        this.freeIds = new Set();
        this.initialUrl = initialUrl;
        this.maxPoolInstance = initialMaxPoolInstance;

        this.use = (params, windowParams, message = null) => {
            // 获取可以使用的空闲窗口池
            const freeId = this.getFreeWindowId();
            const window = this.setFreeWindow(freeId, params, windowParams, message);
            this.createPoolWindowItem();
            return window;
        };
        // 初始化
        this.init = () => {
            for (let i = 0; i < this.maxPoolInstance; i++) {
                this.createPoolWindowItem();
            }
        };
        this.setFreeWindow = (freeId, params, windowParams, message) => {
            // 取出空闲的资源
            const freeWindow = this.windowPool[freeId];
            // 更新窗口配置
            freeWindow.updateParams(params);
            freeWindow.setWindowParams(windowParams);
            freeWindow.window.message = message;
            freeWindow.window.sendMessage();
            return freeWindow.window;
        };
        // 移除窗口
        this.removeWindow = id => {
            delete this.windowPool[id];
            this.freeIds.delete(id);
            console.log(`${id}为窗口被移除，剩余的窗口为${this.freeIds.size}，${Array.from(this.freeIds)}`);
        };
        // 创建窗口
        this.createPoolWindowItem = async () => {
            const poolInstanceItem = new PoolItem({
                removeWindow: this.removeWindow
            });
            const {id} = poolInstanceItem;
            this.windowPool[id] = poolInstanceItem;
            this.freeIds.add(id);
            poolInstanceItem.loadUrl(this.initialUrl);
            console.log(`创建窗口成功：${this.freeIds.size}，${Array.from(this.freeIds)}`);
        };
        // 获取的空闲的窗口id
        this.getFreeWindowId = () => {
            const id = Array.from(this.freeIds).shift(); // 从空闲的窗口池堆栈里面取出一个空闲的窗口
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
        // 初始化
        this.init();
    }
}

export default Pool;
