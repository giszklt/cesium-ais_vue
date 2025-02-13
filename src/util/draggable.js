// src/mixins/draggable.js

export default {
	mounted() {
		// 获取对话框的头部元素
		const dialogHeaderEl = this.$el.querySelector('.el-dialog__header');
		// 获取整个对话框元素
		const dragDom = this.$el.querySelector('.el-dialog');
		// 设置头部的光标为移动样式，表示可以拖动
		dialogHeaderEl.style.cursor = 'move';

		// 函数用于获取元素的计算样式
		const getStyle = (function () {
			if (window.document.currentStyle) {
				// 对于旧版 IE，使用 currentStyle
				return (dom, attr) => dom.currentStyle[attr];
			} else {
				// 对于现代浏览器，使用 getComputedStyle
				return (dom, attr) => getComputedStyle(dom, false)[attr];
			}
		})();

		// 鼠标按下事件处理程序
		dialogHeaderEl.onmousedown = (e) => {
			// 计算鼠标点击点相对于对话框头部的偏移量
			const disX = e.clientX - dialogHeaderEl.offsetLeft;
			const disY = e.clientY - dialogHeaderEl.offsetTop;

			// 获取对话框的宽度和高度
			const dragDomWidth = dragDom.offsetWidth;
			const dragDomHeight = dragDom.offsetHeight;

			// 获取浏览器窗口的宽度和高度
			const screenWidth = document.body.clientWidth;
			const screenHeight = document.body.clientHeight;

			// 计算对话框拖动的边界
			const minDragDomLeft = dragDom.offsetLeft; // 左边界
			// 右边界
			const maxDragDomLeft = screenWidth - dragDom.offsetLeft - dragDomWidth;
			const minDragDomTop = dragDom.offsetTop; // 上边界
			// 下边界
			const maxDragDomTop = screenHeight - dragDom.offsetTop - dragDomHeight;
			// 获取对话框当前位置的样式（左和上），处理 px 或百分比单位
			let styL = getStyle(dragDom, 'left');
			let styT = getStyle(dragDom, 'top');

			// 处理百分比单位，将其转换为绝对像素值
			if (styL.includes('%')) {
				styL = +document.body.clientWidth * (+styL.replace(/%/g, '') / 100);
				styT = +document.body.clientHeight * (+styT.replace(/%/g, '') / 100);
			} else {
				// 处理 px 单位
				styL = +styL.replace(/px/g, '');
				styT = +styT.replace(/px/g, '');
			}

			// 鼠标移动事件处理程序
			document.onmousemove = function (e) {
				// 计算新的位置
				let left = e.clientX - disX;
				let top = e.clientY - disY;

				// 边界处理：防止对话框拖动超出边界
				if (-left > minDragDomLeft) {
					left = -minDragDomLeft;
				} else if (left > maxDragDomLeft) {
					left = maxDragDomLeft;
				}

				if (-top > minDragDomTop) {
					top = -minDragDomTop;
				} else if (top > maxDragDomTop) {
					top = maxDragDomTop;
				}

				// 更新对话框的位置
				dragDom.style.cssText += `;left:${left + styL}px;top:${top + styT}px;`;
			};

			// 鼠标释放事件处理程序
			document.onmouseup = function () {
				// 解除鼠标移动和释放事件的绑定
				document.onmousemove = null;
				document.onmouseup = null;
			};
		};
	}
};
