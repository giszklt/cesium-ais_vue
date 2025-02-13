import Vue from 'vue';

/*

*  使用方法：

*  将以下代码复制到一个js文件中，然后在入口文件main.js中import引入即可；

*  给elementUI的dialog上加上 v-dialogDrags

*  给dialog设置 :close-on-click-modal="false" , 禁止点击遮罩层关闭弹出层

*/

// 兼容ie,谷歌
// v-dialogDrags: 弹窗拖拽属性 （重点！！！ 给模态框添加这个属性模态框就能拖拽了）
Vue.directive('dialogDrags', { // 属性名称dialogDrags，前面加v- 使用
	bind(el, binding, vnode, oldVnode) {
		const pine = el.querySelector('.pine');//连接线
		const dragDom = el.querySelector('.box-wrap');//信息框
		dragDom.style.cssText += ';cursor:move;';

		// 获取原有属性 ie dom元素.currentStyle 火狐谷歌 window.getComputedStyle(dom元素, null);
		const sty = (function () {
			if (window.document.currentStyle) {
				return (dom, attr) => dom.currentStyle[attr];
			} else {
				return (dom, attr) => getComputedStyle(dom, false)[attr];
			}
		})();

		dragDom.onmousedown = (e) => {
			// 鼠标按下，计算当前元素距离可视区的距离
			console.log(el.offsetTop)
			const disX = e.clientX - dragDom.offsetLeft;
			const disY = e.clientY - dragDom.offsetTop;

			const screenWidth = document.body.clientWidth; // body当前宽度
			const screenHeight = document.documentElement.clientHeight; // 可见区域高度(应为body高度，可某些环境下无法获取)

			const dragDomWidth = dragDom.offsetWidth; // 对话框宽度
			const dragDomheight = dragDom.offsetHeight; // 对话框高度

			// 获取到的值带px 正则匹配替换
			let styL = sty(dragDom, 'left');
			let styT = sty(dragDom, 'top');

			// 注意在ie中 第一次获取到的值为组件自带50% 移动之后赋值为px
			if (styL.includes('%')) {
				styL = +document.body.clientWidth * (+styL.replace(/\%/g, '') / 100);
				styT = +document.body.clientHeight * (+styT.replace(/\%/g, '') / 100);
			} else {
				styL = +styL.replace(/\px/g, '');
				styT = +styT.replace(/\px/g, '');
			}
			;

			document.onmousemove = function (e) {
				// 通过事件委托，计算移动的距离
				// let left = e.clientX - disX + styL;
				// let top = e.clientY - disY + styT;
				let left = e.clientX - disX;
				let top = e.clientY - disY;

				// 边界处理
				if (left < 0) {
					left = 0;
				}

				if (left > screenWidth - dragDomWidth) {
					left = screenWidth - dragDomWidth;
				}

				if (top + el.offsetTop < 0) {
					top = -el.offsetTop;
				}
				if (top > screenHeight - dragDomheight) {
					top = screenHeight - dragDomheight;
				}
				// 移动当前元素
				dragDom.style.cssText += `;left:${left}px;top:${top}px;`;
			};

			document.onmouseup = function (e) {
				document.onmousemove = null;
				document.onmouseup = null;
			};
		};
	}
});
