/******************************************************************************
 * Spine Runtimes License Agreement
 * Last updated January 1, 2020. Replaces all prior versions.
 *
 * Copyright (c) 2013-2020, Esoteric Software LLC
 *
 * Integration of the Spine Runtimes into software or otherwise creating
 * derivative works of the Spine Runtimes is permitted under the terms and
 * conditions of Section 2 of the Spine Editor License Agreement:
 * http://esotericsoftware.com/spine-editor-license
 *
 * Otherwise, it is permitted to integrate the Spine Runtimes into software
 * or otherwise create derivative works of the Spine Runtimes (collectively,
 * "Products"), provided that each user of the Products must obtain their own
 * Spine Editor license and redistribution of the Products in any form must
 * include this license and copyright notice.
 *
 * THE SPINE RUNTIMES ARE PROVIDED BY ESOTERIC SOFTWARE LLC "AS IS" AND ANY
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL ESOTERIC SOFTWARE LLC BE LIABLE FOR ANY
 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES,
 * BUSINESS INTERRUPTION, OR LOSS OF USE, DATA, OR PROFITS) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
 * THE SPINE RUNTIMES, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 *****************************************************************************/

module spine.webgl {
	export class CameraController {
		private minZoom = 0.1;
		private maxZoom = 10;
		private zoomSpeed = 0.05;
		private panSpeed = 1.0;
		private isDragging = false;
		private lastX = 0;
		private lastY = 0;
		private initialZoom = 0;
		private cameraX = 0;
		private cameraY = 0;
		private mouseX = 0;
		private mouseY = 0;

		constructor (public canvas: HTMLElement, public camera: OrthoCamera) {
			new Input(canvas).addListener({
				down: (x: number, y: number) => {
					this.isDragging = true;
					this.cameraX = this.camera.position.x;
					this.cameraY = this.camera.position.y;
					this.mouseX = this.lastX = x;
					this.mouseY = this.lastY = y;
					this.initialZoom = this.camera.zoom;
				},
				dragged: (x: number, y: number) => {
					if (!this.isDragging) return;
					
					const deltaX = x - this.mouseX;
					const deltaY = y - this.mouseY;
					
					const originWorld = this.camera.screenToWorld(new Vector3(0, 0), this.canvas.clientWidth, this.canvas.clientHeight);
					const deltaWorld = this.camera.screenToWorld(new Vector3(deltaX, deltaY), this.canvas.clientWidth, this.canvas.clientHeight).sub(originWorld);
					
					this.camera.position.set(
						this.cameraX - deltaWorld.x * this.panSpeed,
						this.cameraY - deltaWorld.y * this.panSpeed,
						0
					);
					
					this.camera.update();
					this.lastX = x;
					this.lastY = y;
				},
				wheel: (delta: number, deltaMode?: number) => {
					// 处理不同浏览器的滚轮事件差异
					let scaledDelta: number;
					const zoomFactor = 0.1;
					
					// 根据deltaMode调整缩放程度
					if (deltaMode === WheelEvent.DOM_DELTA_LINE) {
						// DOM_DELTA_LINE模式，通常每次滚动是3行
						scaledDelta = delta < 0 ? zoomFactor : -zoomFactor;
					} else {
						// DOM_DELTA_PIXEL模式，根据滚动像素计算平滑缩放
						scaledDelta = delta < 0 ? 
							Math.min(zoomFactor, Math.abs(delta) * 0.0005) : 
							Math.max(-zoomFactor, delta * -0.0005);
					}
					
					// 直接计算新的缩放值
					const newZoom = this.camera.zoom + scaledDelta;
					
					// 应用缩放，确保在最小和最大缩放范围内
					if (newZoom >= this.minZoom && newZoom <= this.maxZoom) {
						const mouseX = this.lastX;
						const mouseY = this.lastY;
						
						// 计算缩放前鼠标位置在世界坐标中的位置
						const oldDistance = this.camera.screenToWorld(new Vector3(mouseX, mouseY), this.canvas.clientWidth, this.canvas.clientHeight);
						
						// 更新缩放值
						this.camera.zoom = newZoom;
						this.camera.update();
						
						// 计算缩放后鼠标位置在世界坐标中的位置
						const newDistance = this.camera.screenToWorld(new Vector3(mouseX, mouseY), this.canvas.clientWidth, this.canvas.clientHeight);
						
						// 调整相机位置，确保鼠标下的点保持不变
						this.camera.position.add(oldDistance.sub(newDistance));
						this.camera.update();
					}
				},
				zoom: (initialDistance: number, distance: number) => {
					const newZoom = this.initialZoom * (initialDistance / distance);
					if (newZoom >= this.minZoom && newZoom <= this.maxZoom) {
						this.camera.zoom = newZoom;
						this.camera.update();
					}
				},
				up: (x: number, y: number) => {
					this.isDragging = false;
					this.lastX = x;
					this.lastY = y;
				},
				moved: (x: number, y: number) => {
					this.lastX = x;
					this.lastY = y;
				},
			});
		}
	}
}