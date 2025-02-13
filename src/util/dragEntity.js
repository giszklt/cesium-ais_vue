/**
 * @param {Viewer} viewer
 *
 */
export default class DragEntity{
	constructor(val){
		this.viewer = val
	}
	addEntity(value){
		//数据格式{id:543595234324_432423,position:[122.8,39.9],text:"L"}
		let pinBuilder = new Cesium.PinBuilder();
		let poin = this.viewer.entities.add({
			id:value.id,
			name: value.name,
			position: Cesium.Cartesian3.fromDegrees(value.position.x, value.position.y),
			billboard: {
				image: pinBuilder.fromText(value.text,Cesium.Color.ROYALBLUE, 48).toDataURL(),
				verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
			},
			monitoItems:{
				data:value
			},
		});
		return poin
	}

}
