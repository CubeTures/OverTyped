import * as glm from "gl-matrix";
import type { InitBufferReturn } from "./init-buffers.ts";
import type { ProgramInfo, Actor } from "./render-start.ts";
import { captureOwnerStack } from "react";
import gamestate from "@/lib/gamestate.ts";

interface Light {
	exists: boolean;
	position?: number[];
	color?: number[];
	is_spotlight?: boolean;
	a?: number[];
	theta?: number;
	alpha?: number;
}

let lastEyeLoc: glm.vec3 = [0.0, 4, 8.5];
let lastCenterLoc: glm.vec3 = [0.0, 0.0, 0.0];
let lastLocalUpVal: glm.vec3 = [0.0, 1.0, 0.0];
let prevCubeRotation: number = 0.0;
let stage = 0;

// actual values
let actualProgress = [0, 0, 0];
let playerCount = 0;

function setStage(s: number) {
	stage = s;
}

function setPlayerCount(p: number) {
	playerCount = p;
	console.log(playerCount);
}

function drawScene(
	gl: WebGLRenderingContext,
	programInfo: ProgramInfo,
	actors: Actor[],
	cubeRotation: number,
	deltaTime: number
) {
	// SETTING -> if want different background, change here
	gl.clearColor(100/255, 132/255, 176/255, 1.0); // Set Background: rgb, transparency
	gl.clearDepth(1.0); // Clear everything
	gl.enable(gl.DEPTH_TEST); // Enable depth testing
	gl.depthFunc(gl.LEQUAL); // Near things obscure far things
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT); // Clear canvas

	const projectionMatrix = createProjectionMatrix(gl, cubeRotation, stage);
	const [viewMatrix, eye] = createViewMatrix(cubeRotation, stage);

	while (gamestate.progress.length < 3) gamestate.progress.push(0);

	let diffProgress: glm.vec3 = [0, 0, 0];
	glm.vec3.subtract(diffProgress, gamestate.progress, actualProgress);

	let dp = multiplyVec(divideVec(diffProgress, deltaTime), 0.0001);

	glm.vec3.add(actualProgress, actualProgress, dp);

	/* Stuff independent of current actor */
	for (let i = 0; i < actors.length; i++) {
        if (stage != 0 && actors[i].type == "Floor") {
            let material = Object.values(actors[i].buffers.materials)[0]
            material.Kd = [0, 0, 0]
            material.Ks = [0, 0, 0]
			material.Ka = [0, 0, 0]
        }
		actors[i].modelMatrix = createModelMatrix(
			gl,
			stage,
			i,
			cubeRotation,
			actualProgress,
			playerCount
		);
	}

	// Tell WebGL to use our program when drawing
	gl.useProgram(programInfo.program);

	gl.uniformMatrix4fv(
		programInfo.uniformLocations.projectionMatrix,
		false,
		projectionMatrix
	);
	gl.uniformMatrix4fv(
		programInfo.uniformLocations.viewMatrix,
		false,
		viewMatrix
	);
	gl.uniform3fv(programInfo.uniformLocations.eye, new Float32Array(eye));

	sendLights(gl, programInfo, stage == 0, actualProgress, playerCount);
	sendMaterials(gl, programInfo, actors);

	/* Stuff dependent on current actor */
	for (let i = 0; i < actors.length; i++) {
		if ((stage == 0 || stage == 1) && (i == 1 || i == 3 || i == 4))
			continue;

		let curr = actors[i];
		if (curr.type === "Wheel") continue;

		// Sending model and normal matrices
		const normalMatrix = glm.mat4.create();
		glm.mat4.invert(normalMatrix, curr.modelMatrix ?? glm.mat4.create());
		glm.mat4.transpose(normalMatrix, normalMatrix);
		gl.uniformMatrix4fv(
			programInfo.uniformLocations.modelMatrix,
			false,
			curr.modelMatrix ?? glm.mat4.create()
		);
		gl.uniformMatrix4fv(
			programInfo.uniformLocations.normalMatrix,
			false,
			normalMatrix
		);

		// Tell WebGL how to pull out stuff from the buffers into the shader's attribute variable.
		setPositionAttribute(gl, curr.buffers, programInfo);
		setTextureAttribute(gl, curr.buffers, programInfo);
		setNormalAttribute(gl, curr.buffers, programInfo);
		setMaterialIndexAttribute(gl, curr.buffers, programInfo);
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, curr.buffers.indices); // Tell WebGL which indices to use to index the vertices

		// Texture
		if (curr.texture != undefined) {
			// Tell WebGL we want to affect texture unit 0
			gl.activeTexture(gl.TEXTURE0);
			// Bind the texture to texture unit 0
			gl.bindTexture(gl.TEXTURE_2D, curr.texture);
			// Tell the shader we bound the texture to texture unit 0
			gl.uniform1i(programInfo.uniformLocations.uSampler, 0);
		}

		//Drawing
		{
			const vertexCount = curr.buffers.indices.numItems;
			const type = gl.UNSIGNED_SHORT;
			const offset = 0;
			gl.drawElements(gl.TRIANGLES, vertexCount, type, offset);
		}

		// Drawing wheels on cars
		if (curr.type === "Car") {
			let wheelActor: Actor;
			for (let j = 0; j < actors.length; j++) {
				if (actors[j].type == "Wheel") {
					wheelActor = actors[j];
					//SETTING -> can change wheel speed here
					const wheel_speedup = stage == 2 ? 10.0 : 0.0;
					drawCarWheels(
						gl,
						programInfo,
						wheelActor,
						curr.modelMatrix ?? glm.mat4.create(),
						cubeRotation,
						wheel_speedup
					);
					break;
				}
			}
		}
	}

}

const progressMult = 700;

// SETTING -> can change transformations
function createModelMatrix(
	gl: WebGLRenderingContext,
	stage: number,
	iteration: number,
	cubeRotation: number,
	progress: number[],
	playerCount: number
): glm.mat4 {
	const modelMatrix = glm.mat4.create();
	// Floor
	if(iteration == 2)
	{
		glm.mat4.scale(modelMatrix, modelMatrix, [100, -0.001, 100]);
		glm.mat4.translate(modelMatrix, modelMatrix, [0, -1, 0.0]);
	}

	if (stage == 0 || stage == 1) {
		// Car 1
		if (iteration == 0) {
			glm.mat4.translate(modelMatrix, modelMatrix, [0.0, 0, 0]);
			glm.mat4.rotate(modelMatrix, modelMatrix, toRadian(180), [0, 1, 0]);
		}
		// Car 2
		else if (iteration == 1) {
			glm.mat4.translate(modelMatrix, modelMatrix, [-3.0, 2, -7.0]);
			glm.mat4.rotate(modelMatrix, modelMatrix, cubeRotation, [0, 1, 0]);
			// Floor
		}
	} else if (stage == 2) {
		// Car 1
		if (iteration == 0) {
			glm.mat4.rotate(modelMatrix, modelMatrix, toRadian(180), [0, 1, 0]);
		}
		// Car 2
		else if (iteration == 1) {
			glm.mat4.translate(modelMatrix, modelMatrix, [
				-3,
				playerCount >= 1 ? 0 : -100,
				-progress[0] * progressMult,
			]);
			glm.mat4.rotate(modelMatrix, modelMatrix, toRadian(180), [0, 1, 0]);
		}
		// Car 3
		else if (iteration == 3) {
			glm.mat4.translate(modelMatrix, modelMatrix, [
				-6,
				playerCount >= 2 ? 0 : -100,
				-progress[1] * progressMult,
			]);
			glm.mat4.rotate(modelMatrix, modelMatrix, toRadian(180), [0, 1, 0]);
		}
		// Car 4
		else if (iteration == 4) {
			glm.mat4.translate(modelMatrix, modelMatrix, [
				-9,
				playerCount >= 3 ? 0 : -100,
				-progress[2] * progressMult,
			]);
			glm.mat4.rotate(modelMatrix, modelMatrix, toRadian(180), [0, 1, 0]);
		}
	}
	return modelMatrix;
}

// SETTING -> can change fov, aspect ratio, and other camera style settings
function createProjectionMatrix(
	gl: WebGLRenderingContext,
	cubeRotation: number,
	stage: number
): glm.mat4 {
	let fieldOfView = toRadian(45); // in radians
	if (stage == 1) {
		cubeRotation *= 10; // Do this multiplication to match camera
		let delta = cubeRotation - prevCubeRotation;
		delta /= 50;
		if (delta < 1.0) {
			fieldOfView = toRadian(45 + delta * (30 - 45));
		} else {
			fieldOfView = toRadian(30);
		}
	} else if (stage == 2) {
		fieldOfView = toRadian(30);
	}
	const aspect =
		(gl.canvas as HTMLCanvasElement).clientWidth /
		(gl.canvas as HTMLCanvasElement).clientHeight;
	const zNear = 0.1;
	const zFar = 100.0;

	const projectionMatrix = glm.mat4.create();
	return glm.mat4.perspective(
		projectionMatrix,
		fieldOfView,
		aspect,
		zNear,
		zFar
	);
}

// SETTING -> can change location and orientation of camera
function createViewMatrix(
	cubeRotation: number,
	stage: number
): [glm.mat4, glm.vec3] {
	cubeRotation *= 10;
	let eye: glm.vec3 = [0.0, 4, 8.5];
	const up: glm.vec3 = [0.0, 1.0, 0.0];
	let center: glm.vec3 = [0.0, 0.0, 0.0];
	let localUp: glm.vec3 = [0.0, 1.0, 0.0];

	// Rotation
	// [eye, localUp] = cameraRotate(cubeRotation, 0, eye, up, center);
	// translation
	// [eye, center] = cameraTranslate(cubeRotation, cubeRotation, eye, localUp, center);

	if (stage == 0) {
		eye = [0.0, 5, 8.5];
		[eye, localUp] = cameraRotate(cubeRotation, 0, eye, up, center);
		lastEyeLoc = eye;
		lastCenterLoc = center;
		lastLocalUpVal = localUp;
		prevCubeRotation = cubeRotation;
	} else if (stage == 1) {
		let goal_eye = [
			5.312665357535245, 2.4108821800101907, -8.483851754707231,
		];
		let goal_center = [
			-1.9835334873744237, 1.7891077449668553, -2.0507081389845756,
		];
		let goal_localUp = [
			-0.12335341423749924, 0.9863846302032471, 0.10876214504241943,
		];

		let delta = cubeRotation - prevCubeRotation;
		delta /= 50;

		if (delta < 1.0) {
			eye = computeBezier(lastEyeLoc, goal_eye, delta);
			center = computeBezier(lastCenterLoc, goal_center, delta);
			localUp = computeBezier(lastLocalUpVal, goal_localUp, delta);
		} else {
			eye = goal_eye;
			center = goal_center;
			localUp = goal_localUp;
		}
	} else if (stage == 2) {
		eye = [5.312665357535245, 2.4108821800101907, -8.483851754707231];
		center = [-1.9835334873744237, 1.7891077449668553, -2.0507081389845756];
		localUp = [
			-0.12335341423749924, 0.9863846302032471, 0.10876214504241943,
		];
	}

	const viewMatrix = glm.mat4.create();
	return [glm.mat4.lookAt(viewMatrix, eye, center, localUp), eye];
}

function drawCarWheels(
	gl: WebGLRenderingContext,
	programInfo: ProgramInfo,
	wheelActor: Actor,
	carModelMatrix: glm.mat4,
	cubeRotation: number,
	wheel_speedup: number
) {
	// These Attributes are the same for all wheels
	setPositionAttribute(gl, wheelActor.buffers, programInfo);
	setTextureAttribute(gl, wheelActor.buffers, programInfo);
	setNormalAttribute(gl, wheelActor.buffers, programInfo);
	setMaterialIndexAttribute(gl, wheelActor.buffers, programInfo);
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, wheelActor.buffers.indices); // Tell WebGL which indices to use to index the vertices

	// Texture is same for all wheels
	if (wheelActor.texture != undefined) {
		// Tell WebGL we want to affect texture unit 0
		gl.activeTexture(gl.TEXTURE0);
		// Bind the texture to texture unit 0
		gl.bindTexture(gl.TEXTURE_2D, wheelActor.texture);
		// Tell the shader we bound the texture to texture unit 0
		gl.uniform1i(programInfo.uniformLocations.uSampler, 0);
	}

	let delta = cubeRotation * wheel_speedup;

	for (
		let i = 0;
		i < 4;
		i++ // Cars have 4 wheels
	) {
		wheelActor.modelMatrix = glm.mat4.clone(carModelMatrix);

		glm.mat4.translate(wheelActor.modelMatrix, wheelActor.modelMatrix, [
			0.8 * (i % 2 == 0 ? -1 : 1),
			0.35,
			1.15 * (i < 2 ? -1 : 1),
		]);
		glm.mat4.rotate(
			wheelActor.modelMatrix,
			wheelActor.modelMatrix,
			delta,
			[1, 0, 0]
		);
		if (i % 2 == 1)
			glm.mat4.rotate(
				wheelActor.modelMatrix,
				wheelActor.modelMatrix,
				toRadian(180),
				[0, 1, 0]
			);

		const normalMatrix = glm.mat4.create();
		glm.mat4.invert(
			normalMatrix,
			wheelActor.modelMatrix ?? glm.mat4.create()
		);
		glm.mat4.transpose(normalMatrix, normalMatrix);
		gl.uniformMatrix4fv(
			programInfo.uniformLocations.modelMatrix,
			false,
			wheelActor.modelMatrix ?? glm.mat4.create()
		);
		gl.uniformMatrix4fv(
			programInfo.uniformLocations.normalMatrix,
			false,
			normalMatrix
		);

		//Drawing
		{
			const vertexCount = wheelActor.buffers.indices.numItems;
			const type = gl.UNSIGNED_SHORT;
			const offset = 0;
			gl.drawElements(gl.TRIANGLES, vertexCount, type, offset);
		}
	}
}

//SETTING -> location of lights
function sendLights(
	gl: WebGLRenderingContext,
	programInfo: ProgramInfo,
	light0on: boolean,
	progress: number[],
	playerCount: number
) {
	const num_lights = 10;
	var light0: Light = {
		exists: true,
		position: [0.0, 15.0, 0.0],
		color: [0.5, 0.5, 0.5],
		is_spotlight: light0on,
		a: [0.0, -1.0, 0.0],
		theta: ((light0on ? 15.0 : 8.0) * Math.PI) / 180,
		alpha: 10.0,
	};

	let modelMatrix2 = glm.mat4.create();
	glm.mat4.translate(modelMatrix2, modelMatrix2, [
				-3,
				playerCount >= 1 ? 0 : -100,
				-progress[0] * progressMult,
	]);
	let modelMatrix3 = glm.mat4.create();
	glm.mat4.translate(modelMatrix3, modelMatrix3, [
		-6,
		playerCount >= 2 ? 0 : -100,
		-progress[1] * progressMult,
	]);
	let modelMatrix4 = glm.mat4.create();
	glm.mat4.translate(modelMatrix4, modelMatrix4, [
		-9,
		playerCount >= 3 ? 0 : -100,
		-progress[2] * progressMult,
	]);


	var light1: Light = {
		exists: true,
		position: [0.0, 15.0, 0.0],
		color: [0.5, 0.5, 0.5],
		is_spotlight: false,
	};
	var light2: Light = {
		exists: true,
		position: [0.0, 15.0, 0.0],
		color: [0.5, 0.5, 0.5],
		is_spotlight: false,
	};
	var light3: Light = {
		exists: true,
		position: [0.0, 15.0, 0.0],
		color: [0.5, 0.5, 0.5],
		is_spotlight: false,
	};
	var light4: Light = {
		exists: false
	};

	if(light1.position===undefined)
		return
	let light1Temp:glm.vec4 = [light1.position[0], light1.position[1], light1.position[2]]
	glm.vec4.transformMat4(light1Temp,light1Temp,modelMatrix2)
	light1.position = [light1Temp[0]/light1Temp[3],light1Temp[1]/light1Temp[3],light1Temp[2]/light1Temp[3]]

	if(light2.position===undefined)
		return
	let light2Temp:glm.vec4 = [light2.position[0], light2.position[1], light2.position[2]]
	glm.vec4.transformMat4(light2Temp,light2Temp,modelMatrix2)
	light2.position = [light2Temp[0]/light2Temp[3],light2Temp[1]/light2Temp[3],light2Temp[2]/light2Temp[3]]

	if(light3.position===undefined)
		return
	let light3Temp:glm.vec4 = [light3.position[0], light3.position[1], light3.position[2]]
	glm.vec4.transformMat4(light3Temp,light3Temp,modelMatrix2)
	light3.position = [light3Temp[0]/light3Temp[3],light3Temp[1]/light3Temp[3],light3Temp[2]/light3Temp[3]]

	var lights: Light[] = [light0, light1, light2, light3, light4];

	for (let i = 0; i < num_lights; i++) {
		let string_name = "lights[" + i + "].";
		gl.uniform1i(
			programInfo.uniformLocations[string_name + "exists"],
			lights[i].exists ? 1 : 0
		);

		if (!lights[i].exists) break;

		gl.uniform3fv(
			programInfo.uniformLocations[string_name + "position"],
			new Float32Array(lights[i].position ?? [])
		);
		gl.uniform3fv(
			programInfo.uniformLocations[string_name + "color"],
			new Float32Array(lights[i].color ?? [])
		);
		gl.uniform1i(
			programInfo.uniformLocations[string_name + "is_spotlight"],
			(lights[i].is_spotlight ?? false) ? 1 : 0
		);

		if (!(lights[i].is_spotlight ?? false)) break;
		gl.uniform3fv(
			programInfo.uniformLocations[string_name + "a"],
			new Float32Array(lights[i].a ?? [])
		);
		gl.uniform1f(
			programInfo.uniformLocations[string_name + "theta"],
			lights[i].theta ?? 0
		);
		gl.uniform1f(
			programInfo.uniformLocations[string_name + "alpha"],
			lights[i].alpha ?? 0
		);
	}
}

function sendMaterials(
	gl: WebGLRenderingContext,
	programInfo: ProgramInfo,
	actors: Actor[]
) {
	for (let i = 0; i < actors.length; i++) {
		let currBuff = actors[i].buffers;
		for (const [name, index] of Object.entries(
			currBuff.materialNameToIndex
		)) {
			if (Object.keys(currBuff.materials).length === 0) continue;
			let string_name = "materials[" + index + "].";
			gl.uniform3fv(
				programInfo.uniformLocations[string_name + "ka"],
				new Float32Array(currBuff.materials[name].Ka)
			);
			gl.uniform3fv(
				programInfo.uniformLocations[string_name + "kd"],
				new Float32Array(currBuff.materials[name].Kd)
			);
			gl.uniform3fv(
				programInfo.uniformLocations[string_name + "ks"],
				new Float32Array(currBuff.materials[name].Ks)
			);

			gl.uniform1f(
				programInfo.uniformLocations[string_name + "Ns"],
				currBuff.materials[name].Ns
			);

			gl.uniform1f(
				programInfo.uniformLocations[string_name + "d"],
				currBuff.materials[name].d
			);
		}
	}
}

/* Methods to Set Attributes */

// Tell WebGL how to pull out the positions from the position buffer into the vertexPosition attribute.
function setPositionAttribute(
	gl: WebGLRenderingContext,
	buffers: InitBufferReturn,
	programInfo: ProgramInfo
) {
	const numComponents = 3; // pull out 3 values per iteration
	const type = gl.FLOAT; // the data in the buffer is 32bit floats
	const normalize = false; // don't normalize
	const stride = 0; // how many bytes to get from one set of values to the next
	const offset = 0; // how many bytes inside the buffer to start from
	gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
	gl.vertexAttribPointer(
		programInfo.attribLocations.vertexPosition,
		numComponents,
		type,
		normalize,
		stride,
		offset
	);
	gl.enableVertexAttribArray(programInfo.attribLocations.vertexPosition);
}

// tell webgl how to pull out the texture coordinates from buffer
function setTextureAttribute(
	gl: WebGLRenderingContext,
	buffers: InitBufferReturn,
	programInfo: ProgramInfo
) {
	const num = 2; // every coordinate composed of 2 values
	const type = gl.FLOAT; // the data in the buffer is 32-bit float
	const normalize = false; // don't normalize
	const stride = 0; // how many bytes to get from one set to the next
	const offset = 0; // how many bytes inside the buffer to start from
	gl.bindBuffer(gl.ARRAY_BUFFER, buffers.textureCoord);
	gl.vertexAttribPointer(
		programInfo.attribLocations.textureCoord,
		num,
		type,
		normalize,
		stride,
		offset
	);
	gl.enableVertexAttribArray(programInfo.attribLocations.textureCoord);
}

// Tell WebGL how to pull out the normals from the normal buffer into the vertexNormal attribute.
function setNormalAttribute(
	gl: WebGLRenderingContext,
	buffers: InitBufferReturn,
	programInfo: ProgramInfo
) {
	const numComponents = 3;
	const type = gl.FLOAT;
	const normalize = false;
	const stride = 0;
	const offset = 0;
	gl.bindBuffer(gl.ARRAY_BUFFER, buffers.normal);
	gl.vertexAttribPointer(
		programInfo.attribLocations.vertexNormal,
		numComponents,
		type,
		normalize,
		stride,
		offset
	);
	gl.enableVertexAttribArray(programInfo.attribLocations.vertexNormal);
}

function setMaterialIndexAttribute(
	gl: WebGLRenderingContext,
	buffers: InitBufferReturn,
	programInfo: ProgramInfo
) {
	const materialIndexBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, materialIndexBuffer);
	gl.bufferData(
		gl.ARRAY_BUFFER,
		new Float32Array(buffers.materialIndices),
		gl.STATIC_DRAW
	);

	const numComponents = 1;
	const type = gl.FLOAT;
	const normalize = false;
	const stride = 0;
	const offset = 0;
	gl.bindBuffer(gl.ARRAY_BUFFER, materialIndexBuffer);
	gl.vertexAttribPointer(
		programInfo.attribLocations.materialIndex,
		numComponents,
		type,
		normalize,
		stride,
		offset
	);
	gl.enableVertexAttribArray(programInfo.attribLocations.materialIndex);
}

function cameraRotate(
	deltaX: number,
	deltaY: number,
	eye: glm.vec3,
	up: glm.vec3,
	center: glm.vec3,
	localUpp: glm.vec3 | undefined = undefined
): [glm.vec3, glm.vec3] {
	let wVector: glm.vec3 = divideVec(
		glm.vec3.subtract([0, 0, 0], eye, center),
		glm.vec3.length(glm.vec3.subtract([0, 0, 0], eye, center))
	);
	let localRight: glm.vec3 = divideVec(
		glm.vec3.cross([0, 0, 0], up, wVector),
		glm.vec3.length(glm.vec3.cross([0, 0, 0], up, wVector))
	);
	let localUp: glm.vec3 = glm.vec3.cross([0, 0, 0], wVector, localRight);
	if (localUpp !== undefined) {
		localUp = localUpp;
		wVector = divideVec(
			glm.vec3.subtract([0, 0, 0], eye, center),
			glm.vec3.length(glm.vec3.subtract([0, 0, 0], eye, center))
		);
		localRight = divideVec(
			glm.vec3.cross([0, 0, 0], localUp, wVector),
			glm.vec3.length(glm.vec3.cross([0, 0, 0], localUp, wVector))
		);
	}

	let a: glm.vec3 = glm.vec3.subtract([0, 0, 0], eye, center);
	let rotMatrixLocalRight: glm.mat3 = glm.mat4.rotate(
		glm.mat4.create(),
		glm.mat4.create(),
		toRadian(15.0 * deltaY * 0.1),
		localRight
	);
	let rotMatrixGlobalUp: glm.mat3 = glm.mat4.rotate(
		glm.mat4.create(),
		glm.mat4.create(),
		toRadian(15.0 * deltaX * 0.1),
		up
	);
	let aNew: glm.vec3 = glm.vec3.transformMat4(
		glm.vec3.create(),
		a,
		glm.mat4.multiply(
			glm.mat4.create(),
			rotMatrixGlobalUp,
			rotMatrixLocalRight
		)
	); //rotMatrixGlobalUp  * rotMatrixLocalRight * a;
	localUp = glm.vec3.transformMat4(
		glm.vec3.create(),
		localUp,
		glm.mat4.multiply(
			glm.mat4.create(),
			rotMatrixGlobalUp,
			rotMatrixLocalRight
		)
	); //rotMatrixGlobalUp  * rotMatrixLocalRight * localUp;
	glm.vec3.add(eye, center, aNew);

	// let wVector:glm.vec3 = divideVec((glm.vec3.subtract([0,0,0],eye, center)),glm.vec3.length((glm.vec3.subtract([0,0,0], eye,center))));
	// let localRight:glm.vec3 = divideVec(glm.vec3.cross([0,0,0],up, wVector),glm.vec3.length(glm.vec3.cross([0,0,0],up, wVector)));
	// let localUp:glm.vec3 = glm.vec3.cross([0,0,0],wVector, localRight);

	// let a:glm.vec3 = glm.vec3.subtract([0,0,0],eye, center);
	// let rotMatrixLocalRight:glm.mat3 = glm.mat4.rotate(glm.mat4.create(), glm.mat4.create(), toRadian(15.0 * deltaY * 0.1), localRight);
	// let rotMatrixGlobalUp:glm.mat3 = glm.mat4.rotate(glm.mat4.create(), glm.mat4.create(), toRadian(15.0 * deltaX * 0.1), up);
	// let aNew:glm.vec3 = glm.vec3.transformMat3(glm.vec3.create(),glm.vec3.transformMat4(glm.vec3.create(), a, rotMatrixLocalRight),rotMatrixGlobalUp);//rotMatrixGlobalUp  * rotMatrixLocalRight * a;
	// localUp = glm.vec3.transformMat3(glm.vec3.create(),glm.vec3.transformMat4(glm.vec3.create(), localUp, rotMatrixLocalRight),rotMatrixGlobalUp)
	// glm.vec3.add(eye, center, (aNew));
	return [eye, localUp];
}

function cameraTranslate(
	deltaX: number,
	deltaY: number,
	eye: glm.vec3,
	up: glm.vec3,
	center: glm.vec3
): [glm.vec3, glm.vec3] {
	let wVector: glm.vec3 = divideVec(
		glm.vec3.subtract([0, 0, 0], eye, center),
		glm.vec3.length(glm.vec3.subtract([0, 0, 0], eye, center))
	);
	let localRight: glm.vec3 = divideVec(
		glm.vec3.cross([0, 0, 0], up, wVector),
		glm.vec3.length(glm.vec3.cross([0, 0, 0], up, wVector))
	);
	let localUp: glm.vec3 = glm.vec3.cross([0, 0, 0], wVector, localRight);

	glm.vec3.add(eye, eye, multiplyVec(localRight, deltaX * 0.01));
	glm.vec3.add(center, center, multiplyVec(localRight, deltaX * 0.01));

	glm.vec3.add(eye, eye, multiplyVec(localUp, deltaY * 0.01));
	glm.vec3.add(center, center, multiplyVec(localUp, deltaY * 0.01));

	return [eye, center];
}

function computeBezier(
	start: glm.vec3,
	end: glm.vec3,
	delta: number
): glm.vec3 {
	// Bezier Functions
	let B0 = (1 - delta) * (1 - delta) * (1 - delta);
	let B1 = 3 * delta * (1 - delta) * (1 - delta);
	let B2 = 3 * delta * delta * (1 - delta);
	let B3 = delta * delta * delta;

	// Points
	let P0: glm.vec3 = start;
	let P1: glm.vec3 = glm.vec3.subtract(glm.vec3.create(), start, [0, 0, 0]);
	P1[1] *= -1;
	glm.vec3.add(P1, P1, start);
	let P3: glm.vec3 = end;
	let P2: glm.vec3 = glm.vec3.subtract(glm.vec3.create(), end, P1);
	glm.vec3.normalize(P2, P2);
	glm.vec3.add(P2, P2, end);

	// Result
	const result: glm.vec3 = addVecs(
		addVecs(multiplyVec(P0, B0), multiplyVec(P1, B1)),
		addVecs(multiplyVec(P2, B2), multiplyVec(P3, B3))
	);
	return result;
}

export function toRadian(degrees: number) {
	return (degrees * Math.PI) / 180.0;
}

function addVecs(vec1: glm.vec3, vec2: glm.vec3): glm.vec3 {
	const answer = [vec1[0] + vec2[0], vec1[1] + vec2[1], vec1[2] + vec2[2]];
	return answer;
}

function multiplyVec(vec: glm.vec3, num: number): glm.vec3 {
	const answer = [vec[0] * num, vec[1] * num, vec[2] * num];
	return answer;
}

function divideVec(vec: glm.vec3, num: number): glm.vec3 {
	const answer = [vec[0] / num, vec[1] / num, vec[2] / num];
	return answer;
}

function multiplyVec4(vec: glm.vec4, num: number): glm.vec4 {
	const answer = [vec[0] * num, vec[1] * num, vec[2] * num, vec[3] / num];
	return answer;
}

function divideVec4(vec: glm.vec4, num: number): glm.vec4 {
	const answer = [vec[0] / num, vec[1] / num, vec[2] / num, vec[3] / num];
	return answer;
}

export { drawScene, setStage, setPlayerCount };
