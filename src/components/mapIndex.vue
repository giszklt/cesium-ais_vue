<template>
  <div class="main">
    <div class="main-info_panel">
      <el-table size="mini" border :data="tableDatas" max-height="400" stripe highlight-current-row>
        <el-table-column v-for="col in cols" :key="col.prop" :label="col.name" :prop="col.prop"
                         align="center"></el-table-column>
        <el-table-column
            label="操作"
            align="center">
          <template slot-scope="scope">
            <el-button @click="connectLine(scope.row)" size="mini" round plain>切换</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>
    <div class="main-info_dialog" ref="info" v-show="showWindow">
      <div class="main-dialog_info">
        <i class="el-icon-close" @click="closeWindow"></i>
        <template v-if="selBoat !== null">
          <div class="main-dialog_infoItem" v-for="(item, key) in infoItems" :key="key">
            <div class="main-infoItem_label">{{ item.name }}:</div>
            <div class="main-infoItem_info">{{ selBoat[item.prop] }}</div>
          </div>
        </template>
      </div>
      <div class="main-dialog_arrow"></div>
    </div>
    <div id="cesiumContainer"></div>
  </div>
</template>

<script>
// import aisData from "../../public/data/aisDatas.json"
import { features } from "../../public/data/aisDatas.json";
export default {
  name: 'mapIndex',
  data() {
    return {
      viewer: null,
      tableDatas: [],
      cols: [
        {
          name: "目标名称",
          prop: "name"
        },

        {
          name: "目标类型",
          prop: "type"
        }
      ],
      selBoat: null,
      showWindow: false,
      tempCartesian: null,
      infoItems: [
        {
          name: "船名",
          prop: "name"
        },
        {
          name: "经纬度",
          prop: "position"
        },
        {
          name: "航向",
          prop: "heading"
        },
        {
          name: "航速",
          prop: "speed"
        },
        {
          name: "类型",
          prop: "type"
        },
        {
          name: "时刻",
          prop: "time"
        },
      ]
    }
  },
  watch: {
    selBoat: function () {
      this.showWindow = this.selBoat !== null
    }
  },
  mounted() {
    //let {features} = require("../../public/data/aisDatas.json")
    let temp = [];
    features.forEach(feature => {
      feature = feature.attributes
      let name = feature.name
      if (temp.indexOf(name) > -1) {
        return
      }
      temp.push(name);
      let points = []
      features.forEach(item => {
        item = item.attributes
        if (item.name === name) {
          points.push({
            heading: item.heading,
            speed: item.speed,
            lon: item.lonlat.split(",")[0],
            lat: item.lonlat.split(",")[1],
            time: item.time
          })
        }
      })
      this.tableDatas.push({
        name: name,
        id: feature.ORIG_FID,
        type: feature.type,
        points: points
      })

    })
    this.init();
    this.addBoats();
  },
  methods: {
    init() {
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
      this.viewer = new Cesium.Viewer("cesiumContainer", {
        geocoder: false,
        // baseLayerPicker: false,
        selectionIndicator: false,
        baseLayerPicker: false,
        animation: false,
        navigationHelpButton: false,
        infoBox: false,
        timeline: false,

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
      this.viewer.cesiumWidget.creditContainer.style.display = "none";
      //是否开启抗锯齿
      this.viewer.scene.fxaa = true;
      this.viewer.scene.debugShowFramesPerSecond = true;
      this.viewer.scene.postProcessStages.fxaa.enabled = true;


      let handler = new Cesium.ScreenSpaceEventHandler(this.viewer.scene.canvas);
      let self = this;
      handler.setInputAction(function (movement) {
        let pick = self.viewer.scene.pick(movement.position);
        if (pick && Cesium.defined(pick) && pick.id) {
          const entity = pick.id;
          const info = entity.boatInfo
          const ellipsoid = self.viewer.scene.globe.ellipsoid;
          self.tempCartesian = self.viewer.camera.pickEllipsoid(movement.position, ellipsoid)
          if (info === undefined) {
            return
          }
          self.selBoat = {
            name: entity.name,
            type: entity.type,
            heading: info.heading + "度",
            speed: info.speed + "km/h",
            position: info.lon + "," + info.lat,
            time: info.time
          }
          // const cartographic = Cesium.Cartographic.fromCartesian(cartesian);
          // const lon = Cesium.Math.toDegrees(cartographic.longitude);
          // const lat = Cesium.Math.toDegrees(cartographic.latitude);
          // const click_point = {longitude: lon, latitude: lat};
          self.setWindowAt(movement.position);
        } else {
          self.selBoat = null;
          self.viewer.scene.postRender.removeEventListener()
        }
      }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

      self.removeHandler = self.viewer.scene.postRender.addEventListener(() => {
        if (self.selBoat == null) {
          return;
        }
        self.showWindow = new Cesium.EllipsoidalOccluder(Cesium.Ellipsoid.WGS84, self.viewer.camera.position).isPointVisible(self.tempCartesian);
        if (self.showWindow) {
          const changedC = Cesium.SceneTransforms.wgs84ToWindowCoordinates(self.viewer.scene, self.tempCartesian);
          self.setWindowAt(changedC);
        }
      })
    },
    setWindowAt(position) {
      this.$refs.info.style.left = (position.x - 95) + "px";
      this.$refs.info.style.top = (position.y - 170) + "px";
    },
    addBoats() {
      this.tableDatas.forEach(boats => {
        let id = boats.id;
        let boatColor = Cesium.Color.fromRandom();
        // let property = computeFlight(data)
        boats.points.forEach((boat, index) => {
          const position = Cesium.Cartesian3.fromDegrees(boat.lon, boat.lat, 0);
          this.viewer.entities.add({
            id: id + "-" + index,
            name: boats.name,
            type: boats.type,
            boatInfo: boat,
            position: position,
            orientation: Cesium.Transforms.headingPitchRollQuaternion(position, new Cesium.HeadingPitchRoll(Cesium.Math.toRadians(boat.heading - 90), Cesium.Math.toRadians(0),
                Cesium.Math.toRadians(0))),
            // position: property,
            // orientation: new Cesium.VelocityOrientationProperty(property),
            model: {
              uri: './data/3dmodel/boat.glb', //gltf文件的URL
              scale: 1000,     //放大倍数
              color: boatColor,  // 船模型颜色
              silhouetteColor: Cesium.Color.fromCssColorString('rgba(0, 255, 0, 1)'),   // 船模型边框颜色
              silhouetteSize: 1      // 船模型边框宽度
            },
          })
        })
      })
    },
    closeWindow() {
      this.selBoat = null
    },
    //计算船航向的
    computeFlight(source) {
      let property = new Cesium.SampledPositionProperty();
      for (let i = 0; i < source.length; i++) {
        let time = Cesium.JulianDate.addSeconds(start, source[i].time, new Cesium.JulianDate);
        let position = Cesium.Cartesian3.fromDegrees(source[i].longitude, source[i].dimension, source[i].height);
        // 添加位置，和时间对应
        property.addSample(time, position);
      }
      return property;
    },
    connectLine(data) {

    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="scss">
.main {
  height: 100%;
  width: 100%;

  #cesiumContainer {
    position: absolute;
    top: 0;
    left: 0;
    margin: 0;
    width: 100%;
    height: 100%;
  }

  .main-info_panel {
    position: absolute;
    left: 0;
    width: auto;
    padding: 20px;
    z-index: 1;

    .el-table {
      border-radius: 5px;
    }
  }

  .main-info_dialog {
    position: absolute;
    z-index: 1;
    left: 1000px;
    border-radius: 5px;
    padding: 5px;

    .main-dialog_info {
      background: #fafafa;
      border-radius: 7px;
      font-size: 12px;
      color: #909399;
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
      border-top: 12px solid #fff;
      border-right: 12px solid transparent;
      border-bottom: 12px solid transparent;
      border-left: 12px solid transparent;
    }
  }
}
</style>
