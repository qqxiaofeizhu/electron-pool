import createWindow from './CreateWindow';

const events = require('events');

class PoolItem {
    constructor({removeWindow, recycleWindow}) {
        this.window = createWindow();
        this.window.emitter = new events.EventEmitter();
        this.id = this.window.id;
        this.removeWindow = removeWindow;
        this.recycleWindow = recycleWindow;
        this.beingRecycled = false;
        this.lastURL = '';

        /**
         * 加载要展示的页面路径
         * @param {*} url
         */
        this.loadUrl = url => {
            if (url && this.lastURL !== url) {
                const prefix = process.env.WEBPACK_DEV_SERVER_URL ? process.env.WEBPACK_DEV_SERVER_URL : 'app://./';
                this.window.loadURL(prefix + url);
            }
            this.lastURL = url;
        };

        this.updateParams = params => {
            const window = this.window;
            const {alwaysOnTop = false, skipTaskbar = false} = params;
            window.setBounds(this.filterParams({x: params.x, y: params.y, width: params.width, height: params.height}));
            window.setAlwaysOnTop(alwaysOnTop);
            window.setSkipTaskbar(skipTaskbar);
        };

        this.filterParams = params => {
            const newParams = {};
            for (const key in params) {
                if (params[key]) {
                    newParams[key] = params[key];
                }
            }
            return newParams;
        };

        // 回收窗口
        this.window.recycle = () => {
            if (this.beingRecycled) {
                console.log(`${this.id}窗口正在回收，请稍等`);
            } else {
                this.beingRecycled = true;
                this.recycleWindow(this.id);
            }
        };

        this.window.on('closed', () => {
            this.removeWindow(this.id);
        });
    }
}

export default PoolItem;
