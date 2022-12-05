// 生成随机 hash 串
const hash = (len = 16) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    const maxPos = chars.length
    let res = ''

    for (let i = 0; i < len; i++) {
        res += chars[Math.floor(Math.random() * maxPos)]
    }

    return res
}

// background 连接
export class Connect {
    constructor (name) {
        // 连接名称
        this.name = name

        // 所有连接
        this.ports = []

        // 中间件
        this.middleWares = new Map()

        // 处理器
        this.handlers = new Map()

        // debug
        this.debug = msg => {}

        // 连接事件
        chrome.runtime.onConnect.addListener(port => {
            if (port.name === this.name) {
                // 保存连接
                this.ports.push(port)

                // 监听消息
                port.onMessage.addListener(msg => {
                    // 获取处理指令的处理器
                    const handler = this.handlers.get(msg.command)
                    if (!handler) throw new Error(`未找到指令 ${msg.command} 的处理器`)

                    // 处理消息 (前两个是常用参数，后面两个完整参数放着备用)
                    handler(msg.payload, res => {
                        const isError = res instanceof Error

                        port.postMessage({
                            token: msg.token,
                            payload: isError
                                ? {
                                    status: false,
                                    message: res.message
                                }
                                : {
                                    status: true,
                                    data: res
                                }
                        })
                    }, msg, port)
                })

                // 监听断开连接
                port.onDisconnect.addListener(() => {
                    // 移除连接
                    this.ports = this.ports.filter(p => p !== port)
                })
            }
        })
    }

    // debugger
    debugger (fn = msg => {}) {
        this.debug = fn
    }

    // 注册中间件
    use (name, middleware) {
        this.middleWares.set(name, middleware)
    }

    // 注册处理器
    on (command = '', handler = (payload, callback, msg, port) => {}) {
        if (!command) throw new Error('指令不能为空')

        // this.handlers.set(command, handler)
        this.handlers.set(command, async (payload, callback, msg, port) => {
            for (const [name, middleware] of this.middleWares) {
                const ret = await middleware(command, payload, msg, port)

                if (ret instanceof Error) {
                    this.debug(`中间件 ${name} 执行失败：${ret.message}`)
                    return callback(ret) // 如果中间件返回错误，则中断执行，返回错误
                }
            }

            // 执行处理器
            handler(payload, ret => {
                if (ret instanceof Error) this.debug(`指令 ${command} 执行失败：${ret.message}`)
                callback(ret)
            }, msg, port)
        })
    }

    // 主动触发处理器
    emit (command = '', payload) {
        return new Promise((resolve, reject) => {
            if (!command) return reject(new Error('指令不能为空'))

            // 获取处理指令的处理器
            const handler = this.handlers.get(command)
            if (!handler) return reject(new Error(`未找到指令 ${command} 的处理器`))

            // 处理消息
            handler(payload, resolve)
        })
    }

    // 主动发送消息 (向所有页面发送，主要用于广播消息、同步数据等)
    broadcast (command = '', payload = {}) {
        if (!command) throw new Error('指令不能为空')

        this.ports.forEach(port => {
            port.postMessage({ command, payload })
        })
    }
}

// content 连接
export class Port {
    constructor (name) {
        // 连接名称
        this.name = name

        // 异步响应
        this.promises = new Map()

        // 广播处理器
        this.handlers = new Map()

        // 连接事件
        this.port = chrome.runtime.connect({
            name: this.name
        })

        // 监听消息
        this.port.onMessage.addListener(msg => {
            if (msg.command) {
                // 主动通信
                const handler = this.handlers.get(msg.command)
                if (!handler) throw new Error(`未找到指令 ${msg.command} 的处理器`)
                handler(msg.payload)
            } else {
                // 被动通信
                const { token, payload } = msg
                const { resolve, reject } = this.promises.get(token)

                if (payload.status) {
                    resolve(payload.data)
                } else {
                    reject(new Error(payload.message))
                }

                // 移除
                this.promises.delete(token)
            }
        })
    }

    // 监听广播消息
    on (command = '', handler = (payload) => {}) {
        if (!command) throw new Error('指令不能为空')
        this.handlers.set(command, handler)
    }

    // 发送消息
    send (command = '', payload) {
        return new Promise((resolve, reject) => {
            if (!command) return reject(new Error('指令不能为空'))
            const token = hash()
            this.promises.set(token, { resolve, reject })
            this.port.postMessage({ command, payload, token })
        })
    }
}
