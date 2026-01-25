import * as glm from "gl-matrix";
import type { ProgramInfo, Actor } from "./render-start.ts";
import { toRadian } from "./draw-scene.ts";

const state = {
    progress: [] as number[],
    // stage: 'race' as 'orbit' | 'race',
};

export default state;

export function quadInterp(a: number, b: number, t: number): number {
    const x = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    return (b - a) * x + a;
}

/*
export function rendercars(
	gl: WebGLRenderingContext,
	programInfo: ProgramInfo,
	actors: Actor[],
    timestep: number
) {
    let modelMatrix = glm.mat4.create();
    actors[0].modelMatrix = glm.mat4.translate(modelMatrix, modelMatrix, [0, 0, 0]);
    actors[0].modelMatrix = glm.mat4.rotateY(modelMatrix, modelMatrix, toRadian(90));
    for (let i = 1; i <= 3; ++i) {
        modelMatrix = glm.mat4.create();
        actors[i].modelMatrix = glm.mat4.translate(modelMatrix, modelMatrix, [0, 0, -3 * i]);
        actors[i].modelMatrix = glm.mat4.rotateY(modelMatrix, modelMatrix, toRadian(90));
    }
}
*/
