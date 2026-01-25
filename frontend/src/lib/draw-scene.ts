import * as glm from "gl-matrix";
import type { InitBufferReturn } from "./init-buffers.ts";
import type { ProgramInfo, Actor } from "./render-start.ts";

interface Light {
  exists:boolean;
  position?:number[];
  color?:number[];
  is_spotlight?:boolean;
  a?:number[];
  theta?:number;
  alpha?:number;
}

function drawScene(gl:WebGLRenderingContext, programInfo:ProgramInfo, actors:Actor[], cubeRotation:number) {
  // SETTING -> if want different background, change here
  gl.clearColor(0.5, 0.5, 0.5, 1.0); // Set Background: rgb, transparency
  gl.clearDepth(1.0); // Clear everything
  gl.enable(gl.DEPTH_TEST); // Enable depth testing
  gl.depthFunc(gl.LEQUAL); // Near things obscure far things
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT); // Clear canvas

  const [viewMatrix, eye] = createViewMatrix()
  const projectionMatrix = createProjectionMatrix(gl);

  /* Stuff independent of current actor */
  for(let i=0; i<actors.length; i++)
  {
    actors[i].modelMatrix = createModelMatrix(gl, 0, i, cubeRotation);
  }

  // Tell WebGL to use our program when drawing
  gl.useProgram(programInfo.program);

  gl.uniformMatrix4fv(programInfo.uniformLocations.projectionMatrix, false, projectionMatrix);
  gl.uniformMatrix4fv(programInfo.uniformLocations.viewMatrix, false, viewMatrix);
  gl.uniform3fv(programInfo.uniformLocations.eye, new Float32Array(eye));

  sendLights(gl, programInfo)
  sendMaterials(gl, programInfo, actors)

  /* Stuff dependent on current actor */
  for(let i=0; i<actors.length; i++)
  {
    let curr = actors[i];
    // Sending model and normal matrices
    const normalMatrix = glm.mat4.create();
    glm.mat4.invert(normalMatrix, curr.modelMatrix ?? glm.mat4.create());
    glm.mat4.transpose(normalMatrix, normalMatrix);
    gl.uniformMatrix4fv(programInfo.uniformLocations.modelMatrix, false, curr.modelMatrix ?? glm.mat4.create());
    gl.uniformMatrix4fv(programInfo.uniformLocations.normalMatrix, false, normalMatrix,);

    // Tell WebGL how to pull out stuff from the buffers into the shader's attribute variable.
    setPositionAttribute(gl, curr.buffers, programInfo);
    setTextureAttribute(gl, curr.buffers, programInfo);
    setNormalAttribute(gl, curr.buffers, programInfo);
    setMaterialIndexAttribute(gl, curr.buffers, programInfo);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, curr.buffers.indices); // Tell WebGL which indices to use to index the vertices

    // Texture
    if(curr.texture!=undefined)
    {
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
  }
}

// SETTING -> can change transformations
function createModelMatrix(gl:WebGLRenderingContext, stage:number, iteration:number, cubeRotation:number):glm.mat4
{
  const modelMatrix = glm.mat4.create();
  if(stage==0)
  {
    // Car 1
    if(iteration==0)
    {
      glm.mat4.translate(modelMatrix, modelMatrix, 
        [-0.0, -2, -7.0]);
      glm.mat4.rotate(modelMatrix,modelMatrix,
        cubeRotation,
        [0, 1, 0]);
    }
    // Car 2
    else if(iteration==1)
    {
      glm.mat4.translate(modelMatrix, modelMatrix, 
        [-3.0, 2, -7.0]);
      glm.mat4.rotate(modelMatrix,modelMatrix,
        cubeRotation,
        [0, 1, 0]);
    }
    else if(iteration==2)
    {
      glm.mat4.translate(modelMatrix, modelMatrix, 
        [3.0, -2, -5.0]);
      glm.mat4.rotate(modelMatrix,modelMatrix,
        cubeRotation,
        [0, 1, 0]);
    }
  }
  return modelMatrix;
}

// SETTING -> can change fov, aspect ratio, and other camera style settings
function createProjectionMatrix(gl:WebGLRenderingContext):glm.mat4
{
  const fieldOfView = (45 * Math.PI) / 180; // in radians
  const aspect = (gl.canvas as HTMLCanvasElement).clientWidth / (gl.canvas as HTMLCanvasElement).clientHeight;
  const zNear = 0.1;
  const zFar = 100.0;

  const projectionMatrix = glm.mat4.create();
  return glm.mat4.perspective(projectionMatrix, fieldOfView, aspect, zNear, zFar);
}

// SETTING -> can change location and orientation of camera
function createViewMatrix() :[glm.mat4, number[]]
{
  const eye = [0.0, 0, 4.0]
  const lookAt = [0.0, 0.0, 0.0]
  const up = [0.0, 1.0, 0.0]
  const viewMatrix = glm.mat4.create();
  return [glm.mat4.lookAt(viewMatrix, eye, lookAt, up), eye];
}

//SETTING -> location of lights
function sendLights(gl:WebGLRenderingContext, programInfo:ProgramInfo) {
const num_lights = 10;
  var light0:Light = {exists:true, position:[20.0, 0.0, -5.0], color:[0.5,0.5,0.5], is_spotlight:false};//true, [0.0, 0.0, -3.0], 0.1, 250];
  var light1:Light = {exists:true, position:[0.0, 10.0, 0.0], color:[0.5,0.5,0.5], is_spotlight:false};
  var light2:Light = {exists:false};

  var lights:Light[] = [light0, light1, light2];

  for(let i=0; i<num_lights; i++)
  {
    let string_name = "lights[" + i + "].";
    gl.uniform1i(
      programInfo.uniformLocations[string_name+"exists"],
      lights[i].exists ? 1 : 0
    );

    if(!lights[i].exists)
        break;

    gl.uniform3fv(
      programInfo.uniformLocations[string_name+"position"],
      new Float32Array(lights[i].position ?? [])
    );
    gl.uniform3fv(
      programInfo.uniformLocations[string_name+"color"],
      new Float32Array(lights[i].color ?? [])
    );
    gl.uniform1i(
      programInfo.uniformLocations[string_name+"is_spotlight"],
      (lights[i].is_spotlight ?? false) ? 1 : 0
    );

    if(!(lights[i].is_spotlight ?? false))
      break;
    gl.uniform3fv(
      programInfo.uniformLocations[string_name+"a"],
      new Float32Array(lights[i].a ?? [])
    );
    gl.uniform1f(
      programInfo.uniformLocations[string_name+"theta"],
      lights[i].theta ?? 0
    );
    gl.uniform1f(
      programInfo.uniformLocations[string_name+"alpha"],
      lights[i].alpha ?? 0
    );
  }
}

function sendMaterials(gl:WebGLRenderingContext, programInfo:ProgramInfo, actors:Actor[])
{
  for(let i=0; i<actors.length; i++)
  {
    let currBuff = actors[i].buffers
    for(const [name, index] of Object.entries(currBuff.materialNameToIndex))
    {
      if(Object.keys(currBuff.materials).length === 0)
        continue;
      let string_name = "materials[" + index + "].";
      gl.uniform3fv(
        programInfo.uniformLocations[string_name+"ka"],
        new Float32Array(currBuff.materials[name].Ka)
      );
      gl.uniform3fv(
        programInfo.uniformLocations[string_name+"kd"],
        new Float32Array(currBuff.materials[name].Kd)
      );
      gl.uniform3fv(
        programInfo.uniformLocations[string_name+"ks"],
        new Float32Array(currBuff.materials[name].Ks)
      );

      gl.uniform1f(
          programInfo.uniformLocations[string_name+"Ns"],
          currBuff.materials[name].Ns
      );

      gl.uniform1f(
          programInfo.uniformLocations[string_name+"d"],
          currBuff.materials[name].d
      );
    }
  }
}

/* Methods to Set Attributes */

// Tell WebGL how to pull out the positions from the position buffer into the vertexPosition attribute.
function setPositionAttribute(gl:WebGLRenderingContext, buffers:InitBufferReturn, programInfo:ProgramInfo) {
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
function setTextureAttribute(gl:WebGLRenderingContext, buffers:InitBufferReturn, programInfo:ProgramInfo) {
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
    offset,
  );
  gl.enableVertexAttribArray(programInfo.attribLocations.textureCoord);
}

// Tell WebGL how to pull out the normals from the normal buffer into the vertexNormal attribute.
function setNormalAttribute(gl:WebGLRenderingContext, buffers:InitBufferReturn, programInfo:ProgramInfo) {
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
    offset,
  );
  gl.enableVertexAttribArray(programInfo.attribLocations.vertexNormal);
}


function setMaterialIndexAttribute(gl:WebGLRenderingContext, buffers:InitBufferReturn, programInfo:ProgramInfo) {
  const materialIndexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, materialIndexBuffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array(buffers.materialIndices),
    gl.STATIC_DRAW,
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
    offset,
  );
  gl.enableVertexAttribArray(programInfo.attribLocations.materialIndex);
}

export { drawScene };