<template>
	<div class="main">
		<div id="cesiumContainer"></div>
		<div class="btn-panel_red">
			<el-button @click="ch">一键筹划</el-button>
			<el-button @click="fazx">方案执行</el-button>
			<el-button @click="kszx">开始执行</el-button>
		</div>
		<div class="btn-panel_blue">
			<el-button @click="kstx('blue')">蓝方开始通讯</el-button>
			<el-button @click="xggl">修改蓝方功率</el-button>
		</div>
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
import mapUtils from '@/util/index'

let viewer = null;
export default {
	name: 'dkMap',
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
		this.loadSatelliteAndStation()

	},
	methods: {
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
			mapUtils.polylineMaterial()
		},
		loadSatelliteAndStation() {
			const satellites = [
				{
					lon: 104,
					lat: 30,
				},
				{
					lon: 116,
					lat: 39.9,
				}
			];
			const stations = [
				{
					lon: 108.945602,
					lat: 34.34153,
				},
				{
					lon: 121.529353,
					lat: 31.234079,
				}
			]
			satellites.forEach((satellite, index) => {
				viewer.entities.add({
					id: 'satellite' + index,
					position: Cesium.Cartesian3.fromDegrees(satellite.lon, satellite.lat, 36000000),
					label: {
						text: "高轨wx" + index,
						font: '16px SimHei '
					},
					model: {
						uri: 'models/wx.gltf',
						scale: 100000
					}
				})
			})
			stations.forEach((station, index) => {
				viewer.entities.add({
					id: 'station' + index,
					position: Cesium.Cartesian3.fromDegrees(station.lon, station.lat),
					label: {
						text: "地面站" + index,
						font: '16px SimHei '
					},
					model: {
						uri: 'models/dish.glb',
						scale: 500
					}
				})
			})
		},
		ch() {
		},
		fazx() {
			const red = viewer.entities.getById("satellite1")
			const blue = viewer.entities.getById("satellite0")
			const bs = mapUtils.drawCone(viewer,  blue,red,'r1', true, null)
      this.kstx('red')
			// viewer.clock.onTick.addEventListener(function(clock) {
			// 	const time = clock.currentTime;
			// 	const heading = Cesium.Math.toRadians(time.secondsOfDay % 360); // 随时间变化的偏航角
			// 	bs.orientation = new Cesium.HeadingPitchRoll(heading, 0, 0)
			// });
		},
		kszx() {
		},
		kstx(color) {
			const blue = viewer.entities.getById("satellite0")
			const s1 = viewer.entities.getById("station0")
			const s2 = viewer.entities.getById("station1")
			mapUtils.lineEntity(viewer, 'b1', s1, blue, true, null, null, color)
			mapUtils.lineEntity(viewer, 'b2', blue, s2, true, null, null, color)
		},
		xggl() {
      this.kstx('blue')
		},
	}
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style lang="scss" scoped>
.main {
	height: 100%;
	width: 100%;

	[class^="btn-panel"] {
		position: absolute;
		display: flex;
		flex-direction: column;

		.el-button {
			margin: 5px;
		}
	}

	.btn-panel_red {
		left: 0;
	}

	.btn-panel_blue {
		right: 0;
	}

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
