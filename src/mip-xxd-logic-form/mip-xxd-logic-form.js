/**
 * @file mip-xxd-logic-form 组件
 * @author xwchris
 */

define(function (require) {
    'use strict';

    var customElement = require('customElement').create();
    var fetchJsonp = require('fetch-jsonp');
    var viewer = require('viewer');

    /**
     * 创建tip元素
     *
     * @return {string} 要创建的元素html
     */
    function createTipElement() {
        var html = '<div class="tip-wrap">'
                    + '<span class="tip-text"></span>'
                    + '<span class="tip-cross"></span>'
                + '</div>';

        var element = document.createElement('div');
        element.className = 'mip-xxd-logic-form-tip hidden';
        element.innerHTML = html;

        // 点击关闭按钮关闭提示框
        element.querySelector('.tip-cross').addEventListener('click', function () {
            element.classList.add('hidden');
        });

        return element;
    }

    /**
     * 处理提交链接
     *
     * @param {string} url 链接字符串
     * @param {Object} params 提交的参数
     * @return {string} 处理后的链接
     */
    function handleUrl(url, params) {
        var queryString = Object.keys(params).map(function (key) {
            return key + '=' + params[key];
        }).join('&');

        var alreadyHasQuery = false;

        if (url.indexOf('?') !== -1) {
            alreadyHasQuery = true;
        }

        if (queryString) {
            return alreadyHasQuery ? url + '&' + queryString : url + '?' + queryString;
        }
        return url;
    }

    /**
     * 替换并编码URL
     *
     * @param {Object} data 要应用的数据对象
     * @param {string} url 要处理的链接
     * @param {any} defaultValue 默认值
     *
     * @return {string} 处理后的链接
     */
    function replaceAndEncodeUrl(data, url, defaultValue) {
        defaultValue = defaultValue || '';
        var redirectUrl = url.replace(/#([^#]*)#/g, function ($0, $1) {
            return data[$1] || defaultValue;
        });

        redirectUrl = redirectUrl.replace(/{{(.+?)}}/g, function ($0, $1) {
            return encodeURIComponent($1);
        });
        return redirectUrl;
    }

    /**
     * 使用JSONP发送请求
     *
     * @param {dom} element 当前元素
     * @param {string} url 请求链接
     * @param {string} redirect 重定向链接
     * @param {string} submitData 替换跳转链接值所需要的数据
     * @param {Object} paramsData 参数元素
     * @param {any} defaultValue 默认值
     */
    function request(element, url, redirect, submitData, paramsData, defaultValue) {

        // 提交按钮元素
        var submitElement = element.querySelector('#submit');
        var submitElementText = submitElement.textContent;
        var submittingText = element.dataset.submittingText;

        // 改变状态为提交中
        element.submitting = true;
        if (submittingText) {
            submitElement.textContent = submittingText;
        }

        // jsonp
        fetchJsonp(handleUrl(url, paramsData), {
            jsonpCallback: 'callback',
            timeout: 10000
        }).then(function (res) {
            return res.json();
        }).then(function (data) {
            if (data.status === 0) {
                submitData.response = data.data;
                submitData = Object.assign({}, submitData, element.extraData);
                var token = data.token;
                var redirectUrl = replaceAndEncodeUrl(submitData, redirect, defaultValue);

                window.top.location.href = handleUrl(redirectUrl, {token: token});
            }
            else {

                // 发生错误
                showTip.call(element, data.msg);
            }

            // 恢复提交前的状态
            element.submitting = false;
            if (submittingText) {
                submitElement.textContent = submitElementText;
            }
        });
    }

    /**
     * 跳转页面
     *
     * @param {Object} submitData 要提交的数据
     */
    function onRedirect(submitData) {
        var element = this;

        // 数据提交地址
        var url = element.dataset.api || '';

        // 重定向地址
        var redirect = element.dataset.redirect || '';

        // 登录地址
        var loginUrl = element.dataset.apiLogin || '';

        if (url) {

            // 使用请求后的值转跳
            request(element, url, redirect, submitData, submitData, '');
        }
        else if (loginUrl) {

            // 登陆后转跳
            var loginData = {
                phone: submitData.phone,
                captcha: submitData.captcha
            };
            request(element, loginUrl, redirect, submitData, loginData, 0);
        }
        else {
            submitData = Object.assign({}, submitData, element.extraData);
            var redirectUrl = replaceAndEncodeUrl(submitData, redirect, '');
            window.top.location.href = redirectUrl;
        }
    }

    /**
     * 提交表单
     *
     * @param {dom} element dom元素
     * @param {Event} event 事件对象
     */
    function onSubmit(element, event) {
        if (element.submitting) {
            return;
        }
        var data = {};
        var inputs = element.querySelectorAll('mip-xxd-input-item');
        Array.prototype.forEach.call(inputs, function (child) {
            var key = child.dataset.key;
            var value = child.dataset.value;
            if (key && value) {
                data[key] = value;
            }
        });

        // 校验表单
        if (!validateForm.call(element)) {
            return;
        }

        // 判断是否需要百度授权登录
        var xzhAuth = !!element.dataset.xzhAuth || false;

        if (!xzhAuth || element.extraData.isLogin) {
            onRedirect.call(element, data);
        }
        else {
            viewer.eventAction.execute('login', element, event);
        }
    }

    /**
     * 校验单条数据
     *
     * @param {Object} data 校验数据
     * @param {dom} element form元素
     * @return {boolean} 校验结果
     */
    function validateItem(data, element) {
        for (var i = 0, length = data.length; i < length; i++) {
            var type = data[i].type;
            var value = element.dataset.value;
            var selectValue =  element.dataset.key;
            if (type === 'require' && !value) {
                showTip.call(this, data[i].text);
                return false;
            }
            else if (type === 'union') {

                // 取出目标元素的值
                var target = this.querySelector('#' + data[i].target);
                var targetSelectValue = target.dataset.key;

                if (!selectValue && !targetSelectValue) {
                    showTip.call(this, data[i].text);
                    return false;
                }
            }
            else if (type === 'range') {

                // 不包括最小值但包括最大值
                if (data[i].selectValue) {
                    if (selectValue === data[i].selectValue
                        && (isNaN(Number(value)) || Number(value) <= data[i].minValue
                        || Number(value) > data[i].maxValue)) {
                        showTip.call(this, data[i].text);
                        return false;
                    }
                }
                else {
                    if (value && (isNaN(Number(value)) || Number(value) <= data[i].minValue
                        || Number(value) > data[i].maxValue)) {
                        showTip.call(this, data[i].text);
                        return false;
                    }
                }
            }
            else if (type === 'reg' && !new RegExp(data[i].reg).test(value)) {
                showTip.call(this, data[i].text);
                return false;
            }
            else if (type === 'length' && value.length < data[i].minValue) {
                showTip.call(this, data[i].text);
                return false;
            }
        }
        return true;
    }

    /**
     * 校验表单
     *
     * @return {boolean} 校验结果
     */
    function validateForm() {
        var element = this;
        var inputs = element.querySelectorAll('mip-xxd-input-item');
        var result = Array.prototype.every.call(inputs, function (input) {
            if (input.dataset.validate) {
                var data = JSON.parse(input.dataset.validate);
                return validateItem.call(element, data, input);
            }
            return true;
        });

        return result;
    }

    /**
     * 读取localStorage
     *
     * @param {string} key 要读取的key
     * @return {string} 存储的值
     */
    function readStorage(key) {
        var result = '';
        if (localStorage) {
            result = localStorage.getItem(key);
        }
        return result;
    }

    /**
     * 展示tips
     *
     * @param {string} text 要展示的文本
     */
    function showTip(text) {
        var element = this;
        var tipElement = element.querySelector('.mip-xxd-logic-form-tip');

        tipElement.querySelector('.tip-text').textContent = text;
        tipElement.classList.remove('hidden');

        // 2s后消失
        setTimeout(function () {
            tipElement.classList.add('hidden');
        }, 2000);
    }

    /**
     * 第一次进入可视区回调，只会执行一次
     */
    customElement.prototype.firstInviewCallback = function () {

        var self = this;
        var element = self.element;

        element.id = 'mip-xxd-logic-form';
        var submitElement = element.querySelector('#submit');
        submitElement.addEventListener('click', function (event) {
            onSubmit(element, event);
        });

        var bindRecordBtnEvent = function (recordElement) {
            recordElement.addEventListener('click', function () {
                var inputs = element.querySelectorAll('mip-xxd-input-item');
                var result = Array.prototype.every.call(inputs, function (input) {
                    if (input.dataset.value && input.dataset.validate) {
                        var data = JSON.parse(input.dataset.validate);
                        return validateItem.call(element, data, input);
                    }
                    return true;
                });

                if (!result) {
                    return;
                }

                var data = {};
                Array.prototype.forEach.call(inputs, function (child) {
                    var key = child.dataset.key;
                    var value = child.dataset.value;
                    if (key && value) {
                        data[key] = value;
                    }
                });

                var redirect = recordElement.dataset.redirect;

                // 直接转跳
                var redirectUrl = replaceAndEncodeUrl(data, redirect, '');
                window.top.location.href = redirectUrl;
            });
        };

        [].slice.call(document.querySelectorAll('.record-btn')).forEach(bindRecordBtnEvent);

        var tipElement = createTipElement();
        element.appendChild(tipElement);
    };

    // build说明：绑定展示tip事件，为了正确使用，需要尽早绑定
    customElement.prototype.build = function () {
        var self = this;
        var element = self.element;

        // 第一次进入的时候不进行表单校验
        var count = 0;

        self.addEventAction('showTip', function (event, text) {
            showTip.call(element, text);
            return;
        });

        // 记录登录后的额外信息
        element.extraData = {};
        self.addEventAction('saveData', function (event) {
            setTimeout(function () {
                var info = JSON.parse(element.dataset.info || '{}');
                var isSideLogin = JSON.parse(element.dataset.isSideLogin);
                var phonePage = element.dataset.phonePage;
                var sessionStorageId = element.dataset.sessionStorageId;
                var extraData = Object.assign(
                    {},
                    {isLogin: !!info.isLogin},
                    info.userInfo || {},
                    info.data || {},
                    {sessionId: readStorage(sessionStorageId)}
                );
                element.extraData = extraData;

                count++;
                if (isSideLogin) {
                    if (!extraData.id) {
                        window.top.location.href = replaceAndEncodeUrl(extraData, phonePage, '');
                    }
                }
                else {
                    if (count === 1) {
                        return;
                    } else {
                        onSubmit(element, event);
                    }
                }
            });
        });
    };

    return customElement;
});
