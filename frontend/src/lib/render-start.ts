import { initBuffers, type InitBufferReturn } from "./init-buffers.ts";
import { drawScene } from "./draw-scene.ts";
import { initShaderProgram } from "./shaders.ts";
import * as glm from "gl-matrix";

interface ProgramInfo {
	program: WebGLProgram;
	attribLocations: {
		vertexPosition: number;
		vertexNormal: number;
		textureCoord: number;
		materialIndex: number;
	};
	uniformLocations: {
		projectionMatrix: WebGLUniformLocation | null;
		modelMatrix: WebGLUniformLocation | null;
		viewMatrix: WebGLUniformLocation | null;
		normalMatrix: WebGLUniformLocation | null;
		uSampler: WebGLUniformLocation | null;
		eye: WebGLUniformLocation | null;
		[key: string]: WebGLUniformLocation | null;
	};
}

interface Actor {
	buffers: InitBufferReturn;
	texture?: WebGLTexture;
	modelMatrix?: glm.mat4;
	overrideTextureName?: string;
	overrideNoTextureColor?: glm.vec3;
	type: string;
}

async function main(canvas: HTMLCanvasElement) {
	// Gradbbing gl
	const gl: WebGLRenderingContext | null = canvas.getContext("webgl");

	if (gl === null) {
		alert(
			"Unable to initialize WebGL. Your browser or machine may not support it."
		);
		return;
	}

	// Initialize a shader program
	const shaderProgram: WebGLProgram | null = initShaderProgram(gl);
	if (shaderProgram === null) {
		alert("Unable to initialize shader. D:");
		return;
	}

	// Grabbing locations of variables in the shader program
	const programInfo: ProgramInfo = {
		program: shaderProgram,
		attribLocations: {
			vertexPosition: gl.getAttribLocation(
				shaderProgram,
				"aVertexPosition"
			),
			vertexNormal: gl.getAttribLocation(shaderProgram, "aVertexNormal"),
			textureCoord: gl.getAttribLocation(shaderProgram, "aTextureCoord"),
			materialIndex: gl.getAttribLocation(
				shaderProgram,
				"aMaterialIndex"
			),
		},
		uniformLocations: {
			projectionMatrix: gl.getUniformLocation(
				shaderProgram,
				"uProjectionMatrix"
			),
			modelMatrix: gl.getUniformLocation(shaderProgram, "uModelMatrix"),
			viewMatrix: gl.getUniformLocation(shaderProgram, "uViewMatrix"),
			normalMatrix: gl.getUniformLocation(shaderProgram, "uNormalMatrix"),
			uSampler: gl.getUniformLocation(shaderProgram, "uSampler"),
			eye: gl.getUniformLocation(shaderProgram, "eye"),
		},
	};

	const num_lights = 10;
	for (let i = 0; i < num_lights; i++) {
		let string_name = "lights[" + i + "].";
		programInfo.uniformLocations[string_name + "exists"] =
			gl.getUniformLocation(shaderProgram, string_name + "exists");
		programInfo.uniformLocations[string_name + "position"] =
			gl.getUniformLocation(shaderProgram, string_name + "position");
		programInfo.uniformLocations[string_name + "color"] =
			gl.getUniformLocation(shaderProgram, string_name + "color");
		programInfo.uniformLocations[string_name + "is_spotlight"] =
			gl.getUniformLocation(shaderProgram, string_name + "is_spotlight");
		programInfo.uniformLocations[string_name + "a"] = gl.getUniformLocation(
			shaderProgram,
			string_name + "a"
		);
		programInfo.uniformLocations[string_name + "theta"] =
			gl.getUniformLocation(shaderProgram, string_name + "theta");
		programInfo.uniformLocations[string_name + "alpha"] =
			gl.getUniformLocation(shaderProgram, string_name + "alpha");
	}

	const num_mtls = 10;
	for (let i = 0; i < num_mtls; i++) {
		let string_name = "materials[" + i + "].";
		programInfo.uniformLocations[string_name + "ka"] =
			gl.getUniformLocation(shaderProgram, string_name + "ka");
		programInfo.uniformLocations[string_name + "kd"] =
			gl.getUniformLocation(shaderProgram, string_name + "kd");
		programInfo.uniformLocations[string_name + "ks"] =
			gl.getUniformLocation(shaderProgram, string_name + "ks");
		programInfo.uniformLocations[string_name + "Ns"] =
			gl.getUniformLocation(shaderProgram, string_name + "Ns");
		programInfo.uniformLocations[string_name + "d"] = gl.getUniformLocation(
			shaderProgram,
			string_name + "d"
		);
	}

	// SETTING -> if want more objects, add below
	// Creating buffers for each object want
	const carBuffers: InitBufferReturn | undefined = await initBuffers(
		gl,
		"car_no_wheels.obj",
		"FREE_CAR_01.mtl"
	);
	const cubeBuffers: InitBufferReturn | undefined = await initBuffers(
		gl,
		"cube.obj",
		"Floor.mtl"
	);
	const wheelBuffer: InitBufferReturn | undefined = await initBuffers(
		gl,
		"wheel.obj",
		"FREE_CAR_01.mtl"
	);
	if (
		carBuffers === undefined ||
		cubeBuffers === undefined ||
		wheelBuffer === undefined
	) {
		alert("Buffers were not intialized!!!!!!!!!!!!11!!!!1");
		return;
	}

	var actors: Actor[] = [];
	actors.push({ buffers: carBuffers, type: "Car" });
	actors.push({ buffers: carBuffers, type: "Car" });
	actors[1].overrideTextureName = "002_COLOR_BASIC.png";
	actors.push({ buffers: cubeBuffers,type:"Floor" });
	actors[2].overrideNoTextureColor = [10, 10, 10, 255];
	actors.push({ buffers: carBuffers, type: "Car" });
	actors.push({ buffers: carBuffers, type: "Car" });
	actors.push({ buffers: wheelBuffer, type: "Wheel" });

	// Load texture based on the value in map_Kd. No texture defaults to blue
	actors.forEach((actor) => {
		const currMtl = actor.buffers.materials;

		if (actor.overrideTextureName !== undefined) // Override Texture
		{
			const texture_path: string = "/" + actor.overrideTextureName;
			actor.texture = loadTexture(gl, texture_path);
		} else if (actor.overrideNoTextureColor !== undefined) {
			actor.texture = loadTexture(gl, "", actor.overrideNoTextureColor);
		} else if (Object.keys(currMtl).length === 0) // No Texture
		{
			actor.texture = loadTexture(gl, "");
		} else // Yes Texture
		{
			const texture_name: string =
				currMtl[Object.keys(currMtl)[0]].map_Kd;
			const texture_path: string = "/" + texture_name;
			actor.texture = loadTexture(gl, texture_path);
		}
	});
	gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

	// Draw the scene repeatedly
	let cubeRotation: number = 0.0;
	let deltaTime: number = 0;
	let then: DOMHighResTimeStamp = 0;

	function render(now: DOMHighResTimeStamp) {
		now *= 0.001; // convert to seconds
		deltaTime = now - then;
		then = now;

		if (gl === null) {
			alert("Unable to initialize WebGL again???");
			return;
		}

		drawScene(gl, programInfo, actors, cubeRotation, deltaTime);
		cubeRotation += deltaTime;
		requestAnimationFrame(render);
	}

	requestAnimationFrame(render);
}

// Initialize a texture and load an image. When the image finished loading copy it into the texture.
function loadTexture(
	gl: WebGLRenderingContext,
	url: string,
	rgba: glm.vec4 = [0, 0, 255, 255]
) {
	const texture = gl.createTexture();
	gl.bindTexture(gl.TEXTURE_2D, texture);

	// Because images have to be downloaded over the internet
	// they might take a moment until they are ready.
	// Until then put a single pixel in the texture so we can
	// use it immediately. When the image has finished downloading
	// we'll update the texture with the contents of the image.
	const level = 0;
	const internalFormat = gl.RGBA;
	const width = 1;
	const height = 1;
	const border = 0;
	const srcFormat = gl.RGBA;
	const srcType = gl.UNSIGNED_BYTE;
	const pixel = new Uint8Array(rgba); // opaque blue
	// console.log("pixel " + pixel);
	gl.texImage2D(
		gl.TEXTURE_2D,
		level,
		internalFormat,
		width,
		height,
		border,
		srcFormat,
		srcType,
		pixel
	);

	if (url === "") return texture;

	const image = new Image();
	image.onload = () => {
		gl.bindTexture(gl.TEXTURE_2D, texture);
		gl.texImage2D(
			gl.TEXTURE_2D,
			level,
			internalFormat,
			srcFormat,
			srcType,
			image
		);

		function isPowerOf2(value: number) {
			return (value & (value - 1)) === 0;
		}

		// WebGL1 has different requirements for power of 2 images
		// vs. non power of 2 images so check if the image is a
		// power of 2 in both dimensions.
		if (isPowerOf2(image.width) && isPowerOf2(image.height)) {
			// Yes, it's a power of 2. Generate mips.
			gl.generateMipmap(gl.TEXTURE_2D);
		} else {
			console.log("not power of 2 jvr");
			// No, it's not a power of 2. Turn off mips and set
			// wrapping to clamp to edge
			gl.texParameteri(
				gl.TEXTURE_2D,
				gl.TEXTURE_WRAP_S,
				gl.CLAMP_TO_EDGE
			);
			gl.texParameteri(
				gl.TEXTURE_2D,
				gl.TEXTURE_WRAP_T,
				gl.CLAMP_TO_EDGE
			);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
		}
	};
	image.src = url;

	return texture;
}

export { main, type ProgramInfo, type Actor };
