/**
 * Created on 2017/4/19.
 * @fileoverview 请填写简要的文件说明.
 * @author joc (Chen Wen)
 */
'use strict';

const assert = require('chai').assert;

const retry = require('../lib');

describe('retry()', function () {
    it('execute `task()` until retry times equals to `options.times`', function (done) {
        let task = function () {
            throw new Error('always wrong.');
        };

        let options = {times: 3, delay: 100, debug: false};

        retry(task, options).then(function (res) {
            assert.fail();
            done();
        }).catch(function (err) {
            assert(err.tried > 0, 'task was executed at least 1 time.');
            assert((err.tried - 1) * options.delay <= err.cost);

            let errPrefix = `failed after ${options.times} times retrying, with error`;
            let messagePrefix = err.message.split('\:')[0];
            assert.equal(errPrefix, messagePrefix);
            done();
        });
    });
    it('execute `task()` until success.', function (done) {
        let arr = [];
        let t = 0;
        let tm = 3;
        let task = function (times) {
            arr.push(times);
            t++;
            if (times) {
                throw new Error('`times` giant than 0.');
            }
            if (t > tm) {
                assert.fail();
                done();
            }
        };

        retry(task, {times: tm}).then(function () {
            assert.sameMembers(arr, [1, 2, 0]);
            done();
        }).catch(function (err) {
            assert.fail(err);
            done();
        });
    });

    it('execute async `task()` until success', function (done) {
        let arr = [];
        let t = 0;
        let tm = 3;
        let _task = function (times, callback) {
            setTimeout(function () {
                arr.push(times);
                t++;

                if (t > tm) {
                    assert.fail();
                    done();
                }

                if (times) {
                    return callback(new Error('`times` giant than 0.'));
                }
                callback(null, 'success');
            }, 10);
        };

        let task = function (times) {
            return new Promise(function (resolve, reject) {
                _task(times, function (err, res) {
                    if (err) {
                        return reject(err);
                    }
                    resolve(res);
                });
            });
        };

        retry(task, {times: tm}).then(function (res) {
            assert.equal(res, 'success');
            assert.sameMembers(arr, [1, 2, 0]);
            done();
        }).catch(function (err) {
            assert.fail(err);
            done();
        });
    });
});
