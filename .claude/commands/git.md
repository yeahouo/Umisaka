先调用git diff查看修改的代码,按照修改的代码分别提交

# git要求

## 分开提交git

按照不同的修改内容区分，或者用暂存和未提交的区分，要读清楚修改的内容

## git提交信息

请为每次代码更新编写规范的git提交信息，包含以下内容：
1. 简洁明了的标题行（不超过50个字符），使用类型前缀（如feat:、fix:、docs:、style:、refactor:、perf:、test:、chore:）
2. 空一行后添加详细描述（每行不超过72个字符），包括：
   - 更改的具体内容和原因
   - 解决的问题或实现的功能
   - 技术实现的关键点
3. 列出所有修改的文件（使用markdown列表格式）
4. 如果有相关的issue或任务编号，请在描述中引用

提交信息应遵循Angular提交规范，使用中文编写，确保格式清晰易读，便于团队成员理解代码变更历史。

不要显示🤖 Generated with Claude Code

Co-Authored-By: Claude noreply@anthropic.com

## 样例

fix: 修复优惠券系统数据完整性问题

- 修复优惠券领取时couponSnapshot缺少couponType字段的问题
- 实现深度复制确保数据完整性，避免浅拷贝导致的数据不一致
- 完善优惠券类型智能推断逻辑，兼容缺少couponType字段的情况
- 修复支付金额浮点数精度问题，正确处理分转元的单位转换
- 添加数据完整性验证机制，防止不完整数据写入数据库

修改文件:
- cloudfunctions/mall/modules/coupons.js: 修复用户端优惠券领取逻辑
- admin-miniprogram/cloudfunctions/admin/modules/coupons.js: 修复管理后台发放逻辑
- miniprogram/utils/price-calculator.js: 完善类型推断和计算逻辑
- miniprogram/pages/payment/checkout/index.js: 修复金额转换精度问题

关联任务: #优惠券系统数据完整性修复"
