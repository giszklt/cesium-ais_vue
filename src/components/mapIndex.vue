<template>
  <div class="main">
    <div class="main-info_panel">
      <el-table size="mini" border :data="tableDatas" max-height="400" stripe>
        <el-table-column v-for="col in cols" :key="col.prop" :label="col.name" :prop="col.prop"
                         align="center"></el-table-column>
        <el-table-column
            label="操作"
            align="center">
          <template slot-scope="scope">
            <el-button @click="connectLine(scope.row, $event)" size="mini" round>切换</el-button>
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
    <div class="main-measure_panel">
      <el-button size="mini" circle title="测距" @click="measurePolyline"
                 :type="selMeasure == 'polyline' ? 'primary' : ''" :disabled="selMeasure && selMeasure != 'polyline'">
        <div class="main-measure_icon" type="polyline"></div>
      </el-button>
      <el-button size="mini" circle title="测面" @click="measurePolygon"
                 :type="selMeasure == 'polygon' ? 'primary' : ''" :disabled="selMeasure && selMeasure != 'polygon'">
        <div class="main-measure_icon" type="polygon"></div>
      </el-button>
    </div>
    <div id="cesiumContainer"></div>
  </div>
</template>

<script>
// import aisData from "../../public/data/aisDatas.json"
import {features} from "../../public/data/aisDatas.json";
import {S_Measure} from "@/util/measure";


let measureTool = null;


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
      ],
      selMeasure: null,
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
    // this.addBoats();
    const dataSourcePromise = this.viewer.dataSources.add(
        Cesium.CzmlDataSource.load("./data/simple.czml")
    );
    let self = this;
    dataSourcePromise.then(re => {
      self.sersorDemo(self.viewer.dataSources.get(0).entities.getById("Sensor") , 10);
    })
    // setTimeout(function (){
    //   self.sersorDemo(self.viewer.dataSources.get(0).entities.getById("SensorTT") , 10);
    // }, 10000)
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
      this.viewer.cesiumWidget.creditContainer.style.display = "none";
      //是否开启抗锯齿
      this.viewer.scene.fxaa = true;
      this.viewer.scene.debugShowFramesPerSecond = true;
      this.viewer.scene.postProcessStages.fxaa.enabled = true;




      measureTool = new S_Measure(this.viewer);

      let handler = new Cesium.ScreenSpaceEventHandler(this.viewer.scene.canvas);
      let self = this;
      handler.setInputAction(function (movement) {
        let pick = self.viewer.scene.pick(movement.position);
        if (pick && Cesium.defined(pick) && pick.id) {
          const entity = pick.id;
          if (entity.label && entity.label.measure) {
            let measureId = entity.id.split("_");
            measureId = measureId[0] + "_" + measureId[1] + "_"
            measureTool.deleteMeasure(measureId)
          }
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
    //模拟卫星传感器
    addCompute() {
      let self = this;
      let data = [
        {
          longitude: 116.405419,
          dimension: 39.918034,
          height: 700000,
          time: 0
        }, {
          longitude: 115.2821,
          dimension: 39.918145,
          height: 700000,
          time: 40
        }, {
          longitude: 114.497402,
          dimension: 39.344641,
          height: 700000,
          time: 100
        }, {
          longitude: 107.942392,
          dimension: 35.559967,
          height: 700000,
          time: 280
        }, {
          longitude: 106.549265,
          dimension: 34.559967,
          height: 700000,
          time: 360
        }, {
          longitude: 95.2821,
          dimension: 32.918145,
          height: 700000,
          time: 400
        }, {
          longitude: 94.497402,
          dimension: 30.344641,
          height: 700000,
          time: 450
        }, {
          longitude: 87.942392,
          dimension: 25.559967,
          height: 700000,
          time: 550
        }, {
          longitude: 66.549265,
          dimension: 24.559967,
          height: 700000,
          time: 600
        }];
      // 起始时间
      let start = Cesium.JulianDate.fromDate(new Date(2017, 7, 11));
      // 结束时间
      let stop = Cesium.JulianDate.addSeconds(start, 600, new Cesium.JulianDate());

      // 设置始时钟始时间
      self.viewer.clock.startTime = start.clone();
      // 设置时钟当前时间
      self.viewer.clock.currentTime = start.clone();
      // 设置始终停止时间
      self.viewer.clock.stopTime = stop.clone();
      // 时间速率，数字越大时间过的越快
      self.viewer.clock.multiplier = 10;
      // 时间轴
      self.viewer.timeline.zoomTo(start, stop);
      // 循环执行
      self.viewer.clock.clockRange = Cesium.ClockRange.LOOP_STOP;


      let property = computeFlight(data);
      // 添加模型
      let planeModel = self.viewer.entities.add({
        // 和时间轴关联
        availability: new Cesium.TimeIntervalCollection([new Cesium.TimeInterval({
          start: start,
          stop: stop
        })]),
        position: property,
        // 根据所提供的速度计算点
        orientation: new Cesium.VelocityOrientationProperty(property),
        // 模型数据
        model: {
          uri: '../gltfModel/weixin.gltf',
          minimumPixelSize: 128
        },
        path: {
          resolution: 1,
          material: new Cesium.PolylineGlowMaterialProperty({
            glowPower: .1,
            color: Cesium.Color.YELLOW
          }),
          width: 10
        }
      });
      planeModel.position.setInterpolationOptions({ //设定位置的插值算法
        interpolationDegree: 5,
        interpolationAlgorithm: Cesium.LagrangePolynomialApproximation
      });

      let property2 = computeFlight2(data);
      let entity_ty = self.viewer.entities.add({
        availability: new Cesium.TimeIntervalCollection([new Cesium.TimeInterval({
          start: start,
          stop: stop
        })]),
        position: property2,
        orientation: new Cesium.VelocityOrientationProperty(property2),
        cylinder: {
          HeightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
          length: 700000,
          topRadius: 0,
          bottomRadius: 700000 / 2,
          material: Cesium.Color.RED.withAlpha(.4),
          outline: !0,
          numberOfVerticalLines: 0,
          outlineColor: Cesium.Color.RED.withAlpha(.8)
        },
      });
      entity_ty.position.setInterpolationOptions({
        interpolationDegree: 5,
        interpolationAlgorithm: Cesium.LagrangePolynomialApproximation
      });


      function computeFlight(source) {
        let property = new Cesium.SampledPositionProperty();
        for (let i = 0; i < source.length; i++) {
          let time = Cesium.JulianDate.addSeconds(start, source[i].time, new Cesium.JulianDate);
          let position = Cesium.Cartesian3.fromDegrees(source[i].longitude, source[i].dimension, source[i].height);
          // 添加位置，和时间对应
          property.addSample(time, position);
        }
        return property;
      }

      function computeFlight2(source) {
        let property = new Cesium.SampledPositionProperty();
        for (let i = 0; i < source.length; i++) {
          let time = Cesium.JulianDate.addSeconds(start, source[i].time, new Cesium.JulianDate);
          let position = Cesium.Cartesian3.fromDegrees(source[i].longitude, source[i].dimension, source[i].height / 2);
          // 添加位置，和时间对应
          property.addSample(time, position);
        }
        return property;
      }
    },
    setWindowAt(position) {
      this.$refs.info.style.left = (position.x - 95) + "px";
      this.$refs.info.style.top = (position.y - 170) + "px";
    },
    addBoats() {
      this.tableDatas.forEach(boats => {
        let id = boats.id;
        let boatColor = Cesium.Color.fromRandom({
          alpha: 1
        });
        // let property = computeFlight(data)
        let line = [];
        //添加船
        boats.points.forEach((boat, index) => {
          let lonlat = [boat.lon, boat.lat]
          line = [...line, ...lonlat]
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
        //添加航线
        this.viewer.entities.add({
          id: "ais_" + id,
          show: false,
          polyline: {
            positions: Cesium.Cartesian3.fromDegreesArray(line),
            arcType: Cesium.ArcType.RHUMB,
            width: 10,
            clampToGround: true,
            material: new Cesium.PolylineArrowMaterialProperty(boatColor),
          }
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
    connectLine(data, e) {
      let className = e.currentTarget.className;
      let show = true;
      if (className.indexOf("el-button--primary") > -1) {
        e.currentTarget.className = className.replace(" el-button--primary", "")
        show = false;
      } else {
        e.currentTarget.className = className + " el-button--primary"
      }
      const id = "ais_" + data.id;
      let entity = this.viewer.entities.getById(id);
      if (entity) {
        entity.show = show
      }
    },
    measurePolyline() {
      if (this.selMeasure == "polyline") {
        this.selMeasure = null;
        measureTool.destoryHandler()
        return
      }
      this.selMeasure = "polyline";
      let self = this;
      measureTool.measurePolyLine(function (e) {
        self.selMeasure = null;
      })
    },
    measurePolygon() {
      if (this.selMeasure == "polygon") {
        this.selMeasure = null;
        measureTool.destoryHandler()
        return
      }
      let self = this;
      this.selMeasure = "polygon";
      measureTool.measurePolygon(function (e) {
        self.selMeasure = null;
      })
    },

    setPos(entity, step) {
      let computeLine = function (position, startTime, step) {
        let property = new Cesium.SampledPositionProperty();
        position.forEach((item, index) => {
          let time = Cesium.JulianDate.addSeconds(
              startTime,
              index * step,
              new Cesium.JulianDate()
          );
          property.addSample(time, item);
        });
        let time2 = Cesium.JulianDate.addSeconds(
            startTime,
            step / position.length,
            new Cesium.JulianDate()
        );
        let pos = Cesium.HeadingPitchRoll.fromQuaternion(new Cesium.VelocityOrientationProperty(property).getValue(time2))
        return {
          sys: new Cesium.VelocityOrientationProperty(property).getValue(time2),
          olj: {
            // heading: pos.heading,
            // pitch: pos.pitch,
            // roll: pos.roll
            heading: Cesium.Math.toDegrees(pos.heading),
            pitch: Cesium.Math.toDegrees(pos.pitch),
            roll: Cesium.Math.toDegrees(pos.roll)
          }
        }
      };
      let tiem1 = this.viewer.clock.currentTime;
      let time2 = Cesium.JulianDate.addSeconds(
          this.viewer.clock.currentTime,
          5,
          new Cesium.JulianDate()
      );
      let position = [entity.position.getValue(tiem1), entity.position.getValue(time2)];
      return computeLine(position, tiem1, step);
    },
    getEntityPos(entity, time) {
      if (entity.position.getValue(time)) {
        let cartog = Cesium.Cartographic.fromCartesian(entity.position.getValue(time));
        return {
          lon: Cesium.Math.toDegrees(cartog.longitude),
          lat: Cesium.Math.toDegrees(cartog.latitude),
          alt: cartog.height,
        }
      } else {
        return {
          lon: 104,
          lat: 31,
          alt: 1040000,
        };
      }

    },
    //卫星实体，幅宽
    sersorDemo(satellite, far) {
      let clockNow = 1;
      let currentTime = this.viewer.clock.currentTime;
      let position = this.getEntityPos(satellite, currentTime);
      let alt = position.alt * 2.5;
      let customSensor = new CesiumSensors.CustomSensorVolume();
      // debugger
      let directions = [];
      for (let i = 0; i <= 250; i++) {
        let clock = Cesium.Math.toRadians(clockNow * (i + 180));// 弧度
        let cone = Cesium.Math.toRadians(far);
        directions.push(new Cesium.Spherical(clock, cone));
      }
      directions.push(new Cesium.Spherical(0, 0));
      let self = this;
      this.viewer.scene.preRender.addEventListener((scene, time) => {
        if (satellite.computeModelMatrix(time)) {
          let modelMatrix = satellite.computeModelMatrix(time);
          if (typeof (modelMatrix) == 'object') {
            Cesium.Matrix4.multiply(modelMatrix, Cesium.Matrix4.fromRotationTranslation(Cesium.Matrix3.fromRotationY(Cesium.Math.toRadians(-180))), modelMatrix)
            customSensor.modelMatrix = modelMatrix
          }
          let posData = self.setPos(satellite, 5);
          satellite.orientation = posData.sys;
        }
      })
      customSensor.id = 'sersor';
      customSensor.radius = alt;
      customSensor.directions = directions;
      let entity = this.viewer.scene.primitives.add(customSensor);
      entity.intersectionColor.red = 0.2;
      entity.lateralSurfaceMaterial.uniforms.color = new Cesium.Color(51 / 255, 255 / 255, 255 / 255, 0.2);
      return entity
    },
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
