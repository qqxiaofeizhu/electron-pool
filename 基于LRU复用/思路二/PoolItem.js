import createWindow from './CreateWindow';

class PoolItem {
    constructor({removeWindow}) {
        this.window = createWindow();
        this.id = this.window.id;
        this.window.isReady = false;
        this.window.isDelay = false;
        this.window.isDialog = false;
        this.window.delayCloseWindowTimer = 2 * 60 * 1000;
        this.removeWindow = removeWindow;
        this.lastTime = Date.now();

        /**
         * 加载要展示的页面路径
         * @param {*} url
         */
        this.loadUrl = url => {
            const prefix = process.env.WEBPACK_DEV_SERVER_URL ? process.env.WEBPACK_DEV_SERVER_URL : 'app://./';
            this.window.loadURL(prefix + url);
        };

        this.setWindowParams = (params = {}) => {
            for (const key in params) {
                this.window[key] = params[key];
            }
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

        this.window.on('closed', () => {
            this.removeWindow(this.id);
        });

        this.window.once('ready-to-show', () => {
            console.log('窗口已经准备完毕', Date.now() - this.lastTime, this.window.id);
            this.window.isReady = true;
        });

        /**
         * 清空延迟关闭窗口的定时器，并将其 flag 复位
         */
        this.window.on('show', () => {
            if (this.window.isDelay) {
                clearTimeout(this.window.delayTimer);
                this.window.delayTimer = null;
            }
            this.window.isDelay = false;
        });

        /**
         * 延迟关闭窗口
         */
        this.window.delayClose = delayTimer => {
            console.log(this.window.id, `准备在${delayTimer || this.window.delayCloseWindowTimer}关闭`);
            this.window.isDelay = true;
            if (delayTimer) {
                this.window.delayCloseWindowTimer = delayTimer;
            }
            this.window.delayTimer = setTimeout(() => {
                console.log(this.window.id, '关闭完成');
                this.window.close();
            }, this.window.delayCloseWindowTimer);
            this.window.hide();
        };

        this.window.sendMessage = () => {
            if (this.window.message) {
                const {ipcName, chunkJson} = this.window.message;
                if (ipcName && chunkJson) {
                    if (this.window.isReady) {
                        this.window.webContents.send(ipcName, chunkJson);
                    } else {
                        this.window.webContents.once('dom-ready', () => {
                            this.window.webContents.send(ipcName, chunkJson);
                            this.window.isReady = true;
                        });
                    }
                }
            }
        };

        this.window.webContents.on('ipc-message', (event, channel, ...data) => {
            switch (channel) {
                case 'routerJumpFinish':
                    // 如果是弹窗窗口，且不可见
                    if (this.window.isDialog && !this.window.isVisible()) {
                        setTimeout(() => {
                            this.window.show();
                        }, 300);
                    }
                    break;
            }
        });
    }
}

export default PoolItem;
