# mip-xxd-logic-form

该组件与`mip-xxd-input-item`配合使用，用来校验表单和提交表单

标题|内容
----|----
类型|通用
支持布局|responsive
所需脚本|https://c.mipcdn.com/static/v1/mip-xxd-logic-form/mip-xxd-logic-form.js

## 示例

### 基本用法
```html
<mip-xxd-logic-form
    data-api="api.xxx.com"
    data-redirect="/index.html"
    data-submitting-text="确认中..."
>
    <mip-xxd-input-item
        id="scoreItem"
        data-item="{title:学习成绩,type:input,key:score,placeholder:百分制}"
        data-validate="[{type:require,text:请填写学习成绩},{type:range,minValue:0,maxValue:100,text:请填写正确的学习成绩}]"
    >
    </mip-xxd-input-item>
    <button id="submit">submit</button>
</mip-xxd-login-form>
```

## 属性

### data-api
数据提交的地址

### data-redirect
数据提交成功后要跳转的页面，需要用到表单数据用`#数据名#`来表述

### data-submitting-text
按钮提交时的按钮文字

## 注意事项
该组件除了需要与`mip-xxd-input-item`配合使用以外，还要提供一个提交按钮并且其`id`为submit，该组件会自动为其绑定提交事件
