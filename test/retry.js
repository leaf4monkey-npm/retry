/**
 * Created on 2017/4/19.
 * @fileoverview 请填写简要的文件说明.
 * @author joc (Chen Wen)
 */
'use strict';

require('babel-register');
const assert = require('chai').assert;

const retry = require('../lib');

describe('retry()', function () {
    it('重复执行直到超出重试次数', function (done) {
        let task = function () {
            throw new Error('always wrong.');
        };

        let options = {times: 3, delay: 100, debug: false};

        retry(task, options).then(function (res) {
            assert.fail();
            done();
        }).catch(function (err) {
            assert(err.tried > 0, '任务至少执行过一次');
            assert((err.tried - 1) * options.delay <= err.cost, '任务执行时间应大于等于重试次数与执行间隔时间的乘积');

            let errPrefix = `failed after ${options.times} times retrying, with error`;
            let messagePrefix = err.message.split('\:')[0];
            assert.equal(errPrefix, messagePrefix);
            done();
        });
    });
    it('重复执行任务直到成功', function (done) {
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
});
