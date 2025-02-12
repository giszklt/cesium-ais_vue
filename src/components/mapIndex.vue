<template>
	<div class="main">
		<div id="cesiumContainer"></div>
		<div class="location">
			<p>
				经度
				<span id="location_lon">--</span> ° &nbsp;
			</p>
			<p>
				纬度
				<span id="location_lat">--</span> ° &nbsp;
			</p>
			<p>
				视高
				<span id="location_alt">--</span> km
			</p>
		</div>
	</div>
</template>

<script>
import Bubble from "@/util/bubble";
import DragEntity from "@/util/dragEntity";
import {explotEffect} from "@/util/explotEffect";

let viewer = null;
export default {
	name: 'mapIndex',
	data() {
		return {
			poinEntity: {},
			poin: [
				{
					id: '12321321',
					name: "北京西路测试点",
					type: "固定枪机",
					state: "在线",
					position: {x: 116.4568, y: 39.8926},
					text: 'X'
				},
				{
					id: '43244324',
					name: "阿乐修理厂门口",
					type: "固定枪机",
					state: "在线",
					position: {x: 116.4568, y: 39.8944},
					text: '+'
				},
				{
					id: '43764324',
					name: "裕华路加油站",
					type: "固定枪机",
					state: "在线",
					position: {x: 116.4566, y: 39.8923},
					text: '?'
				},
				{
					id: '437543345',
					name: "康佳大药房",
					type: "固定枪机",
					state: "在线",
					position: {x: 116.4513, y: 39.8923},
					text: '!'
				},],
		}
	},

	mounted() {
		this.init();
		return
		this.dragEntity()

	},
	methods: {
		leftDownAction() {
			this.handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
			let _this = this
			let id
			_this.handler.setInputAction(function (movement) {
				let pick = viewer.scene.pick(movement.position);
				if (Cesium.defined(pick) && (pick.id.id)) {
					// _this.leftDownFlag = true;
					id = pick.id.id;
					_this.bubble(id)
				} else {
					if (_this.bubbles) {
						_this.bubbles.windowClose()
					}

				}

			}, Cesium.ScreenSpaceEventType.LEFT_CLICK);

		},
		bubble(id) {
			if (this.bubbles) {
				this.bubbles.windowClose()
			}
			this.bubbles = new Bubble(Object.assign(this.poinEntity[id], {
				viewer: viewer
			}))

		},
		//加载点
		dragEntity() {
			let drag = new DragEntity(viewer)
			let _this = this
			// this.poin = [{id:234,position:[122.8,39.9],text:"L"},{id:432,position:[122,39],text:"C"}]
			this.poin.forEach(item => {
				let entity = drag.addEntity(item);
				_this.poinEntity[item.id] = entity;
			})

			this.leftDownAction()
		},
		init() {
			console.log(Cesium.VERSION)
			Cesium.Camera.DEFAULT_VIEW_RECTANGLE = Cesium.Rectangle.fromDegrees(
					//-70, // 东
					//0.0, // 南
					//0, // 西
					//90.0, // 北
					//更改为中国区域的初始视角
					72,
					10,
					135,
					53
			);
			Cesium.Camera.DEFAULT_VIEW_FACTOR = 1.2;
			// const Cesium = this.Cesium
			viewer = new Cesium.Viewer("cesiumContainer", {
				geocoder: false,
				// baseLayerPicker: false,
				// sceneMode: 2,
				selectionIndicator: false,
				baseLayerPicker: false,
				animation: true,
				navigationHelpButton: false,
				infoBox: false,
				timeline: true,

				fullscreenButton: false,
				// sceneMode: Cesium.SceneMode.SCENE2D,
				// 连接地图服务
				imageryProvider: new Cesium.ArcGisMapServerImageryProvider({
					// url: window.mapUrl + ":9109/map/?z={z}&x={x}&y={y}",
					url: "https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer",
					tilingScheme: new Cesium.WebMercatorTilingScheme(),
					maximumLevel: 7,
					show: false
				})
			});
			// this.utils.transformTime(this, window.viewer); //时间转换
			// this.utils.setView(window.viewer);
			viewer.cesiumWidget.creditContainer.style.display = "none";
			//是否开启抗锯齿
			viewer.scene.fxaa = true;
			viewer.scene.debugShowFramesPerSecond = true;
			viewer.scene.postProcessStages.fxaa.enabled = true;
			window.viewer = viewer
			const modelMatrix = Cesium.Transforms.eastNorthUpToFixedFrame(
					Cesium.Cartesian3.fromDegrees(-103.0, 40.0)
			);
			const modelMatrix1 = Cesium.Transforms.eastNorthUpToFixedFrame(
					Cesium.Cartesian3.fromDegrees(-104.0, 40.0)
			);
			const model = viewer.scene.primitives.add(Cesium.Model.fromGltf({//Gltf和glb模型都用fromGltf
						url: 'models/111.glb',
						modelMatrix: modelMatrix,
						minimumPixelSize: 512,
						maximumScale: 200000,
						scale: 20000,
					})
			);
			const model2 = viewer.scene.primitives.add(Cesium.Model.fromGltf({//Gltf和glb模型都用fromGltf
						url: 'models/12222.glb',
						modelMatrix: modelMatrix1,
						minimumPixelSize: 512,
						maximumScale: 200000,
						scale: 20000,
					})
			);
			const e = new explotEffect(viewer, {
				lon:104, lat:31, alt: 1000, time: Cesium.JulianDate.fromDate(new Date())
			})
			return;
			model.readyPromise.then(function (model) {
				// 添加所有动画
				model.activeAnimations.addAll();
				console.log('动画开始播放');
			});
			console.log(model)
			// 读取gltf内的构件信息 cesium 1.97之前版本
			const runtimeArticulations = model.sceneGraph._runtimeArticulations
			console.log(runtimeArticulations)
			return
			const articulations = Object.keys(articulationsByName).map(function (articulationName) {
				return {
					name: articulationName,
					name_cn: articulationName, // 汉化
					stages: articulationsByName[articulationName].stages.map(function (stage) {
						const stageModel = {
							name: stage.name,
							name_cn: stage.name, // 汉化
							minimum: stage.minimumValue,
							maximum: stage.maximumValue,
							current: stage.currentValue
						}
						return stageModel
					})
				}
			})
			console.log(articulations)

		}
	}
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style lang="scss" scoped>
.main {
	height: 100%;
	width: 100%;


	.location {
		position: absolute;
		bottom: 3px;
		right: 10px;
		background: linear-gradient(180deg, #003a46 0%, #000000 100%) !important;
		border-radius: 4px;
		/* border: 1px solid rgba(0, 174, 255, 1); */
		color: #fff;
		font-size: 12px;
		padding: 0 10px;
	}

	.location > p {
		display: inline-block;
		height: 25px;
		line-height: 25px;
		margin: 0;
	}


	#cesiumContainer {
		position: absolute;
		top: 0;
		left: 0;
		margin: 0;
		width: 100%;
		height: 100%;
	}

	.main-measure_panel {
		position: absolute;
		z-index: 1;
		right: 80px;
		width: auto;
		padding: 8px;

		.main-measure_icon {
			width: 16px;
			height: 16px;
			text-align: center;
			background-size: contain !important;

			&[type='polyline'] {
				background: url("@/assets/polyline.png");
			}

			&[type='polygon'] {
				background: url("@/assets/polygon.png");
			}
		}
	}

	.main-info_panel {
		position: absolute;
		left: 0;
		width: auto;
		padding: 20px;
		z-index: 1;

		.el-table {
			border-radius: 5px;
			color: #e9eaed;

			/deep/ thead {
				color: #e9eaed;
			}

			/deep/ .el-button {
				background-color: #dcdfe6;
			}

			/deep/ .el-button--primary {
				background-color: #409eff !important;
			}
		}

		/deep/ .el-table,
		.el-table__expanded-cell {
			background-color: rgba(5, 5, 65, 0.2);
		}

		/deep/ .el-table tr {
			background-color: rgba(5, 5, 65, 0.2) !important;
		}

		/deep/ .el-table th {
			background-color: rgba(5, 5, 65, 0.2) !important;
		}

		/deep/ .el-table--enable-row-transition .el-table__body td,
		.el-table .cell {
			background-color: rgba(5, 5, 65, 0.2);
		}

		/deep/ .el-table--border:after,
		/deep/ .el-table--group:after,
		/deep/ .el-table:before {
			background-color: #949494;
		}

		/deep/ .el-table--border,
		/deep/ .el-table--group {
			border-color: #949494;
		}

		/deep/ .el-table td,
		/deep/ .el-table th.is-leaf {
			border-color: #949494;
		}

		/deep/ .el-table--border th,
		/deep/ .el-table--border th.gutter:last-of-type {
			border-color: #949494;
		}

		/deep/ .el-table--border td,
		/deep/ .el-table--border th {
			border-color: #949494;
		}
	}

	.main-info_dialog {
		position: absolute;
		z-index: 1;
		left: 1000px;
		border-radius: 5px;
		padding: 5px;

		.main-dialog_info {
			background: rgba(5, 5, 65, 0.4);
			border-radius: 7px;
			font-size: 12px;
			color: #e9eaed;
			padding-top: 5px;

			.el-icon-close {
				position: absolute;
				right: 8px;
				top: 8px;
				cursor: pointer;
			}

			.main-dialog_infoItem {
				display: flex;
				padding: 5px;
				line-height: 14px;

				.main-infoItem_label {
					width: 40px;
					text-align: right;
				}

				.main-infoItem_info {
					margin-left: 8px;
				}
			}
		}

		.main-dialog_arrow {
			margin: auto;
			width: 0;
			height: 0;
			border-top: 12px solid rgba(5, 5, 65, 0.4);
			border-right: 12px solid transparent;
			border-bottom: 12px solid transparent;
			border-left: 12px solid transparent;
		}
	}
}
</style>
