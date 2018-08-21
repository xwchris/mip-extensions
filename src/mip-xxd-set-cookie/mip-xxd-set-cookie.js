/**
 * @file mip-xxd-set-cookie 组件
 * @author
 */

define(function (require) {
    'use strict';

    const customElement = require('customElement').create();

     /**
     * 获取cookie设置函数
     *
     * @param {string} prefix cookie前缀
     * @param {string} domain cookie域
     * @param {string} path cookie路径
     *
     * @return {Function} 设置cookie的函数
     */
    function getCookieFunc(prefix, domain, path) {

        return function (key, value, maxAge = -1) {
            let cookie = prefix + key + '=' + encodeURIComponent(value) + ';path=' + path;

            if (domain) {
                cookie += ';domain=' + domain;
            }
            else {
                cookie += ';max-age=' + maxAge;
            }
            document.cookie = cookie;
        };
    }

    /**
     * 第一次进入可视区回调，只会执行一次
     */
    customElement.prototype.firstInviewCallback = function () {
        const self = this;
        const cookies = self.element.dataset.cookies || '[]';
        const prefix = self.element.dataset.prefix || '';
        const domain = self.element.dataset.domain || '';
        const path = self.element.dataset.path || '/';
        const setCookie = getCookieFunc(prefix, domain, path);
        const arr = JSON.parse(cookies) || [];
        arr.map(function (cookie) {
            setCookie(cookie.name, cookie.value, cookie.maxAge || -1);
        });
    };

    return customElement;
});
