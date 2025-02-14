/*
 * @Description: 卫星放射效果
 * @Version: 3.0
 * @Author: CL
 * @Date: 2023-02-18
 */
export default class CylinderReverseBlurMaterialProperty {
	constructor(options) {
		this._definitionChanged = new Cesium.Event()
		this._color = undefined
		this.color = options.color
		this.offset = options.offset // 圆环移动速率 浮点数 （数值越大速度越快）
		this.speed = options.speed // 放射效果速率 浮点数 （数值越大速度越快）
		this.repeat = options.repeat // 圆环个数 浮点数 （数值越大圆环越多）
		this.thickness = options.thickness // 圆环粗细 (圆环个数增大也会随之变细)
		this._time = (new Date()).getTime() + 10000
	};

	get isConstant() {
		return false
	}

	get definitionChanged() {
		return this._definitionChanged
	}

	getType(time) {
		return Cesium.Material.CylinderReverseBlurMaterialType
	}

	getValue(time, result) {
		if (!Cesium.defined(result)) {
			result = {}
		}

		result.color = Cesium.Property.getValueOrDefault(this._color, time, Cesium.Color.RED, result.color)
		return result
	}

	equals(other) {
		return (this === other ||
			(other instanceof CylinderReverseBlurMaterialProperty &&
				Cesium.Property.equals(this._color, other._color))
		)
	}
}

Object.defineProperties(CylinderReverseBlurMaterialProperty.prototype, {
	ifCinstant: {
		get: function () {
			return false
		}
	},
	color: Cesium.createPropertyDescriptor('color')
})

CylinderReverseBlurMaterialProperty.prototype.getType = function (time) {
	return 'CylinderReverseBlurMaterialType'
}

CylinderReverseBlurMaterialProperty.prototype.getValue = function (time, result) {
	if (!Cesium.defined(result)) {
		result = {}
	}
	result.color = Cesium.Property.getValueOrClonedDefault(this._color, time, Cesium.Color.WHITE, result.color)
	result.speed = this.speed || 10
	result.offset = this.offset || 10
	result.repeat = this.repeat || 100
	result.thickness = this.thickness || 0.2
	return result
}

CylinderReverseBlurMaterialProperty.prototype.equals = function (other) {
	return this === other ||
		(other instanceof CylinderReverseBlurMaterialProperty &&
			Cesium.Property.equals(this._color, other._color) &&
			this.repeat == other.repeat &&
			this.offset == other.offset &&
			this.speed == other.speed &&
			this.thickness == other.thickness
		)

}

Cesium.CylinderReverseBlurMaterialProperty = CylinderReverseBlurMaterialProperty
Cesium.Material.CylinderReverseBlurMaterialProperty = 'CylinderReverseBlurMaterialProperty'
Cesium.Material.CylinderReverseBlurMaterialType = 'CylinderReverseBlurMaterialType'
Cesium.Material.CylinderReverseBlurMaterialSource = `
                            uniform vec4 color;
                            uniform float repeat;
                            uniform float thickness;
                            uniform float offset;
                            uniform float speed;
                            czm_material czm_getMaterial(czm_materialInput materialInput)
                            {
                                    czm_material material = czm_getDefaultMaterial(materialInput);
                                    float sp = 1.0/repeat;
                                    vec2 st = materialInput.st;
                                    float dis = distance(st, vec2(0.5, 0.5));
                                    float offsets = fract(-czm_frameNumber * offset / 10000.0);
                                    float m = mod(dis - sin(offsets), sp);
                                    float a = step(sp*(1.0-thickness), m);
                                    material.diffuse = color.rgb;
                                    material.alpha = a * color.a;
                                    return material;
                            }

                                            `


// Cesium.Material.CylinderBlurMaterialSource = `
//                             uniform vec4 color;
//                             uniform float repeat;
//                             uniform float thickness;
//                             uniform float offset;
//                             uniform float speed;
//                             czm_material czm_getMaterial(czm_materialInput materialInput)
//                             {
// czm_material material = czm_getDefaultMaterial(materialInput);
// float sp = 1.0/repeat;
// vec2 st = materialInput.st;
// float dis = distance(st,vec2(0.5,0.5) );
// float time =  fract(czm_frameNumber * speed / 2500.0);
// float offsets = fract(czm_frameNumber * offset / 10000.0);
// float r = 0.00001 + sin(time);
// float a = 0.0;
// if(dis < r ) {
//   a = 1.0 - smoothstep(0.00002, r, dis);
// }
// float m = mod(dis - sin(offsets), sp);
// float b = step(sp*(1.0-thickness), m);
// material.diffuse = color.rgb * 1.5;
// material.alpha =b * color.a *a  * 1.5;
// return material;
//                             }
//
//                                             `



// Cesium.Material.CylinderBlurMaterialSource = `
//                             uniform vec4 color;
//                             uniform float repeat;
//                             uniform float thickness;
//                             uniform float offset;
//                             uniform float speed;
//                             czm_material czm_getMaterial(czm_materialInput materialInput)
//                             {
// czm_material material = czm_getDefaultMaterial(materialInput);
// float sp = 1.0/repeat;
// vec2 st = materialInput.st;
// float dis = distance(st, vec2(0.5));
// float time =  fract(czm_frameNumber * speed / 2500.0);
// float offsets = fract(czm_frameNumber * offset / 10000.0);
// float m = mod(dis - sin(offsets), sp);
// float b = step(sp*(1.0-thickness), m);
// float r = 0.00001 + sin(time);
// float a = 1.0;
// if(dis < r ) {
//   a = 1.0 - smoothstep(0.00002, r, dis);
// }
// material.diffuse = color.rgb;
// material.alpha = b * a * color.a;
// return material;
//                             }
//
//                                             `




Cesium.Material._materialCache.addMaterial(Cesium.Material.CylinderReverseBlurMaterialType, {
	fabric: {
		type: Cesium.Material.CylinderReverseBlurMaterialType,
		uniforms: {
			color: new Cesium.Color(1.0, 1.0, 1.0, 1.0),
			repeat: 100.0,
			speed: 10,
			offset: 10,
			thickness: 0.2
		},
		source: Cesium.Material.CylinderReverseBlurMaterialSource
	},
	translucent: function (material) {
		return true
	}
})
