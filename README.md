# @crx-api/messaging

This package provides two very simple to use classes for sending and receiving plugin communication messages.

## Installation

```bash
npm install @crx-api/messaging
```

## Usage

### In the background script

```js
import { Connect } from '@crx-api/messaging'

const conn = new Connect('my-plugin') // Distinguish the different listeners by specifying a name.
window.conn = conn // Exposed to the "window" object, available for "popup" use.

// debugger log
conn.debugger(msg => {
    // This is an example of how you can customize the style to suit your needs.
    console.log(`%c[DEBUG] ${msg}`, 'background-color: red; color: white; padding: 2px; border-radius: 3px;')
})

// middleware
conn.use('this is a middleware.', (command, payload) => {
    // You can exclude some commands that do not need to execute this middleware by judging "command".
    // "payload" is the parameter carried by the "command" instruction.
    if (command === 'command1') return // The "command1" command will be skipped by the middleware, but will not prevent the execution of this command.
    if (payload.status === 'error') return Error('error message.') // You can also return an error message to stop the execution of the command.
})

// command listener
conn.on('command2', async (payload, callback) => {
    // Do something...
    const res = await doSomething()

    if (res.isError) return callback(Error('error message.')) // You can also return an error message to stop the execution of the command.

    callback(res) // The "command2" command will be executed successfully.
})

// port broadcast
conn.broadcast('IAmReady', { status: 'ok' }) // Broadcast a message to all ports.
```

### In the popup script

```js
// get background's window object
const background = chrome.extension.getBackgroundPage()
const conn = background.conn

// Active trigger command.
conn.emit('command2').then(res => {
    // Do something...
})
```

### In the content script (same as options page)

```js
import { Port } from '@crx-api/messaging'

const port = new Port('my-plugin') // Distinguish the different listeners by specifying a name.

// broadcast listener
port.on('IAmReady', payload => {
    // Do something...
})

// send command
port.send('command2', { /* some data */ }).then(res => {
    // Do something...
})
```