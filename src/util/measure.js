/**
 * 测量线段
 */

export class S_Measure {
    constructor(viewer) {
        this.measureIndex = 0;
        this.viewer = viewer
        this.entityCollection = []
        // this.viewer.scene.globe.depthTestAgainstTerrain = true;
        this.handler = new Cesium.ScreenSpaceEventHandler(this.viewer.scene.canvas);
        this.mousetip = null;
        this.mousemove = null;
        this.lastPoint = null;
        // this.destoryHandler();
        this.handler.setInputAction((clickEvent) => {
            let pick = this.viewer.scene.pick(clickEvent.position);
            if (pick && Cesium.defined(pick) && pick.id) {
                const entity = pick.id;
                if (entity.label && entity.label.measure) {
                    let measureId = entity.id.split("_");
                    measureId = measureId[0] + "_" + measureId[1] + "_"
                    this.deleteMeasure(measureId)
                }
            }
        }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
    }

    // let this.entityCollection = [];

    getCollection() {
        return this.entityCollection;
    };

    /**
     * 清除
     */
    destroy(callback) {
        this.measureIndex = 0;
        for (let i = 0; i < this.entityCollection.length; i++) {
            this.viewer.entities.remove(this.entityCollection[i]);
        }
        this.viewer.entities.remove(this.mousetip);
        this.entityCollection = [];
        this.destoryHandler();
        if (callback) {
            callback()
        }
    };

    /**
     * 清除事件
     */

    destoryHandler() {
        this.handler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_CLICK);
        this.handler.removeInputAction(Cesium.ScreenSpaceEventType.MOUSE_MOVE);
        this.handler.removeInputAction(Cesium.ScreenSpaceEventType.RIGHT_CLICK);
        this.viewer.entities.remove(this.mousetip);
        this.mousetip = null;
        this.mousemove = null;
    };

    /**
     * 删除测量要素
     * @param id
     */
    deleteMeasure(id) {
        let temps = []
        this.entityCollection.forEach(entity => {
            if (entity.id.indexOf(id) > -1) {
                temps.push(entity);
            }
        })
        temps.forEach(temp => {
            this.viewer.entities.remove(temp);
            this.entityCollection.splice(this.entityCollection.indexOf(temp), 1);
        })
    }

    /**
     * 测距
     */
    measurePolyLine(callback) {
        let positions = [];
        let labelEntity = null; // 标签实体
        let lineEntity = null;
        this.destoryHandler()
        let measureIndex = 0;
        this.measureIndex++;
        let parentId = "measure_" + this.measureIndex;
        let globe = this.viewer.scene.globe;
        let camera = this.viewer.camera;
        let scene = this.viewer.scene;
        // 注册鼠标左击事件
        this.handler.setInputAction((clickEvent) => {
            // let cartesian = this.viewer.scene.pickPosition(clickEvent.position); // 深度开启时可用坐标
            let cartesian = globe.pick(camera.getPickRay(clickEvent.position), scene);
            // 存储第一个点
            if (!cartesian) {
                return false;
            }
            if (positions.length == 0) {
                positions.push(cartesian.clone());
            }
            positions.push(cartesian);
            labelEntity = null

            this.lastPoint = this.addPoint(cartesian, parentId + "_" + measureIndex);
            measureIndex++;
        }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
        // 注册鼠标移动事件
        this.handler.setInputAction((moveEvent) => {
            // let movePosition = this.viewer.scene.pickPosition(moveEvent.endPosition); // 鼠标移动的点
            let movePosition = globe.pick(camera.getPickRay(moveEvent.endPosition), scene);
            if (!movePosition) {
                if (this.mousetip) {
                    this.mousetip.show = false;
                }
                return false;
            }
            if (this.mousetip) {
                this.mousetip.show = true;
            }
            this.mousemove = movePosition
            if (!this.mousetip) {
                this.mousetip = this.addMouseLabel();
            }
            if (positions.length >= 2) {
                if (!Cesium.defined(lineEntity)) {
                    lineEntity = this.addLine(positions, parentId + "_" + measureIndex);
                    measureIndex++;
                } else {
                    positions.pop();
                    positions.push(movePosition);
                }

                // 绘制label
                if (labelEntity) {
                    this.viewer.entities.remove(labelEntity);
                    this.entityCollection.splice(this.entityCollection.indexOf(labelEntity), 1);
                }
                let center = [positions[positions.length - 2], positions[positions.length - 1]];
                // 计算中点
                let centerPoint = Cesium.Cartesian3.midpoint(center[0], center[1], new Cesium.Cartesian3());
                // 计算距离
                let lengthText = "距离：" + this.getLengthText(center[0], center[1]);

                labelEntity = this.addLabel(centerPoint, lengthText, parentId + "_" + measureIndex);
                measureIndex++;
                this.entityCollection.push(labelEntity);

            }
        }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
        this.handler.setInputAction((clickEvent) => {
            this.viewer.entities.remove(labelEntity);
            this.addClearIcon();
            this.destoryHandler();
            let pick = scene.pick(clickEvent.position);
            if (pick && pick.id && pick.id.point != undefined) {
                if (callback) {
                    callback()
                }
                return
            }
            positions.pop();
            this.entityCollection.splice(this.entityCollection.indexOf(labelEntity), 1);
            if (callback) {
                callback()
            }
        }, Cesium.ScreenSpaceEventType.RIGHT_CLICK)

    };

    /**
     * 测面积
     */
    measurePolygon(callback) {
        let positions = [];
        let clickStatus = false;
        let labelEntity = null;
        this.destoryHandler()
        let measureIndex = 0;
        this.measureIndex++;
        let parentId = "measure_" + this.measureIndex;
        let globe = this.viewer.scene.globe;
        let camera = this.viewer.camera;
        let scene = this.viewer.scene;
        // this.viewer.scene.globe.depthTestAgainstTerrain = false;

        this.handler.setInputAction((clickEvent) => {
            clickStatus = true;
            // let cartesian = this.viewer.scene.pickPosition(clickEvent.position);
            let cartesian = globe.pick(camera.getPickRay(clickEvent.position), scene);

            // console.log(cartesian);

            if (!cartesian) {
                return false
            }
            if (positions.length == 0) {
                positions.push(cartesian.clone()); //鼠标左击 添加第1个点
                this.lastPoint = this.addPoint(cartesian, parentId + "_" + measureIndex);
                measureIndex++;
            } else if (positions.length == 2) {
                if (!cartesian) {
                    return false
                }
                positions.pop();
                positions.push(cartesian.clone()); // 鼠标左击 添加第2个点
                this.lastPoint = this.addPoint(cartesian, parentId + "_" + measureIndex);
                measureIndex++;
                this.addPolyGon(positions, parentId + "_" + measureIndex);
                measureIndex++;
            } else if (positions.length >= 3) {
                if (!cartesian) {
                    return false
                }
                positions.pop();
                positions.push(cartesian.clone()); // 鼠标左击 添加第3个点
                this.lastPoint = this.addPoint(cartesian, parentId + "_" + measureIndex);
                measureIndex++;
            }

        }, Cesium.ScreenSpaceEventType.LEFT_CLICK);


        this.handler.setInputAction((moveEvent) => {
            // let movePosition = this.viewer.scene.pickPosition(moveEvent.endPosition);
            let movePosition = globe.pick(camera.getPickRay(moveEvent.endPosition), scene);//depthTestAgainstTerrain关闭时使用
            // console.log(movePosition);
            if (!movePosition) {
                if (this.mousetip) {
                    this.mousetip.show = false;
                }
                return false;
            }
            if (this.mousetip) {
                this.mousetip.show = true;
            }
            this.mousemove = movePosition
            if (!this.mousetip) {
                this.mousetip = this.addMouseLabel();
            }
            if (positions.length == 0) {
                return
            }
            if (positions.length == 1) {
                positions.push(movePosition);
                this.addLine(positions, parentId + "_" + measureIndex);
                measureIndex++;
            } else {
                if (clickStatus) {
                    positions.push(movePosition);
                } else {
                    positions.pop();
                    positions.push(movePosition);
                }
            }

            if (positions.length >= 3) {
                // 绘制label
                if (labelEntity) {
                    this.viewer.entities.remove(labelEntity);
                    this.entityCollection.splice(this.entityCollection.indexOf(labelEntity), 1);
                }

                let text = "面积：" + this.getArea(positions);
                let centerPoint = this.getCenterOfGravityPoint(positions);
                labelEntity = this.addLabel(centerPoint, text, parentId + "_" + measureIndex);
                measureIndex++;

                this.entityCollection.push(labelEntity);
            }


            clickStatus = false;
        }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);


        // 右击结束
        this.handler.setInputAction((clickEvent) => {
            if (positions.length == 0) {
                return
            }
            // let clickPosition = this.viewer.scene.pickPosition(clickEvent.position);
            // // let clickPosition = this.viewer.scene.globe.pick(this.viewer.camera.getPickRay(clickEvent.position), this.viewer.scene);
            // // console.log(clickPosition);
            // if (!clickPosition) {
            //     return false;
            // }
            // positions.pop();
            // positions.push(clickPosition);
            // positions.push(positions[0]); // 闭合
            // this.addPoint(clickPosition);
            this.addClearIcon();
            this.destoryHandler();
            if (callback) {
                callback()
            }

        }, Cesium.ScreenSpaceEventType.RIGHT_CLICK);
    };

    /**
     * 测高
     */
    measureHeight(callback) {
        let positions = [];
        let labelEntity_1 = null; // 标签实体
        let labelEntity_2 = null; // 标签实体
        let labelEntity_3 = null; // 标签实体
        let globe = this.viewer.scene.globe;
        let camera = this.viewer.camera;
        let scene = this.viewer.scene;

        // 注册鼠标左击事件
        this.handler.setInputAction((clickEvent) => {
            // let cartesian = this.viewer.scene.pickPosition(clickEvent.position); // 坐标
            let cartesian = globe.pick(camera.getPickRay(clickEvent.position), scene);

            // 存储第一个点

            if (positions.length == 0) {
                if (!cartesian) {
                    return false
                }
                positions.push(cartesian.clone());
                this.addPoint(cartesian);

                // 注册鼠标移动事件
                this.handler.setInputAction((moveEvent) => {
                    // let movePosition = this.viewer.scene.pickPosition(moveEvent.endPosition); // 鼠标移动的点
                    let movePosition = globe.pick(camera.getPickRay(moveEvent.endPosition), scene);
                    if (!movePosition) {
                        return false
                    }
                    if (positions.length >= 2) {
                        positions.pop();
                        positions.pop();
                        positions.pop();

                        let cartographic = Cesium.Cartographic.fromCartesian(movePosition);
                        let height = Cesium.Cartographic.fromCartesian(positions[0]).height;

                        let verticalPoint = Cesium.Cartesian3.fromDegrees(Cesium.Math.toDegrees(cartographic.longitude), Cesium.Math.toDegrees(cartographic.latitude), height);
                        positions.push(verticalPoint);
                        positions.push(movePosition);
                        positions.push(positions[0]);

                        // 绘制label
                        if (labelEntity_1) {
                            this.viewer.entities.remove(labelEntity_1);
                            this.entityCollection.splice(this.entityCollection.indexOf(labelEntity_1), 1);
                            this.viewer.entities.remove(labelEntity_2);
                            this.entityCollection.splice(this.entityCollection.indexOf(labelEntity_2), 1);
                            this.viewer.entities.remove(labelEntity_3);
                            this.entityCollection.splice(this.entityCollection.indexOf(labelEntity_3), 1);
                        }

                        // 计算中点
                        let centerPoint_1 = Cesium.Cartesian3.midpoint(positions[0], positions[1], new Cesium.Cartesian3());
                        // 计算距离
                        let lengthText_1 = "水平距离：" + this.getLengthText(positions[0], positions[1]);

                        labelEntity_1 = this.addLabel(centerPoint_1, lengthText_1);
                        this.entityCollection.push(labelEntity_1);

                        // 计算中点
                        let centerPoint_2 = Cesium.Cartesian3.midpoint(positions[1], positions[2], new Cesium.Cartesian3());
                        // 计算距离
                        let lengthText_2 = "垂直距离：" + this.getLengthText(positions[1], positions[2]);

                        labelEntity_2 = this.addLabel(centerPoint_2, lengthText_2);
                        this.entityCollection.push(labelEntity_2);

                        // 计算中点
                        let centerPoint_3 = Cesium.Cartesian3.midpoint(positions[2], positions[3], new Cesium.Cartesian3());
                        // 计算距离
                        let lengthText_3 = "直线距离：" + this.getLengthText(positions[2], positions[3]);

                        labelEntity_3 = this.addLabel(centerPoint_3, lengthText_3);
                        this.entityCollection.push(labelEntity_3);

                    } else {
                        let verticalPoint = new Cesium.Cartesian3(movePosition.x, movePosition.y, positions[0].z);
                        positions.push(verticalPoint);
                        positions.push(movePosition);
                        positions.push(positions[0]);
                        // 绘制线
                        this.addLine(positions);
                    }
                }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
            } else {
                // 存储第二个点
                positions.pop();
                positions.pop();
                positions.pop();
                let cartographic = Cesium.Cartographic.fromCartesian(cartesian);
                let height = Cesium.Cartographic.fromCartesian(positions[0]).height;

                let verticalPoint = Cesium.Cartesian3.fromDegrees(Cesium.Math.toDegrees(cartographic.longitude), Cesium.Math.toDegrees(cartographic.latitude), height);
                positions.push(verticalPoint);
                positions.push(cartesian);
                positions.push(positions[0]);
                this.addPoint(cartesian);
                this.handler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_CLICK);
                this.handler.removeInputAction(Cesium.ScreenSpaceEventType.MOUSE_MOVE);

                if (callback) {
                    callback()
                }
            }
        }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
    };

    /**
     * 添加点
     * @param position
     * @param id
     */
    addPoint(position, id) {
        let entity = this.viewer.entities.add(new Cesium.Entity({
            position: position,
            id: id,
            point: {
                color: Cesium.Color.BLUE,
                pixelSize: 8,
                heightReference: Cesium.HeightReference.CLAMP_TO_GROUND
            }
        }))
        this.entityCollection.push(entity);
        return entity;
    };

    /**
     * 添加线
     * @param positions
     * @param id
     */
    addLine(positions, id) {
        let dynamicPositions = new Cesium.CallbackProperty(() => {
            return positions;
        }, false);
        let entity = this.viewer.entities.add(new Cesium.Entity({
            id: id,
            polyline: {
                positions: dynamicPositions,
                width: 2,
                arcType: Cesium.ArcType.RHUMB,
                clampToGround: true,
                material: Cesium.Color.RED, //获取或设置折线的表面外观
                heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,

            }
        }))
        this.entityCollection.push(entity);
        return entity;
    };

    /**
     * 添加面
     * @param positions
     * @param id
     */
    addPolyGon(positions, id) {
        let dynamicPositions = new Cesium.CallbackProperty(() => {
            return new Cesium.PolygonHierarchy(positions);
        }, false);
        this.entityCollection.push(this.viewer.entities.add(new Cesium.Entity({
            id: id,
            polygon: {
                hierarchy: dynamicPositions,
                arcType: Cesium.ArcType.RHUMB,
                material: Cesium.Color.RED.withAlpha(0.6),
                classificationType: Cesium.ClassificationType.BOTH // 贴地表和贴模型,如果设置了，这不能使用挤出高度
            }
        })));
    };

    /**
     * 添加标签
     * @param centerPoint
     * @param text
     * @param id
     */
    addLabel(centerPoint, text, id) {
        return this.viewer.entities.add(new Cesium.Entity({
            position: centerPoint,
            id: id,
            label: {
                text: text,
                font: '14px sans-serif',
                style: Cesium.LabelStyle.FILL_AND_OUTLINE, //FILL  FILL_AND_OUTLINE OUTLINE
                fillColor: Cesium.Color.YELLOW,
                showBackground: true, //指定标签后面背景的可见性
                backgroundColor: new Cesium.Color(0.165, 0.165, 0.165, 0.8), // 背景颜色
                backgroundPadding: new Cesium.Cartesian2(6, 6), //指定以像素为单位的水平和垂直背景填充padding
                pixelOffset: new Cesium.Cartesian2(0, 0),
                // disableDepthTestDistance: Number.POSITIVE_INFINITY
            }
        }));
    };

    /**
     * 添加鼠标提示
     * @param movePosition
     */
    addMouseLabel(movePosition) {
        let self = this;
        let dynamicPosition = new Cesium.CallbackProperty(() => {
            return self.mousemove;
        }, false);
        return this.viewer.entities.add(new Cesium.Entity({
            id: 'mousemeasuretip',
            position: dynamicPosition,
            label: {
                text: "左键开始\n右键结束",
                font: '12px sans-serif',
                style: Cesium.LabelStyle.FILL, //FILL  FILL_AND_OUTLINE OUTLINE
                fillColor: Cesium.Color.WHITE,
                showBackground: false, //指定标签后面背景的可见性
                pixelOffset: new Cesium.Cartesian2(30, -20),
            }
        }));
    }

    /**
     * 添加测量删除按钮
     */
    addClearIcon() {
        if (this.lastPoint != null) {
            this.lastPoint.label = new Cesium.LabelGraphics({
                text: "×",
                scale: 1,
                pixelOffset: new Cesium.Cartesian2(15, -15),
                heightReference: Cesium.HeightReference.NONE
            })
            this.lastPoint.label.measure = true
        }

    }

    /**
     * 计算两点距离
     * @param firstPoint
     * @param secondPoint
     */
    getLengthText(firstPoint, secondPoint) {
        // 计算距离
        let length = Cesium.Cartesian3.distance(firstPoint, secondPoint);
        if (length > 1000) {
            length = (length / 1000).toFixed(2) + "km";
        } else {
            length = length.toFixed(2) + "m";
        }
        return length;
    };

    getArea(points) {
        let ps = []
        for (let i = 0; i < points.length; i++) {
            let cartographic = Cesium.Ellipsoid.WGS84.cartesianToCartographic(points[i]);
            let height = this.viewer.scene.globe.getHeight(cartographic);
            let point = Cesium.Cartesian3.fromDegrees(cartographic.longitude / Math.PI * 180, cartographic.latitude / Math.PI * 180, height);
            ps.push(point)
        }
        let s = 0;
        for (let i = 0; i < ps.length; i++) {
            let p1 = ps[i];
            let p2;
            if (i < ps.length - 1)
                p2 = ps[i + 1];
            else
                p2 = ps[0];
            s += p1.x * p2.y - p2.x * p1.y;
        }
        let res

        if (s < 1000000) {
            res = Math.abs(s).toFixed(4) + " 平方米";
        } else {
            res = Math.abs((s / 1000000.0).toFixed(4)) + " 平方公里";
        }

        return res;
    }


    /**
     * 计算多边形的中心（简单的处理）
     * @param mPoints
     * @returns {*[]}
     */
    getCenterOfGravityPoint(mPoints) {
        let centerPoint = mPoints[0];
        for (let i = 1; i < mPoints.length; i++) {
            centerPoint = Cesium.Cartesian3.midpoint(centerPoint, mPoints[i], new Cesium.Cartesian3());
        }
        return centerPoint;
    }

}
