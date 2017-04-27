/**
 * Created on 2017/4/19.
 * @fileoverview simple, retry you tasks.
 * @author joc (Chen Wen)
 */
'use strict';

/**
 * 重试一个指定的函数，直到成功，或者超出预设的限制为止
 * @param {Function} task 需要重试的函数，该函数必须直接返回值，或者返回一个 `Promise` 对象
 * @param {object} options
 * @param {number} options.times 重试次数
 * @param {number} options.delay 重试间隔毫秒数
 * @param {?Function=} options.isSuccess 用于判定 `task()` 返回的值是否可以被判定为执行成功
 * @returns {*}
 */
module.exports = function (task, options) {
    let log = {
        debug () {
            options.debug && console.log.apply(console, arguments);
        }
    };
    options = options || {};
    let tried = 0;
    let startedAt = Date.now();
    let cost = 0;
    let times = options.times || 3;
    let timeout = options.timeout || 0;
    let delay = options.delay || 0;
    let delay1st = options.delay1st;
    let resultCheck = options.isSuccess;
    let inc = function () {
        tried++;
        times--;
    };

    let isTimeout = function () {
        return timeout && timeout <= cost;
    };
    let reachMaxRetryTimes = function () {
        return !times;
    };
    //let retryOut = function () {
    //    return isTimeout() || reachMaxRetryTimes();
    //};

    let wrapErr = function (message, err) {
        err.tried = tried;
        err.times = times;
        err.cost = cost;
        log.debug({tried, times, cost});

        err.message = `${message} [${err.toString()}]`;
        return err;
    };

    const onDelay = function () {
        return new Promise(function (resolve, reject) {
            const tryRun = function () {
                inc();
                let r;

                try {
                    r = task(times);
                } catch (e) {
                    reject(e);
                    return;
                } finally {
                    cost = Date.now() - startedAt;
                    log.debug(`cost ${cost} ms, tried ${tried} times.`);
                }

                if (resultCheck) {
                    return resultCheck(r).then(() => resolve(r)).catch(reject);
                }

                resolve(r);
            };
            if (!delay || (!tried && !delay1st)) {
                return tryRun();
            }

            let t = setTimeout(function () {
                tryRun();
                clearTimeout(t);
            }, delay);
        });
    };

    const run = function () {
        let p = onDelay();
        return p.then(function (res) {
            log.debug('tried:', tried);
            log.debug('result:', res);
            log.debug('resolved');
            // output
            return res;
        }).catch(function (err) {
            log.debug('tried:', tried);
            log.debug('err:', err.stack || err);

            if (isTimeout()) {
                // throw
                log.debug(`time out after ${cost}ms.`);
                return Promise.reject(wrapErr(`time out after ${cost}ms, with error:`, err));
            }

            if (reachMaxRetryTimes()) {
                // throw
                log.debug(`failed after ${tried} times retrying.`);
                return Promise.reject(wrapErr(`failed after ${tried} times retrying, with error:`, err));
            }
            return run();
        });
    };

    return run();
};
