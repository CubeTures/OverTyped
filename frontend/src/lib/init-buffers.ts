import * as OBJ from "webgl-obj-loader";

interface InitBufferReturn {
	position: OBJ.ExtendedGLBuffer;
	normal: OBJ.ExtendedGLBuffer;
	textureCoord: OBJ.ExtendedGLBuffer;
	indices: OBJ.ExtendedGLBuffer;
	materialIndices: number[];
	materialNameToIndex: OBJ.MaterialNameToIndex;
	materials: {
		[key: string]: Material;
	};
}

interface Material {
	Ns: number;
	Ka: number[];
	Kd: number[];
	Ks: number[];
	d: number;
	map_Kd: string;
	[key: string]: any;
}

async function initBuffers(
	gl: WebGLRenderingContext,
	id_of_file: string,
	id_of_material_file: string = ""
): Promise<InitBufferReturn | undefined> {
	const objFile = await fetch(id_of_file);
	const objStr = await objFile.text();
	if (objStr === undefined) {
		alert(
			"Could not find string to init buffers! string was:" + id_of_file
		);
		return;
	}

	var mesh: OBJ.Mesh = new OBJ.Mesh(objStr);
	OBJ.initMeshBuffers(gl, mesh);

	const positionBuffer: OBJ.ExtendedGLBuffer = (mesh as OBJ.MeshWithBuffers)
		.vertexBuffer;
	const textureCoordBuffer: OBJ.ExtendedGLBuffer = (
		mesh as OBJ.MeshWithBuffers
	).textureBuffer;
	const indexBuffer: OBJ.ExtendedGLBuffer = (mesh as OBJ.MeshWithBuffers)
		.indexBuffer;
	const normalBuffer: OBJ.ExtendedGLBuffer = (mesh as OBJ.MeshWithBuffers)
		.normalBuffer;

	// Material Stuff
	const materialIndexBuffer: number[] = mesh.vertexMaterialIndices;
	const materialNameToIndexBuffer = mesh.materialIndices;
	const materials = await initMaterials(id_of_material_file);

	// Logging for testing purposes, TODO -> delete this
	console.log(mesh);
	console.log((mesh as OBJ.MeshWithBuffers).vertexBuffer);
	console.log((mesh as OBJ.MeshWithBuffers).textureBuffer);
	console.log((mesh as OBJ.MeshWithBuffers).indexBuffer);
	console.log((mesh as OBJ.MeshWithBuffers).normalBuffer);
	console.log(materialIndexBuffer);
	console.log(materialNameToIndexBuffer);
	console.log(materials);
	console.log("buffers initialized");

	return {
		position: positionBuffer,
		normal: normalBuffer,
		textureCoord: textureCoordBuffer,
		indices: indexBuffer,
		materialIndices: materialIndexBuffer,
		materialNameToIndex: materialNameToIndexBuffer,
		materials: materials,
	};
}

async function initMaterials(id_of_material_file: string) {
	// If don't have a material file, just return
	if (id_of_material_file == "") return {};

	const mtlFile = await fetch(id_of_material_file);
	const mtlString = await mtlFile.text();
	console.log(mtlString);
	if (mtlString === undefined) {
		alert(
			"Could not find string to init material file! string was:" +
				id_of_material_file
		);
		return {};
	}
	let unprocessed_materials = mtlString.split("newmtl ");
	const properties_with_three_values = new Set(["Ka", "Kd", "Ks"]);

	var materials: { [key: string]: Material } = {};

	for (let i = 1; i < unprocessed_materials.length; i++) {
		const properties = unprocessed_materials[i].split("\n");
		var material: Material = {
			Ns: 0.0,
			Ka: [0.0, 0.0, 0.0],
			Kd: [0.0, 0.0, 0.0],
			Ks: [0.0, 0.0, 0.0],
			d: 1.0,
			map_Kd: "",
		};

		for (let j = 1; j < properties.length; j++) {
			const splut = properties[j].split(" ");
			if (splut[0] in material) {
				if (properties_with_three_values.has(splut[0]))
					material[splut[0]] = [splut[1], splut[2], splut[3]];
				else material[splut[0]] = splut[1];
			}
		}
		// name of material -> material info
		materials[properties[0]] = material;
	}
	return materials;
}

export { initBuffers };
export type { InitBufferReturn, Material };
