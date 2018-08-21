/**
 * @file mip-xxd-set-cookie 组件
 * @author
 */

define(function (require) {
    'use strict';

    var customElement = require('customElement').create();

     /**
     * 获取cookie设置函数
     *
     * @param {string} prefix cookie前缀
     * @param {string} domain cookie域
     * @param {string} path cookie路径
     */
    function getCookieFunc (prefix, domain, path) {

        return function (key, value, maxAge = -1) {
            if (maxAge === -1) {
                document.cookie = prefix + key + '=' + encodeURIComponent(value) + ';domain=' + domain + ';path=' + path;
            } else {
                document.cookie = prefix + key + '=' + encodeURIComponent(value) + ';max-age=' + maxAge + ';domain=' + domain + ';path=' + path;
            }
        }
    };

    /**
     * 第一次进入可视区回调，只会执行一次
     */
    customElement.prototype.firstInviewCallback = function () {
        var self = this;
        var cookies = self.element.dataset.cookies || '[]';
        var prefix = self.element.dataset.prefix || '';
        var domain = self.element.dataset.domain || '';
        var path = self.element.dataset.path || '/';
        var setCookie = getCookieFunc(prefix, domain, path);
        var arr = JSON.parse(cookies) || [];
        arr.map(function (cookie) {
            setCookie(cookie.name, cookie.value, cookie.maxAge || -1);
        });
    };

    return customElement;
});
