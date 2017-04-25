# promised-simple-retry


## 环境 | Environment

node >= 4.x


## Installation

```bash
npm install --save promised-simple-retry
```


## Usage

```js
const retry = require('promised-simple-retry');

let task = function () {
    // what you want to do.
    throw new Error('always wrong.');
};

let options = {
    times: 3, // maximum retry times, default `3`
    delay: 100, // delay milliseconds before execute `task()`, default `0`
    delay1st: true, // delay the 1st execution, default `false`
    timeout: 10 * 1000, // maximum execution milliseconds, default `0`
    debug: false
};

retry(task, options).then(function (res) {
    console.log('success');
}).catch(function (err) {
    console.log('failed');
    console.log(`tried ${err.tried} times.`);
    console.log(`cost ${err.cost} ms in total.`);
});
```


## Test

```bash
npm i -g mocha
npm run test
```